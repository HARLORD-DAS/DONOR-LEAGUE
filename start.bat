@echo off
title DONOR LEAGUE - Platform Launcher
echo ============================================================
echo   DONOR LEAGUE - Blood Donor Identification Platform
echo ============================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "Donor League - Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
start "Donor League - Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo ============================================================
echo   Both services are running!
echo.
echo   Your Single Web Application Link:
echo   ==> http://localhost:3000
echo.
echo   Backend Interactive API Docs:
echo   ==> http://localhost:8000/docs
echo ============================================================
echo.
timeout /t 4 /nobreak >nul
start http://localhost:3000
