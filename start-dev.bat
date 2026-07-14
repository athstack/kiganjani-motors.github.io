@echo off
echo ==========================================
echo   KIGANJANI MOTORS - Local Dev Server
echo ==========================================
echo.

echo [1/3] Starting API server on port 3000...
start "KM API" cmd /c "cd /d D:\athstack\KM\API && node server.js"
timeout /t 2 /nobreak >nul

echo [2/3] Starting ngrok tunnel to port 3000...
start "KM ngrok" cmd /c "D:\athstack\KM\API\ngrok.exe http 3000"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend on port 8080...
start "KM Frontend" cmd /c "node D:\athstack\KM\API\serve.js"

echo.
echo ==========================================
echo   All services started!
echo.
echo   Frontend:  http://localhost:8080
echo   API:       http://localhost:3000
echo   ngrok:     Check http://127.0.0.1:4040
echo.
echo   NOTE: ngrok URL changes each restart.
echo   Update form.html with new URL if needed.
echo ==========================================
pause
