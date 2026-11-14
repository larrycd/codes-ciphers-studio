#requires -version 5.1
<#
  Codes & Ciphers Studio installer - by Larry Dalton
  Installs for the current Windows account only (no administrator rights), in %LOCALAPPDATA%\CodesCiphersStudio.
  Steps: back up any previous version, free port 8771 only if the previous Codes & Ciphers Studio holds it,
  copy the files, start the server, verify it over HTTP, add a sign-in shortcut, open the studio.
  On any failure the previous version is restored. The result is written to %TEMP%\CodesCiphersStudio-install-result.txt.
#>
param(
    [string]$Source = '',
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$Port = 8771
$Version = '1.1.0'
$ResultFile = Join-Path $env:TEMP 'CodesCiphersStudio-install-result.txt'
if (-not $Source) { $Source = Join-Path $PSScriptRoot 'payload' }
$App = Join-Path $env:LOCALAPPDATA 'CodesCiphersStudio'
$Startup = [Environment]::GetFolderPath('Startup')
$StartupLnk = Join-Path $Startup 'Codes & Ciphers Studio.lnk'
$PsExe = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$Backup = $null

function Write-Result([string]$Text) { [System.IO.File]::WriteAllText($ResultFile, $Text, [System.Text.Encoding]::ASCII) }
function Step([string]$Text) { Write-Host ('  - ' + $Text) }
function Get-Url([string]$Url, [int]$TimeoutMs = 4000) {
    $rq = [System.Net.WebRequest]::Create($Url)
    $rq.Proxy = $null; $rq.Timeout = $TimeoutMs
    $rs = $rq.GetResponse()
    try {
        $ms = New-Object System.IO.MemoryStream
        $rs.GetResponseStream().CopyTo($ms)
        return , $ms.ToArray()
    } finally { $rs.Close() }
}
function Get-Text([string]$Url) { return [System.Text.Encoding]::UTF8.GetString((Get-Url $Url)) }
function Stop-Studio {
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match '\\CodesCiphersStudio\\server\.ps1' -and $_.ProcessId -ne $PID } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 800
}
function Test-PortFree {
    try { $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port); $l.Start(); $l.Stop(); return $true } catch { return $false }
}
function Start-Studio {
    $srv = Join-Path $App 'server.ps1'
    Start-Process -FilePath $PsExe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', ('"' + $srv + '"')) -WindowStyle Hidden | Out-Null
}

Write-Host ''
Write-Host "Codes & Ciphers Studio $Version installer - by Larry Dalton" -ForegroundColor Yellow
Write-Host ''
try {
    if ($PSVersionTable.PSVersion.Major -lt 5) { throw 'Windows PowerShell 5.1 or later is required.' }
    $files = @('server.ps1', 'app\index.html', 'app\icon.svg', 'app\js\core.js', 'app\js\trans.js', 'app\js\poly.js', 'app\js\misc.js', 'app\js\devices.js', 'app\js\objects.js', 'app\js\objects2.js', 'app\js\objects3.js', 'app\js\ui.js', 'app\data\beale.json', 'app\data\quadgrams.json',
        'app\fonts\CCRunic.ttf', 'app\fonts\CCOgham.ttf', 'app\fonts\CCHiero.ttf', 'app\fonts\CCTengwar.otf', 'app\fonts\CCTheban.otf',
        'app\licenses\AlcarinTengwar-OFL.txt', 'app\licenses\NewGardiner-OFL.txt', 'app\licenses\NotoSansOgham-OFL.txt', 'app\licenses\NotoSansRunic-OFL.txt', 'app\licenses\Theban-public-domain.txt')
    foreach ($f in $files) {
        if (-not (Test-Path -LiteralPath (Join-Path $Source $f))) { throw "Package file missing: $f" }
    }
    Step 'Package files present'

    $hadOld = Test-Path -LiteralPath $App
    Stop-Studio
    if (-not (Test-PortFree)) { throw "Port $Port is in use by another program. Codes & Ciphers Studio did not stop it and did not change the port." }
    Step "Port $Port is free"

    if ($hadOld) {
        $Backup = $App + '-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Move-Item -LiteralPath $App -Destination $Backup
        Step "Previous version backed up to $Backup"
    }
    New-Item -ItemType Directory -Path $App -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $Source 'server.ps1') -Destination $App -Force
    Copy-Item -LiteralPath (Join-Path $Source 'app') -Destination $App -Recurse -Force
    foreach ($f in @('Uninstall.ps1', 'ciphers.ico')) { $p = Join-Path $Source $f; if (Test-Path -LiteralPath $p) { Copy-Item -LiteralPath $p -Destination $App -Force } }
    Step "Files written to $App"

    Start-Studio
    $health = $null
    for ($i = 0; $i -lt 40 -and -not $health; $i++) {
        Start-Sleep -Milliseconds 500
        try { $health = Get-Text "http://localhost:$Port/api/health" } catch { }
    }
    if (-not $health -or $health -notmatch '"Codes & Ciphers Studio"') { throw 'The server did not start (no answer from /api/health).' }
    Step 'Server started'

    $page = Get-Text "http://localhost:$Port/"
    if ($page -notmatch 'Codes &amp; Ciphers Studio') { throw 'The studio page was not served correctly.' }
    $eng = Get-Text "http://localhost:$Port/js/core.js"
    if ($eng -notmatch 'Codes & Ciphers Studio engine') { throw 'The engine was not served correctly.' }
    $registered = 0
    foreach ($js in @('core', 'trans', 'poly', 'misc', 'devices')) { $registered += ([regex]::Matches((Get-Text "http://localhost:$Port/js/$js.js"), 'CC\.reg\(\{ id: |scriptReg\(''')).Count }
    if ($registered -lt 78) { throw "Not all ciphers are present ($registered of 78)." }
    foreach ($ft in @('CCRunic.ttf', 'CCOgham.ttf', 'CCHiero.ttf', 'CCTengwar.otf', 'CCTheban.otf')) {
        $fb = Get-Url "http://localhost:$Port/fonts/$ft"
        $sig = [System.BitConverter]::ToString($fb, 0, 4)
        if ($sig -ne '00-01-00-00' -and $sig -ne '4F-54-54-4F') { throw "Font not served correctly: $ft" }
    }
    $beale = Get-Text "http://localhost:$Port/data/beale.json"
    $bealeNums = ([regex]::Matches(($beale -replace '^.*"beale2":\s*\[', '' -replace '\].*$', ''), '\d+')).Count
    if ($bealeNums -ne 761) { throw "Beale cipher data incomplete ($bealeNums numbers)." }
    $quad = Get-Text "http://localhost:$Port/data/quadgrams.json"
    $quadCount = ([regex]::Matches($quad, '"[A-Z]{4}":')).Count
    if ($quadCount -lt 30000) { throw "Codebreaker letter-group table incomplete ($quadCount groups)." }
    foreach ($rel in $files | Where-Object { $_ -like 'app\*' }) {
        $local = (Get-Item -LiteralPath (Join-Path $App $rel)).Length
        $served = (Get-Url ("http://localhost:$Port/" + $rel.Substring(4).Replace('\', '/')) 30000).Length
        if ($local -ne $served) { throw ('Not served correctly: ' + $rel) }
    }
    $bad = $false; try { Get-Url "http://localhost:$Port/..%5Cserver.ps1" | Out-Null; $bad = $true } catch { }
    if ($bad) { throw 'The server allowed access outside the studio folder.' }
    Step "Verified over HTTP: page, engine with $registered codes and ciphers, 5 script fonts, $bealeNums Beale numbers, $quadCount codebreaker letter groups, every file's size, folder protection"

    $ws = New-Object -ComObject WScript.Shell
    $lnk = $ws.CreateShortcut($StartupLnk)
    $lnk.TargetPath = $PsExe
    $lnk.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $App 'server.ps1') + '"'
    $lnk.WindowStyle = 7
    $lnk.Description = 'Codes & Ciphers Studio server (http://localhost:8771/)'
    $ico = Join-Path $App 'ciphers.ico'; if (Test-Path -LiteralPath $ico) { $lnk.IconLocation = $ico }
    $lnk.Save()
    Step 'Starts automatically when you sign in'

    Write-Result ("OK Codes & Ciphers Studio $Version installed at http://localhost:$Port/")
    Write-Host ''
    Write-Host "Codes & Ciphers Studio is installed and running at http://localhost:$Port/" -ForegroundColor Green
    if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }
    exit 0
}
catch {
    $msg = $_.Exception.Message
    Write-Host ''
    Write-Host ('Install failed: ' + $msg) -ForegroundColor Red
    try {
        Stop-Studio
        if ($Backup -and (Test-Path -LiteralPath $Backup)) {
            if (Test-Path -LiteralPath $App) { Remove-Item -LiteralPath $App -Recurse -Force }
            Move-Item -LiteralPath $Backup -Destination $App
            Start-Studio
            Write-Host 'The previous version has been restored.'
        }
    } catch { Write-Host ('Restore problem: ' + $_.Exception.Message) }
    Write-Result ('FAIL ' + ($msg -replace '[^\x20-\x7E]', '?'))
    exit 1
}
