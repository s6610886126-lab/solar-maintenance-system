@echo off
cd /d "%~dp0"
echo ========================================================
echo Starting Solar Plant Maintenance Schedule Web App...
echo URL: http://localhost:3000/
echo ========================================================
call npm.cmd run dev -- --host 0.0.0.0 --port 3000
pause
