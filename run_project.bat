@echo off
title Voxora.ai Launcher
echo ===================================================
echo               Voxora.ai Startup Utility
echo ===================================================
echo.
echo Launching both backend and frontend servers...
echo.

:: Launch Backend in a new window
echo [1/2] Starting FastAPI Backend on port 8000...
start "Voxora Backend (FastAPI)" cmd /k "cd backend && ..\.venv\Scripts\activate && uvicorn main:app --port 8000 --reload"

:: Launch Frontend in a new window
echo [2/2] Starting React + Vite Frontend on port 8080/8081...
start "Voxora Frontend (Vite)" cmd /k "npm run dev"

echo.
echo ===================================================
echo Startup complete! Both servers are launching in separate windows.
echo Keep those windows open while using the application.
echo.
echo Frontend: http://localhost:8080 (or http://localhost:8081 if 8080 is in use)
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
echo.
pause
