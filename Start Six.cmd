@echo off
title Six
cd /d "%~dp0web"
set VITE_CONFIG_NATIVE_IGNORE_WARNING=true

rem Already running? Just open it.
curl -s -o nul -m 2 http://localhost:6600/api/info && (
  start "" http://localhost:6600
  exit /b 0
)

where node >nul 2>nul || (
  echo Six needs Node.js. Install it from https://nodejs.org and try again.
  goto :error
)

if not exist node_modules (
  echo Setting up Six for the first time. This takes a minute...
  call npm install || goto :error
)

if not exist "%~dp0engine\build\release\sixengine.exe" (
  echo Building the HexBot engine...
  call "%~dp0engine\build.cmd" release || echo The HexBot engine could not be built. Rookie is still available.
)

echo Building Six...
call npx vite build --logLevel warn || goto :error

rem Open the browser once the server has had a moment to start.
start "" cmd /c "timeout /t 3 >nul & start http://localhost:6600"
echo.
echo Keep this window open while you play. Close it to stop Six.
call npx tsx src/server/main.ts --prod
goto :eof

:error
echo.
echo Six could not start. The message above says why.
pause
