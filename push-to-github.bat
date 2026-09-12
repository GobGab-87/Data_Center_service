@echo off
title Push to GitHub - Data Center Service
cd /d "%~dp0"
echo ========================================================
echo   Pushing latest changes to GitHub Repository...
echo ========================================================
echo.
git push origin main
echo.
echo ========================================================
echo   Push finished! Check your GitHub repository.
echo ========================================================
pause
