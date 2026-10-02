#!/bin/bash
# Instala "TikTok Video AI" en tu Mac: crea la app en Aplicaciones y la pone en el Dock.
# Uso (en Terminal):
#   curl -fsSL https://raw.githubusercontent.com/alianzassierraco-oss/Drop/claude/elegant-meitner-i5yqk8/tiktok-video-ai/instalar.sh | bash
set -e

REPO="alianzassierraco-oss/Drop"
BRANCH="claude/elegant-meitner-i5yqk8"
APP_NAME="TikTok Video AI"
HOME_DIR="$HOME/TikTokVideoAI"
CODE="$HOME_DIR/app"
VENV="$HOME_DIR/.venv"

echo ""
echo "  ▶  Instalando ${APP_NAME}…"
echo ""

# 1. Código de la app (de esta carpeta si existe, si no se descarga de GitHub)
mkdir -p "$CODE"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
if [ -n "$SRC" ] && [ -f "$SRC/app.py" ]; then
  cp -R "$SRC/." "$CODE/"
else
  TMP="$(mktemp -d)"
  curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/$BRANCH" | tar xz -C "$TMP"
  cp -R "$TMP"/*/tiktok-video-ai/. "$CODE/"
  rm -rf "$TMP"
fi
echo "  ✓ Archivos descargados"

# 2. Python propio de la app (con uv, no hace falta instalar nada más)
export PATH="$HOME/.local/bin:$PATH"
# Usar solo el Python que descarga uv (evita que macOS pida instalar herramientas de Xcode)
export UV_PYTHON_PREFERENCE=only-managed
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null 2>&1
fi
uv python install --quiet 3.12
uv venv --quiet --allow-existing --python-preference only-managed --python 3.12 "$VENV"
# Paquetes con partes compiladas: usar solo versiones ya listas (los Mac Intel no tienen compilador)
ONLY_BINARY=""
for p in cryptography cffi pydantic-core jiter pillow markupsafe charset-normalizer websockets \
         pyobjc-core pyobjc-framework-cocoa pyobjc-framework-quartz pyobjc-framework-webkit \
         pyobjc-framework-security pyobjc-framework-uniformtypeidentifiers; do
  ONLY_BINARY="$ONLY_BINARY --only-binary $p"
done
uv pip install --quiet --python "$VENV/bin/python" $ONLY_BINARY -r "$CODE/requirements.txt"
echo "  ✓ Componentes instalados"

# 3. Crear la app con ícono
APPS="/Applications"
[ -w "$APPS" ] || { APPS="$HOME/Applications"; mkdir -p "$APPS"; }
BUNDLE="$APPS/${APP_NAME}.app"
rm -rf "$BUNDLE"
mkdir -p "$BUNDLE/Contents/MacOS" "$BUNDLE/Contents/Resources"
cp "$CODE/mac/icon.icns" "$BUNDLE/Contents/Resources/icon.icns"
cat > "$BUNDLE/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key><string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key><string>com.alianzassierra.tiktokvideoai</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>launcher</string>
  <key>CFBundleIconFile</key><string>icon</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
cat > "$BUNDLE/Contents/MacOS/launcher" <<LAUNCH
#!/bin/bash
cd "$CODE"
exec "$VENV/bin/python" "$CODE/app.py" >> "$HOME_DIR/app.log" 2>&1
LAUNCH
chmod +x "$BUNDLE/Contents/MacOS/launcher"
touch "$BUNDLE"
echo "  ✓ App creada en $APPS"

# 4. Ponerla en el Dock (solo si aún no está)
if ! defaults read com.apple.dock persistent-apps 2>/dev/null | grep -q "${APP_NAME}.app"; then
  defaults write com.apple.dock persistent-apps -array-add \
    "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>$BUNDLE</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>"
  killall Dock || true
fi
echo "  ✓ Ícono agregado al Dock"

echo ""
echo "  🎬  ¡Listo! Abriendo ${APP_NAME}…"
echo ""
open "$BUNDLE"
