#!/bin/bash
# Nova Ultra One-Liner Installer
# curl -fsSL https://nova-ultra.ai/install.sh | bash

set -e

NOVA_VERSION="2.0.0"
NOVA_URL="https://github.com/Publicityvisual/nova.ai/archive/refs/heads/master.zip"
INSTALL_DIR="$HOME/.nova-ultra"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[Nova]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

# Check OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
else
    error "Sistema operativo no soportado: $OSTYPE"
fi

log "Instalando Nova Ultra v${NOVA_VERSION}..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log "Node.js no encontrado. Instalando..."
    
    if [[ "$PLATFORM" == "linux" ]]; then
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        # Fedora
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y nodejs20
        # Arch
        elif command -v pacman &> /dev/null; then
            sudo pacman -S nodejs npm --noconfirm
        fi
    elif [[ "$PLATFORM" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install node@20
        else
            error "Homebrew no encontrado. Instala desde https://nodejs.org"
        fi
    fi
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
    error "Node.js 18+ requerido. Versión actual: $(node --version)"
fi

success "Node.js $(node --version)"

# Create install directory
log "Creando directorio de instalación..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download
log "Descargando Nova Ultra..."
if command -v curl &> /dev/null; then
    curl -fsSL -o nova.zip "$NOVA_URL"
elif command -v wget &> /dev/null; then
    wget -q -O nova.zip "$NOVA_URL"
else
    error "curl o wget requeridos"
fi

success "Descarga completada"

# Extract
log "Extrayendo archivos..."
if command -v unzip &> /dev/null; then
    unzip -q -o nova.zip
    mv nova.ai-master/* .
    rm -rf nova.ai-master nova.zip
else
    error "unzip requerido"
fi

success "Archivos extraídos"

# Install dependencies
log "Instalando dependencias..."
npm install --production --silent

success "Dependencias instaladas"

# Create launcher
log "Creando lanzador..."
LAUNCHER="$HOME/.local/bin/nova-ultra"
mkdir -p "$HOME/.local/bin"

cat > "$LAUNCHER" << 'EOF'
#!/bin/bash
cd "$HOME/.nova-ultra"
node src/index.js "$@"
EOF

chmod +x "$LAUNCHER"

# Add to PATH if needed
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    warn "Por favor reinicia tu terminal o ejecuta: source ~/.bashrc"
fi

success "Lanzador creado en $LAUNCHER"

# Setup config
log "Configurando..."
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    
    # Add OpenRouter key by default
    echo "OPENROUTER_API_KEY=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" >> "$INSTALL_DIR/.env"
fi

# Create data directories
mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/logs" "$INSTALL_DIR/skills/generated"

# Desktop entry (Linux)
if [[ "$PLATFORM" == "linux" ]]; then
    DESKTOP_FILE="$HOME/.local/share/applications/nova-ultra.desktop"
    mkdir -p "$(dirname $DESKTOP_FILE)"
    
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=Nova Ultra
Comment=AI Assistant Sin Censura
Exec=$LAUNCHER
Icon=$INSTALL_DIR/icon.png
Terminal=true
Type=Application
Categories=Utility;Network;
EOF
    
    success "Entrada de escritorio creada"
fi

# Systemd service
if [[ "$PLATFORM" == "linux" ]] && command -v systemctl &> /dev/null; then
    log "Creando servicio systemd..."
    
    SERVICE_FILE="$HOME/.config/systemd/user/nova-ultra.service"
    mkdir -p "$(dirname $SERVICE_FILE)"
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Nova Ultra AI Assistant
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=$HOME/.local/bin/nova-ultra
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
EOF

    systemctl --user daemon-reload
    
    warn "Servicio creado. Para activar auto-start:"
    warn "  systemctl --user enable nova-ultra"
    warn "  systemctl --user start nova-ultra"
fi

# Success message
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║        🦾 NOVA ULTRA INSTALADO EXITOSAMENTE          ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Versión: $NOVA_VERSION                                  ║"
echo "║  Ubicación: $INSTALL_DIR                     ║"
echo "║  Comando: nova-ultra                                   ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Próximos pasos:                                       ║"
echo "║    1. Edita ~/.nova-ultra/.env con tus API keys       ║"
echo "║    2. Ejecuta: nova-ultra                              ║"
echo "║    3. Escanea el QR de WhatsApp                      ║"
echo "║                                                        ║"
echo "║  Features:                                             ║"
echo "║    ✅ OpenRouter Sin Censura                          ║"
echo "║    ✅ 13+ Skills Protegidos                            ║"
echo "║    ✅ Multiplataforma                                  ║"
echo "║    ✅ Vector Memory                                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

success "Instalación completada! Reinicia tu terminal o ejecuta:"
success "  source ~/.bashrc && nova-ultra"
