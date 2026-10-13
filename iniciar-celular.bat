@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Couple Review - endereco para o celular

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
if not exist tools\cloudflared.exe (
  echo Baixando o tunel gratuito da Cloudflare...
  mkdir tools 2>nul
  powershell -NoProfile -Command "Invoke-WebRequest https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile tools\cloudflared.exe" || goto erro
)

echo.
echo  Ligando o app em outra janela...
start "Couple Review (app)" cmd /c "npm start"
timeout /t 6 >nul

echo.
echo  Procure abaixo a linha com  https://....trycloudflare.com
echo  Esse e o endereco para abrir no celular (funciona de qualquer rede, com microfone).
echo  Ele muda toda vez que esta janela e aberta. Deixe as duas janelas abertas enquanto usam.
echo.
tools\cloudflared.exe tunnel --no-autoupdate --url http://localhost:3000
goto fim

:erro
echo.
echo Algo deu errado. Mande o texto acima para quem te ajuda.
:fim
pause
