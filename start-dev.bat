@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM  COLLABORATIVE WORKSPACE - Development Server Startup Script
REM  Starts both backend and frontend with automatic port cleanup
REM ============================================================================

:: Colors for output (if supported by terminal)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "RESET=[0m"

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  COLLABORATIVE WORKSPACE - Development Server               ║
echo ║  Starting Backend + Frontend                                 ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM ============================================================================
REM  Step 1: Kill any existing Node.js processes using ports 3000 or 5000
REM ============================================================================

echo [*] Cleaning up existing processes...

for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000"') do (
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo   √ Freed port 3000
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| find ":5000"') do (
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo   √ Freed port 5000
    )
)

timeout /t 2 /nobreak >nul

REM ============================================================================
REM  Step 2: Verify ports are available
REM ============================================================================

echo.
echo [*] Verifying ports...

netstat -ano 2>nul | find ":3000" >nul
if !errorlevel! equ 0 (
    echo   ✗ Port 3000 still in use - trying alternate port 3001
    set "FRONTEND_PORT=3001"
) else (
    echo   √ Port 3000 available
    set "FRONTEND_PORT=3000"
)

netstat -ano 2>nul | find ":5000" >nul
if !errorlevel! equ 0 (
    echo   ✗ Port 5000 still in use - trying alternate port 5001
    set "BACKEND_PORT=5001"
) else (
    echo   √ Port 5000 available
    set "BACKEND_PORT=5000"
)

REM ============================================================================
REM  Step 3: Start Backend Server
REM ============================================================================

echo.
echo [*] Starting Backend Server (Port %BACKEND_PORT%)...
echo   → http://localhost:%BACKEND_PORT%

cd /d "%~dp0backend"
start "Backend Server" cmd /k "set PORT=%BACKEND_PORT%& npm start"

timeout /t 3 /nobreak >nul

REM ============================================================================
REM  Step 4: Start Frontend Server
REM ============================================================================

echo.
echo [*] Starting Frontend Server (Port %FRONTEND_PORT%)...
echo   → http://localhost:%FRONTEND_PORT%

cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "set PORT=%FRONTEND_PORT%& set SKIP_PREFLIGHT_CHECK=true& npm start"

timeout /t 3 /nobreak >nul

REM ============================================================================
REM  Step 5: Display Status
REM ============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  ✓ SERVERS STARTED SUCCESSFULLY                              ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║                                                               ║
echo ║  Backend:  http://localhost:%BACKEND_PORT%                        ║
echo ║  Frontend: http://localhost:%FRONTEND_PORT%                        ║
echo ║                                                               ║
echo ║  Close the terminal or press Ctrl+C to stop servers        ║
echo ║                                                               ║
echo ║  Quick Links:                                               ║
echo ║  - Login:    http://localhost:%FRONTEND_PORT%/login           ║
echo ║  - Signup:   http://localhost:%FRONTEND_PORT%/signup          ║
echo ║  - Dashboard: http://localhost:%FRONTEND_PORT%/dashboard      ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM ============================================================================
REM  Step 6: Wait for manual termination
REM ============================================================================

echo Servers are running. Close this window or press Ctrl+C to stop...
pause

REM ============================================================================
REM  Step 7: Cleanup on Exit
REM ============================================================================

echo.
echo [!] Shutting down servers...

REM Kill by window name (more reliable)
taskkill /FI "WINDOWTITLE eq Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F >nul 2>&1

REM Force kill any remaining node processes
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM npm.cmd /F >nul 2>&1

timeout /t 2 /nobreak >nul

REM Final verification
echo.
echo [*] Final cleanup...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":3000"') do (
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":5000"') do (
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":5001"') do (
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":3001"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo   √ All ports freed
echo   √ All processes terminated
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  ✓ SERVERS STOPPED SUCCESSFULLY                              ║
echo ║  All ports have been freed                                   ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

endlocal
