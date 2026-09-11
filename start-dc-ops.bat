@echo off
title Data Center Operation Service
echo ========================================================
echo    Starting Data Center Operation & Inspection WebApp
echo ========================================================
echo.

echo Starting Backend Server (Port 5000)...
start "DC-Ops Backend" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend WebApp (Port 3000)...
start "DC-Ops Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo  System is starting!
echo  Frontend: http://localhost:3000
echo  Backend API: http://localhost:5000
echo ========================================================
pause
