#!/bin/bash
# Doble clic en este archivo en tu Mac para abrir la app.
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  osascript -e 'display dialog "Necesitas instalar Python 3. Descárgalo de python.org/downloads y vuelve a abrir la app." buttons {"OK"}'
  open "https://www.python.org/downloads/macos/"
  exit 1
fi

if [ ! -d ".venv" ]; then
  echo "Instalando la app por primera vez (tarda 1-2 minutos)…"
  python3 -m venv .venv || exit 1
fi
source .venv/bin/activate
pip install -q --upgrade pip >/dev/null
pip install -q -r requirements.txt || exit 1

python app.py
