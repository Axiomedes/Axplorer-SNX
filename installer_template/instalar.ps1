[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# Leer configuracion si existe
$ConfigFile = Join-Path $PSScriptRoot "installer_info.json"
$AppName = "Axplorer SNX"
$AppVersion = "0.2.9"
$Publisher = "Axplorer Team"
$ExeName = "aXplorer.exe"

if (Test-Path $ConfigFile) {
    try {
        $info = Get-Content $ConfigFile -Raw | ConvertFrom-Json
        if ($info.AppName) { $AppName = $info.AppName }
        if ($info.AppVersion) { $AppVersion = $info.AppVersion }
        if ($info.Publisher) { $Publisher = $info.Publisher }
        if ($info.ExeName) { $ExeName = $info.ExeName }
    } catch {}
}

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                  INSTALADOR OFICIAL DE $AppName v$AppVersion                  " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este instalador configurara $AppName en tu sistema con:" -ForegroundColor White
Write-Host "  * Acceso directo en el Escritorio" -ForegroundColor Gray
Write-Host "  * Acceso directo en el Menu Inicio" -ForegroundColor Gray
Write-Host "  * Registro oficial en Aplicaciones Instaladas de Windows" -ForegroundColor Gray
Write-Host "  * Desinstalador automatico e integrado" -ForegroundColor Gray
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    $TargetDir = Join-Path $env:ProgramFiles $AppName
    $RegRoot = "HKLM"
    Write-Host "[i] Modo: Para todos los usuarios (Administrador)" -ForegroundColor Yellow
} else {
    $TargetDir = Join-Path $env:LocalAppData "Programs\$AppName"
    $RegRoot = "HKCU"
    Write-Host "[i] Modo: Usuario actual (No requiere permisos de administrador)" -ForegroundColor Green
}

Write-Host "[i] Carpeta de instalacion: $TargetDir" -ForegroundColor Green
Write-Host ""

$resp = Read-Host "¿Deseas proceder con la instalacion? (S/N) [Por defecto: S]"
if ($resp -and $resp.Trim().ToUpper() -eq "N") {
    Write-Host ""
    Write-Host "Instalacion cancelada por el usuario." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/4] Preparando carpeta de instalacion..." -ForegroundColor Cyan
if (-not (Test-Path $TargetDir)) {
    New-Item -Path $TargetDir -ItemType Directory -Force | Out-Null
}

$SourceAppDir = Join-Path $PSScriptRoot "app"
if (-not (Test-Path $SourceAppDir)) {
    Write-Host "[ERROR] No se encontro la carpeta 'app' con los archivos del programa." -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] Copiando archivos de la aplicacion..." -ForegroundColor Cyan
Copy-Item -Path "$SourceAppDir\*" -Destination $TargetDir -Recurse -Force

Write-Host "[3/4] Creando accesos directos..." -ForegroundColor Cyan
$wsh = New-Object -ComObject WScript.Shell

# Acceso directo Escritorio
$desktopPath = [Environment]::GetFolderPath("Desktop")
$deskShortcut = $wsh.CreateShortcut((Join-Path $desktopPath "$AppName.lnk"))
$deskShortcut.TargetPath = Join-Path $TargetDir $ExeName
$deskShortcut.IconLocation = Join-Path $TargetDir "app.ico"
$deskShortcut.WorkingDirectory = $TargetDir
$deskShortcut.Description = "$AppName - Explorador de Archivos 3D"
$deskShortcut.Save()

# Acceso directo Menu Inicio
$startMenuPath = if ($isAdmin) {
    [Environment]::GetFolderPath("CommonPrograms")
} else {
    [Environment]::GetFolderPath("Programs")
}
$startShortcut = $wsh.CreateShortcut((Join-Path $startMenuPath "$AppName.lnk"))
$startShortcut.TargetPath = Join-Path $TargetDir $ExeName
$startShortcut.IconLocation = Join-Path $TargetDir "app.ico"
$startShortcut.WorkingDirectory = $TargetDir
$startShortcut.Description = "$AppName - Explorador de Archivos 3D"
$startShortcut.Save()

Write-Host "[4/4] Registrando en Agregar o Quitar Programas de Windows..." -ForegroundColor Cyan
$regPath = "${RegRoot}:\Software\Microsoft\Windows\CurrentVersion\Uninstall\AxplorerSNX"
if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
}

$exeFullPath = Join-Path $TargetDir $ExeName
$uninstBatPath = Join-Path $TargetDir "Desinstalar.bat"
$sizeKb = [math]::Round(((Get-ChildItem $TargetDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1KB))

Set-ItemProperty -Path $regPath -Name "DisplayName" -Value $AppName
Set-ItemProperty -Path $regPath -Name "DisplayVersion" -Value $AppVersion
Set-ItemProperty -Path $regPath -Name "Publisher" -Value $Publisher
Set-ItemProperty -Path $regPath -Name "InstallLocation" -Value $TargetDir
Set-ItemProperty -Path $regPath -Name "DisplayIcon" -Value "$exeFullPath,0"
Set-ItemProperty -Path $regPath -Name "UninstallString" -Value "`"$uninstBatPath`""
Set-ItemProperty -Path $regPath -Name "EstimatedSize" -Value $sizeKb -Type DWord
Set-ItemProperty -Path $regPath -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $regPath -Name "NoRepair" -Value 1 -Type DWord

# Crear Desinstalar.bat en el directorio instalado
$uninstLines = @(
    "@echo off",
    "chcp 65001 >nul",
    "title Desinstalador de $AppName",
    "cls",
    "echo ===============================================================================",
    "echo                     DESINSTALADOR DE $AppName",
    "echo ===============================================================================",
    "echo.",
    "echo ¿Estas seguro de que deseas desinstalar completamente $AppName?",
    "echo.",
    "set /p `"CONFIRM=Escribe 'S' para confirmar: `"",
    "if /i not `"%CONFIRM%`"==`"S`" (",
    "    echo Operacion cancelada.",
    "    pause",
    "    exit /b 0",
    ")",
    "echo.",
    "echo [*] Cerrando $AppName si esta en ejecucion...",
    "taskkill /f /im $ExeName >nul 2>&1",
    "echo [*] Eliminando accesos directos...",
    "del /q /f `"%USERPROFILE%\Desktop\$AppName.lnk`" >nul 2>&1",
    "del /q /f `"%PUBLIC%\Desktop\$AppName.lnk`" >nul 2>&1",
    "del /q /f `"%APPDATA%\Microsoft\Windows\Start Menu\Programs\$AppName.lnk`" >nul 2>&1",
    "del /q /f `"%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\$AppName.lnk`" >nul 2>&1",
    "echo [*] Eliminando del Registro de Windows...",
    "reg delete `"HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\AxplorerSNX`" /f >nul 2>&1",
    "reg delete `"HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\AxplorerSNX`" /f >nul 2>&1",
    "echo [*] Eliminando archivos instalados...",
    "set `"APP_DIR=%~dp0`"",
    "if `"%APP_DIR:~-1%`"==`"\`" set `"APP_DIR=%APP_DIR:~0,-1%`"",
    "cd /d `"%TEMP%`"",
    "start `"`" /b cmd /c `"timeout /t 1 /nobreak >nul & rmdir /s /q `"`"%APP_DIR%`"`"`"",
    "echo.",
    "echo [OK] $AppName ha sido desinstalado con exito.",
    "pause",
    "exit"
)
[System.IO.File]::WriteAllText($uninstBatPath, ($uninstLines -join "`r`n") + "`r`n", [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "                      ¡INSTALACION COMPLETADA CON EXITO!                       " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se ha creado el acceso directo en el Escritorio y en el Menu Inicio." -ForegroundColor White
Write-Host ""
$launch = Read-Host "¿Deseas ejecutar $AppName ahora mismo? (S/N) [Por defecto: S]"
if (-not $launch -or $launch.Trim().ToUpper() -eq "S") {
    Start-Process (Join-Path $TargetDir $ExeName)
}