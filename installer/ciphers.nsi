; Codes & Ciphers Studio - Windows setup (per-user, no administrator rights)
Unicode true
SetCompressor /SOLID lzma
!include "MUI2.nsh"
!include "x64.nsh"
!include "LogicLib.nsh"
!define APPNAME "Codes & Ciphers Studio"
!define VERSION "1.3.0"
!define PUBLISHER "Larry Dalton"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\CodesCiphersStudio"
Name "${APPNAME}"
OutFile "CodesCiphersStudio-Setup.exe"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\CodesCiphersStudio-Setup"
BrandingText "Codes & Ciphers Studio - by Larry Dalton"
VIProductVersion "1.3.0.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "Codes & Ciphers Studio setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "Codes & Ciphers Studio by Larry Dalton"
!define MUI_ICON "ciphers.ico"
!define MUI_UNICON "ciphers.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Codes && Ciphers Studio ${VERSION}"
!define MUI_WELCOMEPAGE_TEXT "100 working codes, ciphers and ways of hiding messages - by Larry Dalton.$\r$\n$\r$\nThis will:$\r$\n  - install Codes && Ciphers Studio for your Windows account (no administrator rights needed)$\r$\n  - start it at sign-in and open it at http://localhost:8771/$\r$\n  - place the Codes && Ciphers Studio infographic on your Desktop$\r$\n$\r$\nA PowerShell window shows the install checks. If any check fails, your previous version is restored automatically."
!define MUI_FINISHPAGE_TITLE "Codes && Ciphers Studio is installed"
!define MUI_FINISHPAGE_TEXT "Codes && Ciphers Studio is running at http://localhost:8771/ and starts automatically when you sign in.$\r$\n$\r$\nThe infographic is on your Desktop:$\r$\n  Codes && Ciphers Studio - How It Works.png"
!define MUI_FINISHPAGE_LINK "Open Codes && Ciphers Studio"
!define MUI_FINISHPAGE_LINK_LOCATION "http://localhost:8771/"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Var PS
Var RES
Function .onInit
  SetShellVarContext current
FunctionEnd
Function un.onInit
  SetShellVarContext current
FunctionEnd
Section "Install"
  SetShellVarContext current
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
  ${EndIf}
  StrCpy $PS "$WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
  IfFileExists "$PS" +3 0
    MessageBox MB_ICONSTOP "Windows PowerShell was not found ($PS). Codes & Ciphers Studio needs Windows PowerShell 5.1."
    Abort "Windows PowerShell not found."
  SetOutPath "$INSTDIR"
  File "Install.ps1"
  File "Uninstall.ps1"
  File "ciphers.ico"
  RMDir /r "$INSTDIR\payload"
  SetOutPath "$INSTDIR\payload"
  File /r "payload\*"
  DetailPrint "Placing the infographic on your Desktop..."
  SetOutPath "$DESKTOP"
  File "Codes & Ciphers Studio - How It Works.png"
  SetOutPath "$INSTDIR"
  DetailPrint "Installing and verifying Codes & Ciphers Studio (see the PowerShell window)..."
  Delete "$TEMP\CodesCiphersStudio-install-result.txt"
  ExecWait '"$PS" -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\Install.ps1" -Source "$INSTDIR\payload"'
  StrCpy $RES ""
  ClearErrors
  FileOpen $0 "$TEMP\CodesCiphersStudio-install-result.txt" r
  ${IfNot} ${Errors}
    FileRead $0 $RES
    FileClose $0
  ${EndIf}
  StrCpy $1 $RES 2
  ${If} $1 != "OK"
    ${If} $RES == ""
      StrCpy $RES "The PowerShell install did not report a result."
    ${EndIf}
    DetailPrint "Install failed: $RES"
    MessageBox MB_ICONSTOP "Codes & Ciphers Studio was not installed.$\r$\n$\r$\n$RES$\r$\n$\r$\nYour previous version (if any) has been restored."
    Abort "Codes & Ciphers Studio was not installed."
  ${EndIf}
  RMDir /r "$INSTDIR\payload"
  DetailPrint "Install verified."
  WriteINIStr "$SMPROGRAMS\Codes & Ciphers Studio.url" "InternetShortcut" "URL" "http://localhost:8771/"
  WriteINIStr "$SMPROGRAMS\Codes & Ciphers Studio.url" "InternetShortcut" "IconFile" "$INSTDIR\ciphers.ico"
  WriteINIStr "$SMPROGRAMS\Codes & Ciphers Studio.url" "InternetShortcut" "IconIndex" "0"
  WriteINIStr "$DESKTOP\Codes & Ciphers Studio.url" "InternetShortcut" "URL" "http://localhost:8771/"
  WriteINIStr "$DESKTOP\Codes & Ciphers Studio.url" "InternetShortcut" "IconFile" "$INSTDIR\ciphers.ico"
  WriteINIStr "$DESKTOP\Codes & Ciphers Studio.url" "InternetShortcut" "IconIndex" "0"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\ciphers.ico"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$LOCALAPPDATA\CodesCiphersStudio"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "${UNINSTKEY}" "URLInfoAbout" "http://localhost:8771/"
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
SectionEnd
Section "Uninstall"
  SetShellVarContext current
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
  ${EndIf}
  ExecWait '"$WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$INSTDIR\Uninstall.ps1"'
  Delete "$SMPROGRAMS\Codes & Ciphers Studio.url"
  Delete "$DESKTOP\Codes & Ciphers Studio.url"
  DeleteRegKey HKCU "${UNINSTKEY}"
  Delete "$INSTDIR\Install.ps1"
  Delete "$INSTDIR\Uninstall.ps1"
  Delete "$INSTDIR\ciphers.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  MessageBox MB_ICONINFORMATION "Codes & Ciphers Studio has been removed.$\r$\nThe infographic on your Desktop and earlier backups (CodesCiphersStudio-backup-*) were left in place."
SectionEnd
