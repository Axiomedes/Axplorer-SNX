<#
    .SYNOPSIS
    Script de construcción y empaquetado para distribución de Axplorer SNX.
    Genera instaladores Inno Setup, paquetes de instalación nativos y versiones portables ZIP.
#>

param(
    [switch]$NoExplorer
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "          AXPLORER SNX - GENERADOR DE INSTALADORES PARA DISTRIBUCION           " -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = $PSScriptRoot
$CsprojFile = Join-Path $ProjectRoot "aXplorer.csproj"
$DistDir = Join-Path $ProjectRoot "dist"
$PublishDir = Join-Path $DistDir "publish\win-x64"

# 1. Obtener versión desde aXplorer.csproj
$AppVersion = "0.2.9"
try {
    [xml]$xml = Get-Content $CsprojFile -Raw
    $ver = $xml.Project.PropertyGroup.Version
    if ($ver) { $AppVersion = $ver }
} catch {
    Write-Host "[!] No se pudo leer la version de csproj. Usando por defecto: $AppVersion" -ForegroundColor Yellow
}

$AppName = "Axplorer SNX"
$ExeName = "aXplorer.exe"
$Publisher = "Axplorer Team"
$PortableDir = Join-Path $DistDir "Axplorer_SNX_v$AppVersion`_Portable"
$InstallerDir = Join-Path $DistDir "Axplorer_SNX_v$AppVersion`_Instalador"

Write-Host "[i] Aplicacion : $AppName" -ForegroundColor Green
Write-Host "[i] Version    : v$AppVersion" -ForegroundColor Green
Write-Host "[i] Destino    : $DistDir" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $DistDir)) {
    New-Item -Path $DistDir -ItemType Directory -Force | Out-Null
}

# ===============================================================================
# PASO 1: COMPILACIÓN Y PUBLICACIÓN RELEASE (SELF-CONTAINED X64)
# ===============================================================================
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "[Paso 1/4] Compilando y publicando en Release (Self-Contained x64)..." -ForegroundColor White
Write-Host "           (Incluye el runtime: funciona en cualquier Windows 10/11 x64)" -ForegroundColor Gray
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan

if (Test-Path $PublishDir) {
    Write-Host "[*] Limpiando carpeta de publicacion previa..." -ForegroundColor Gray
    Remove-Item -Path $PublishDir -Recurse -Force -ErrorAction SilentlyContinue
}

$dotnetArgs = @(
    "publish",
    "`"$CsprojFile`"",
    "-c", "Release",
    "-r", "win-x64",
    "--self-contained", "true",
    "-p:PublishSingleFile=false",
    "-p:PublishReadyToRun=true",
    "-o", "`"$PublishDir`""
)

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "dotnet"
$psi.Arguments = $dotnetArgs -join " "
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
while (-not $proc.HasExited) {
    $line = $proc.StandardOutput.ReadLine()
    if ($line) { Write-Host "    $line" -ForegroundColor Gray }
}
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit()

if ($proc.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] La compilacion fallo con codigo $($proc.ExitCode):" -ForegroundColor Red
    Write-Host $stderr -ForegroundColor Red
    exit 1
}

$mainExePath = Join-Path $PublishDir $ExeName
if (-not (Test-Path $mainExePath)) {
    Write-Host "[ERROR] No se encontro $ExeName en $PublishDir" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Publicacion completada con exito." -ForegroundColor Green
Write-Host ""

# ===============================================================================
# PASO 2: SCRIPT DE INNO SETUP Y COMPILACIÓN (SI ESTÁ INSTALADO)
# ===============================================================================
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "[Paso 2/4] Generando script Inno Setup..." -ForegroundColor White
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan

$IssFile = Join-Path $DistDir "setup_innosetup.iss"

$issLines = @(
    "; ===============================================================================",
    "; Inno Setup Script para $AppName v$AppVersion",
    "; Generado automaticamente por crear_instalador.bat",
    "; ===============================================================================",
    "#define MyAppName `"$AppName`"",
    "#define MyAppVersion `"$AppVersion`"",
    "#define MyAppPublisher `"$Publisher`"",
    "#define MyAppExeName `"$ExeName`"",
    "",
    "[Setup]",
    "AppId={{D37B4C89-6F12-4298-9023-A4E5C0F8119A}",
    "AppName={#MyAppName}",
    "AppVersion={#MyAppVersion}",
    "AppPublisher={#MyAppPublisher}",
    "DefaultDirName={autopf}\{#MyAppName}",
    "DefaultGroupName={#MyAppName}",
    "DisableProgramGroupPage=yes",
    "PrivilegesRequired=lowest",
    "PrivilegesRequiredOverridesAllowed=dialog",
    "OutputDir=.",
    "OutputBaseFilename=Setup_Axplorer_SNX_v{#MyAppVersion}",
    "Compression=lzma2/ultra64",
    "SolidCompression=yes",
    "WizardStyle=modern",
    "ArchitecturesInstallIn64BitMode=x64",
    "SetupIconFile=..\app.ico",
    "UninstallDisplayIcon={app}\app.ico",
    "",
    "[Languages]",
    "Name: `"spanish`"; MessagesFile: `"compiler:Languages\Spanish.isl`"",
    "Name: `"english`"; MessagesFile: `"compiler:Default.isl`"",
    "",
    "[Tasks]",
    "Name: `"desktopicon`"; Description: `"{cm:CreateDesktopIcon}`"; GroupDescription: `"{cm:AdditionalIcons}`"; Flags: unchecked",
    "",
    "[Files]",
    "Source: `"publish\win-x64\*`"; DestDir: `"{app}`"; Flags: ignoreversion recursesubdirs createallsubdirs",
    "",
    "[Icons]",
    "Name: `"{group}\{#MyAppName}`"; Filename: `"{app}\{#MyAppExeName}`"; IconFilename: `"{app}\app.ico`"",
    "Name: `"{group}\{cm:UninstallProgram,{#MyAppName}}`"; Filename: `"{uninstallexe}`"",
    "Name: `"{autodesktop}\{#MyAppName}`"; Filename: `"{app}\{#MyAppExeName}`"; IconFilename: `"{app}\app.ico`"; Tasks: desktopicon",
    "",
    "[Run]",
    "Filename: `"{app}\{#MyAppExeName}`"; Description: `"{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}`"; Flags: nowait postinstall skipifsilent"
)

[System.IO.File]::WriteAllText($IssFile, ($issLines -join "`r`n") + "`r`n", [System.Text.Encoding]::UTF8)
Write-Host "[OK] Script guardado en: $IssFile" -ForegroundColor Green

# Buscar ISCC.exe
$possibleIscc = @(
    "iscc.exe",
    "$env:ProgramFiles(x86)\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
    "$env:LocalAppData\Programs\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles(x86)\Inno Setup 7\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 7\ISCC.exe",
    "$env:LocalAppData\Programs\Inno Setup 7\ISCC.exe"
)

$IsccPath = $null
foreach ($path in $possibleIscc) {
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $IsccPath = (Get-Command $path).Source
        break
    }
    if (Test-Path $path) {
        $IsccPath = $path
        break
    }
}

$setupExePath = Join-Path $DistDir "Setup_Axplorer_SNX_v$AppVersion.exe"

if ($IsccPath) {
    Write-Host "[*] Compilador Inno Setup detectado: $IsccPath" -ForegroundColor Green
    Write-Host "[*] Compilando instalador unico (Setup_Axplorer_SNX_v$AppVersion.exe)..." -ForegroundColor Cyan
    Push-Location $DistDir
    try {
        & $IsccPath "setup_innosetup.iss" | Out-Null
        if (Test-Path $setupExePath) {
            Write-Host "[OK] Instalador ejecutable compilado con exito: $setupExePath" -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[i] Inno Setup (ISCC.exe) no esta instalado actualmente." -ForegroundColor Yellow
    Write-Host "    (El script $IssFile quedo listo para compilar con Inno Setup)." -ForegroundColor Gray
    Write-Host "    Para generar el ejecutable unico Setup_Axplorer_SNX_v$AppVersion.exe," -ForegroundColor Gray
    Write-Host "    puedes instalarlo cuando desees con: winget install JRSoftware.InnoSetup" -ForegroundColor Cyan
}
Write-Host ""

# ===============================================================================
# PASO 3: CREAR PAQUETE INSTALADOR NATIVO (Instalar.bat + App + Desinstalador)
# ===============================================================================
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "[Paso 3/4] Generando paquete de Instalador Nativo de Windows..." -ForegroundColor White
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan

if (Test-Path $InstallerDir) {
    Remove-Item -Path $InstallerDir -Recurse -Force -ErrorAction SilentlyContinue
}
$installerAppDir = Join-Path $InstallerDir "app"
New-Item -Path $installerAppDir -ItemType Directory -Force | Out-Null

Write-Host "[*] Copiando archivos para el paquete instalador..." -ForegroundColor Gray
Copy-Item -Path "$PublishDir\*" -Destination $installerAppDir -Recurse -Force

# Copiar scripts desde installer_template
$templateDir = Join-Path $ProjectRoot "installer_template"
Copy-Item -Path (Join-Path $templateDir "Instalar.bat") -Destination $InstallerDir -Force
Copy-Item -Path (Join-Path $templateDir "instalar.ps1") -Destination $InstallerDir -Force

# Metadata json para el instalador
$infoObj = @{
    AppName = $AppName
    AppVersion = $AppVersion
    Publisher = $Publisher
    ExeName = $ExeName
}
$infoJsonPath = Join-Path $InstallerDir "installer_info.json"
$infoObj | ConvertTo-Json | Set-Content -Path $infoJsonPath -Encoding UTF8

Write-Host "[OK] Paquete instalador nativo generado en: $InstallerDir" -ForegroundColor Green
Write-Host ""

# ===============================================================================
# PASO 4: CREACIÓN DE PAQUETES COMPRIMIDOS (.ZIP)
# ===============================================================================
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "[Paso 4/4] Empaquetando versiones ZIP para distribucion..." -ForegroundColor White
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkCyan

# 4.1 Paquete Portable
if (Test-Path $PortableDir) {
    Remove-Item -Path $PortableDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -Path $PortableDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "$PublishDir\*" -Destination $PortableDir -Recurse -Force

$PortableZip = Join-Path $DistDir "Axplorer_SNX_v$AppVersion`_Portable.zip"
$InstallerZip = Join-Path $DistDir "Axplorer_SNX_v$AppVersion`_Instalador.zip"

if (Test-Path $PortableZip) { Remove-Item $PortableZip -Force }
if (Test-Path $InstallerZip) { Remove-Item $InstallerZip -Force }

Write-Host "[*] Comprimiendo Version Portable: $PortableZip..." -ForegroundColor Cyan
Compress-Archive -Path "$PortableDir\*" -DestinationPath $PortableZip -CompressionLevel Optimal

Write-Host "[*] Comprimiendo Paquete Instalador: $InstallerZip..." -ForegroundColor Cyan
Compress-Archive -Path "$InstallerDir\*" -DestinationPath $InstallerZip -CompressionLevel Optimal

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "               RESUMEN DE ARCHIVOS GENERADOS PARA DISTRIBUCION                 " -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Directorio: $DistDir" -ForegroundColor White
Write-Host ""

if (Test-Path $setupExePath) {
    $exeSize = "{0:N2} MB" -f ((Get-Item $setupExePath).Length / 1MB)
    Write-Host "  [+] INSTALADOR EJECUTABLE UNICO (Inno Setup):" -ForegroundColor Green
    Write-Host "      -> Setup_Axplorer_SNX_v$AppVersion.exe ($exeSize)" -ForegroundColor White
    Write-Host ""
}

$instZipSize = "{0:N2} MB" -f ((Get-Item $InstallerZip).Length / 1MB)
Write-Host "  [+] PAQUETE INSTALADOR ZIP (Incluye Instalar.bat y Desinstalador):" -ForegroundColor Green
Write-Host "      -> Axplorer_SNX_v$AppVersion`_Instalador.zip ($instZipSize)" -ForegroundColor White
Write-Host ""

$portZipSize = "{0:N2} MB" -f ((Get-Item $PortableZip).Length / 1MB)
Write-Host "  [+] VERSION PORTABLE ZIP (Ejecucion directa sin instalar):" -ForegroundColor Green
Write-Host "      -> Axplorer_SNX_v$AppVersion`_Portable.zip ($portZipSize)" -ForegroundColor White
Write-Host ""

Write-Host "  [+] SCRIPT FUENTE PARA COMPILACION INNO SETUP:" -ForegroundColor Green
Write-Host "      -> setup_innosetup.iss" -ForegroundColor White
Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "¡Proceso de generacion finalizado con exito!" -ForegroundColor Cyan

if (-not $NoExplorer) {
    Write-Host "Abriendo la carpeta de distribucion..." -ForegroundColor Gray
    Start-Process "explorer.exe" $DistDir
}