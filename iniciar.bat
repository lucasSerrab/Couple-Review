@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Couple Review

where node >nul 2>nul
if errorlevel 1 (
  echo Precisa do Node.js 22 ou mais novo: https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando pela primeira vez, pode levar um minuto...
  call npm install --no-audit --no-fund || goto erro
)
if not exist .next\BUILD_ID (
  echo Preparando o app...
  call npm run build || goto erro
)

echo.
echo  Couple Review no ar. Neste computador: http://localhost:3000
echo  No celular (mesmo Wi-Fi), abra um destes enderecos com :3000 no final:
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | ForEach-Object { '    http://' + $_.IPAddress + ':3000' }"
echo.
echo  Deixe esta janela aberta enquanto usam. Para parar: feche a janela.
echo.
start "" http://localhost:3000
call npm start
goto fim

:erro
echo.
echo Algo deu errado. Mande o texto acima para quem te ajuda.
:fim
pause
