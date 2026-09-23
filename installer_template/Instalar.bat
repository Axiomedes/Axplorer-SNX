@echo off
setlocal
title Instalador de Axplorer SNX
chcp 65001 >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1" %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Ocurrio un problema durante la instalacion.
    pause
)