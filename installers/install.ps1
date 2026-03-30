# Nova Ultra Windows Installer
# Run in PowerShell as Administrator:
# iwr -useb https://nova-ultra.ai/install.ps1 | iex

$NOVA_VERSION = "2.0.0"
$INSTALL_DIR = "$env:USERPROFILE\NovaUltra"
$NOVA_URL = "https://github.com/Publicityvisual/nova.ai/archive/refs/heads/master.zip"

function Write-Color($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "🚀 Nova Ultra v$NOVA_VERSION Windows Installer" "Cyan"
Write-Color "============================================" "Gray"

# Require Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Color "⚠️  Por favor ejecuta PowerShell como Administrador" "Yellow"
    exit 1
}

# Check Node.js
Write-Color "`n🔍 Verificando Node.js..." "Cyan"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Color "📥 Descargando Node.js LTS..." "Cyan"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -OutFile $nodeInstaller
    Start-Process msiexec.exe -ArgumentList "/i", $nodeInstaller, "/quiet", "/norestart" -Wait
    Remove-Item $nodeInstaller
}

$nodeVersion = (node --version).Replace("v", "").Split(".")[0]
if ([int]$nodeVersion -lt 18) {
    Write-Color "❌ Node.js 18+ requerido. Actual: v$nodeVersion" "Red"
    exit 1
}
Write-Color "✅ Node.js $(node --version)" "Green"

# Create directories
Write-Color "`n📁 Creando directorios..." "Cyan"
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$INSTALL_DIR\data" | Out-Null
New-Item -ItemType Directory -Force -Path "$INSTALL_DIR\logs" | Out-Null
New-Item -ItemType Directory -Force -Path "$INSTALL_DIR\skills\generated" | Out-Null
Write-Color "✅ Directorios creados" "Green"

# Download and extract
Write-Color "`n📦 Descargando Nova Ultra..." "Cyan"
$zipPath = "$env:TEMP\nova-ultra.zip"
Invoke-WebRequest -Uri $NOVA_URL -OutFile $zipPath -UseBasicParsing

Write-Color "📂 Extrayendo archivos..." "Cyan"
Expand-Archive -Path $zipPath -DestinationPath "$env:TEMP\nova-extract" -Force
copy-item "$env:TEMP\nova-extract\nova.ai-master\*" $INSTALL_DIR -Recurse -Force
Remove-Item $zipPath
Remove-Item "$env:TEMP\nova-extract" -Recurse -Force
Write-Color "✅ Archivos extraídos" "Green"

# Install dependencies
Write-Color "`n📥 Instalando dependencias (esto puede tardar)..." "Cyan"
Push-Location $INSTALL_DIR
& npm install --production --silent
Pop-Location
Write-Color "✅ Dependencias instaladas" "Green"

# Create launcher scripts
Write-Color "`n🎯 Creando lanzadores..." "Cyan"

# BAT launcher
$batContent = @"
cd /d "$INSTALL_DIR"
node src\index.js %*
"@
Set-Content -Path "$INSTALL_DIR\nova-ultra.bat" -Value $batContent

# PS1 launcher
$psContent = @"
param([string]`$Arguments)
cd "$INSTALL_DIR"
node src\index.js `$Arguments
"@
Set-Content -Path "$INSTALL_DIR\nova-ultra.ps1" -Value $psContent

# Add to PATH
$binDir = "$INSTALL_DIR"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $currentPath.Contains($binDir)) {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$binDir", "User")
    Write-Color "✅ Agregado a PATH" "Green"
}

# Create shortcut in Start Menu
Write-Color "`n🎨 Creando acceso directo..." "Cyan"
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Nova Ultra.lnk")
$Shortcut.TargetPath = "$INSTALL_DIR\nova-ultra.bat"
$Shortcut.WorkingDirectory = "$INSTALL_DIR"
$Shortcut.IconLocation = "$INSTALL_DIR\icon.ico,0"
$Shortcut.Save()
Write-Color "✅ Acceso directo creado" "Green"

# Configure auto-start
Write-Color "`n⚙️ Configurando auto-inicio..." "Cyan"
$startupDir = "$env:USERPROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
copy-item "$env:USERPROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Nova Ultra.lnk" $startupDir
Write-Color "✅ Auto-inicio configurado" "Green"

# Create .env
if (-not (Test-Path "$INSTALL_DIR\.env")) {
    Copy-Item "$INSTALL_DIR\.env.example" "$INSTALL_DIR\.env"
    
    # Add OpenRouter key
    Add-Content "$INSTALL_DIR\.env" "`nOPENROUTER_API_KEY=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"
}

# Create Windows Service (optional)
Write-Color "`n🔧 Creando servicio Windows..." "Cyan"
$nssm = "$env:TEMP\nssm.exe"
if (-not (Test-Path $nssm)) {
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "$env:TEMP\nssm.zip"
    Expand-Archive "$env:TEMP\nssm.zip" "$env:TEMP\nssm" -Force
    copy-item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" $nssm
}

& $nssm install NovaUltra "node.exe"
& $nssm set NovaUltra Application "$INSTALL_DIR\src\index.js"
& $nssm set NovaUltra WorkingDirectory $INSTALL_DIR
& $nssm set NovaUltra DisplayName "Nova Ultra AI"
Write-Color "✅ Servicio creado" "Green"

Write-Color "`n" "White"
Write-Color "╔════════════════════════════════════════════════════════╗" "Green"
Write-Color "║              🦾 NOVA ULTRA INSTALADO                   ║" "Green"
Write-Color "╠════════════════════════════════════════════════════════╣" "Green"
Write-Color "║  Versión: $NOVA_VERSION                                        ║" "Green"
Write-Color "║  Ubicación: $INSTALL_DIR            ║" "Green"
Write-Color "║  Menú Inicio: Nova Ultra                              ║" "Green"
Write-Color "║  Comando: nova-ultra.bat                                ║" "Green"
Write-Color "║  Servicio: sc start NovaUltra                           ║" "Green"
Write-Color "╠════════════════════════════════════════════════════════╣" "Green"
Write-Color "║                                                        ║" "Green"
Write-Color "║  🎉 Para iniciar:                                      ║" "Green"
Write-Color "║     1. Reinicia PowerShell                             ║" "Green"
Write-Color "║     2. Ejecuta: nova-ultra                             ║" "Green"
Write-Color "║     o usa el menú Inicio                               ║" "Green"
Write-Color "║                                                        ║" "Green"
Write-Color "║  🤖 NOVA ULTRA LISTO PARA USAR                         ║" "Green"
Write-Color "╚════════════════════════════════════════════════════════╝" "Green"
Write-Color "`n" "White"

# Ask to start now
$startNow = Read-Host "¿Deseas iniciar Nova Ultra ahora? (S/N)"
if ($startNow -eq 'S' -or $startNow -eq 's') {
    Start-Process "$INSTALL_DIR\nova-ultra.bat"
}
