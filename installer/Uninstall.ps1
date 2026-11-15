# Codes & Ciphers Studio - uninstall helper (run by the Windows uninstaller)
$ErrorActionPreference = 'SilentlyContinue'
try { Unregister-ScheduledTask -TaskName 'Codes & Ciphers Studio - keep running' -Confirm:$false -ErrorAction Stop } catch { schtasks.exe /Delete /TN 'Codes & Ciphers Studio - keep running' /F 2>$null | Out-Null }
Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" |
    Where-Object { $_.CommandLine -match '\\CodesCiphersStudio\\server\.ps1' -and $_.ProcessId -ne $PID } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-Sleep -Seconds 1
$app = Join-Path $env:LOCALAPPDATA 'CodesCiphersStudio'
if (Test-Path $app) { Remove-Item $app -Recurse -Force }
$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Codes & Ciphers Studio.lnk'
if (Test-Path $lnk) { Remove-Item $lnk -Force }
