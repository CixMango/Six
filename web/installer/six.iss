; Six's Windows setup wizard (Inno Setup 6). The release workflow builds it from the unpacked Windows zip:
;   ISCC /DVersion=1.3.0 /DSource=C:\path\to\Six /DOutput=C:\path\to\out web\installer\six.iss
; It installs for the current user only (no admin prompt), so the app can update itself in place later.

#ifndef Version
  #error Pass /DVersion=x.y.z
#endif
#ifndef Source
  #error Pass /DSource=the unpacked Six folder
#endif
#ifndef Output
  #define Output "."
#endif

[Setup]
AppId={{6F1C2B8A-3D4E-4F5A-9B6C-7D8E9F0A1B2C}
AppName=Six
AppVersion={#Version}
AppVerName=Six {#Version}
AppPublisher=CixMango
AppPublisherURL=https://github.com/CixMango/Six
AppSupportURL=https://github.com/CixMango/Six/issues
DefaultDirName={localappdata}\Programs\Six
DisableProgramGroupPage=yes
DisableDirPage=auto
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir={#Output}
OutputBaseFilename=Six-{#Version}-Setup-windows
SetupIconFile=..\public\brand\six.ico
UninstallDisplayIcon={app}\Six.exe
UninstallDisplayName=Six
WizardStyle=modern
WizardImageFile=art\wizard-100.bmp,art\wizard-150.bmp,art\wizard-200.bmp
WizardSmallImageFile=art\wizard-small-100.bmp,art\wizard-small-150.bmp,art\wizard-small-200.bmp
LicenseFile={#Source}\LICENSE.txt
Compression=lzma2/max
SolidCompression=yes
CloseApplications=no

[Messages]
WelcomeLabel1=Welcome to Six
WelcomeLabel2=This installs Six {#Version}, hex tic-tac-toe with a self-trained bot, on your computer.%n%nSix opens in your browser. Nothing else runs in the background while it's closed.
FinishedHeadingLabel=Six is ready
FinishedLabel=Six is installed. Open it any time from the Start menu, or from the desktop shortcut if you made one.

[Tasks]
Name: desktopicon; Description: "Put a Six shortcut on the desktop"; GroupDescription: "Shortcuts:"

[Files]
Source: "{#Source}\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{userprograms}\Six"; Filename: "{app}\Six.exe"; WorkingDir: "{app}"; Comment: "Hex tic-tac-toe"
Name: "{userdesktop}\Six"; Filename: "{app}\Six.exe"; WorkingDir: "{app}"; Comment: "Hex tic-tac-toe"; Tasks: desktopicon

[Run]
Filename: "{app}\Six.exe"; Description: "Open Six now"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Files the in-app updater put there. Saved games (the data folder) are kept.
Type: filesandordirs; Name: "{app}\node"
Type: filesandordirs; Name: "{app}\engine"
Type: filesandordirs; Name: "{app}\web"
Type: filesandordirs; Name: "{app}\runs"
Type: filesandordirs; Name: "{app}\licenses"

[Code]
// A running Six keeps its files open; ask it to stop before installing over it or removing it.
procedure StopSix();
var
  Code: Integer;
begin
  Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'),
    '-NoProfile -NonInteractive -Command "try { Invoke-RestMethod -Method Post http://localhost:6600/api/quit -TimeoutSec 3 | Out-Null; Start-Sleep -Seconds 2 } catch {}"',
    '', SW_HIDE, ewWaitUntilTerminated, Code);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  StopSix();
  Result := '';
end;

function InitializeUninstall(): Boolean;
begin
  StopSix();
  Result := True;
end;
