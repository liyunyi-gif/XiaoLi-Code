@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

REM --- add npm global bin to PATH (has bun.cmd) ---
set "PATH=%APPDATA%\npm;%PATH%"
where bun.cmd >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :have_bun
echo bun not found
echo Please install: npm install -g bun
pause
exit /b 1

:have_bun

REM --- load key from .env ---
if defined OPENAI_API_KEY goto :run

if not exist "%~dp0.env" goto :nokey

for /f "tokens=2 delims==" %%a in ('type "%~dp0.env" ^| findstr "OPENAI_API_KEY=" 2^>nul') do set "OPENAI_API_KEY=%%a"

if defined OPENAI_API_KEY goto :run

:nokey
echo.
echo OPENAI_API_KEY not found
echo Create .env file in project root with:
echo OPENAI_API_KEY=your-key
echo.
pause
exit /b 1

:run
bun run start
pause
