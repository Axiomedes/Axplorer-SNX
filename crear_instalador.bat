@echo off
setlocal
title Creador de Instalador - Axplorer SNX
chcp 65001 >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_installer.ps1" %*
set "EXIT_CODE=%ERRORLEVEL%"

if %EXIT_CODE% NEQ 0 (
    echo(
    echo [!] Ocurrio un problema durante la creacion del instalador (Codigo: %EXIT_CODE%).
    echo(
    pause
    exit /b %EXIT_CODE%
)

echo(
echo Presiona cualquier tecla para finalizar...
pause >nul
exit /b 0