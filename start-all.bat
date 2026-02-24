@echo off
setlocal

cd /d "%~dp0"

echo Starting chatbot backend...
start "Chatbot Server" cmd /k "cd /d \"%~dp0chatbot-server\" && npm start"

echo Opening frontend...
start "" "%~dp0index.html"

echo Done.
