const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Datos del QR (esto se actualizará dinámicamente)
let currentQR = null;

function generateQRPage(qrData) {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦾 Nova Ultra - WhatsApp QR</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', -apple-system, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #ff0066, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { color: #888; margin-bottom: 30px; }
        .qr-box {
            background: #fff;
            padding: 20px;
            border-radius: 20px;
            margin: 30px auto;
            display: inline-block;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .qr-box img {
            width: 300px;
            height: 300px;
            display: block;
        }
        .instructions {
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 20px;
            margin-top: 20px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .instructions h3 { color: #ff0066; margin-bottom: 15px; }
        .instructions ol {
            text-align: left;
            padding-left: 20px;
            line-height: 1.8;
        }
        .instructions li { margin: 10px 0; }
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            background: rgba(255,255,255,0.05);
        }
        .connected { color: #00ff88; }
        .connecting { color: #ffaa00; }
        .refresh-btn {
            background: linear-gradient(135deg, #ff0066, #ff6b6b);
            border: none;
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 20px;
            transition: transform 0.2s;
        }
        .refresh-btn:hover { transform: scale(1.05); }
        .logo { font-size: 3rem; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🦾</div>
        <h1>Nova Ultra v2.0</h1>
        <p class="subtitle">Better than OpenClaw - Sin Censura</p>
        
        <div class="qr-box">
            <img src="${qrData}" alt="WhatsApp QR Code" id="qrImage">
        </div>
        
        <div class="status connecting" id="status">
            ⏳ Esperando conexión... Escanea el código QR
        </div>
        
        <div class="instructions">
            <h3>📱 Cómo conectar WhatsApp:</h3>
            <ol>
                <li>Abre <strong>WhatsApp</strong> en tu teléfono</li>
                <li>Ve a <strong>⋮ (tres puntos)</strong> → <strong>Dispositivos vinculados</strong></li>
                <li>Toca <strong>"Vincular un dispositivo"</strong></li>
                <li><strong>Apunta la cámara al QR</strong> de arriba</li>
                <li>¡Listo! Nova responderá a tus mensajes</li>
            </ol>
        </div>
        
        <button class="refresh-btn" onclick="location.reload()">
            🔄 Actualizar QR
        </button>
        
        <p style="margin-top: 30px; color: #888; font-size: 0.9rem;">
            Auto-commit GitHub activado • AI Sin Censura • HubbaX Ready
        </p>
    </div>
    
    <script>
        // Auto-refresh cada 30 segundos
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
    `;
    
    const qrPath = path.join(__dirname, '..', 'QR-WHATSAPP.html');
    fs.writeFileSync(qrPath, html);
    console.log('\n🌐 QR Guardado en:', qrPath);
    console.log('   Abre el archivo QR-WHATSAPP.html con doble click\n');
}

// Exportar función para usar desde el bot
module.exports = { generateQRPage };

// Ejecutar directamente para prueba
if (require.main === module) {
    // Generar QR de prueba
    qrcode.toDataURL('TEST', (err, url) => {
        if (!err) generateQRPage(url);
    });
}
