@echo off
echo ============================================
echo   Collaborative Workspace - Quick Start
echo ============================================
echo.

echo Starting servers...
start /B npm start

echo.
echo Waiting for servers to initialize...
timeout /t 15 /nobreak > nul

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ============================================
echo   🚀 Collaborative Workspace Running!
echo ============================================
echo.
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:5000
echo.
echo Features:
echo • Real-time collaborative document editing
echo • Live chat and messaging
echo • Kanban task boards
echo • User presence indicators
echo • GitHub OAuth authentication
echo.
echo Press Ctrl+C in the server window to stop
echo ============================================
pause
