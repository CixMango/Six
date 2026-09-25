@echo off
rem Builds the engine with MSVC + Ninja.
rem Usage: build.cmd [release|debug|asan] [test [filter]]
setlocal
set "PRESET=%~1"
if "%PRESET%"=="" set "PRESET=release"

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
for /f "usebackq delims=" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSDIR=%%i"
if not defined VSDIR (
  echo Visual Studio C++ tools were not found.
  exit /b 1
)
call "%VSDIR%\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1

cd /d "%~dp0"
cmake --preset %PRESET% >nul || exit /b 1
cmake --build --preset %PRESET% || exit /b 1
if /i "%~2"=="test" "build\%PRESET%\sixtests.exe" %3 || exit /b 1
