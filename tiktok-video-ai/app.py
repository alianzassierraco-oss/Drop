"""SN DROP — app para Mac. Abre una ventana propia (o el navegador si no se puede)."""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import threading
import uuid
import webbrowser
from pathlib import Path

import anthropic
from flask import Flask, jsonify, render_template, request, send_from_directory
from werkzeug.utils import secure_filename

import pipeline

HOME = Path.home() / "SN DROP"
JOBS_DIR = HOME / "trabajos"
OUTPUT_DIR = HOME / "Videos creados"
CONFIG = HOME / "config.json"
for d in (JOBS_DIR, OUTPUT_DIR):
    d.mkdir(parents=True, exist_ok=True)
_OLD_CONFIG = Path.home() / "TikTokVideoAI" / "config.json"  # claves de la versión anterior
if _OLD_CONFIG.exists() and not CONFIG.exists():
    CONFIG.write_text(_OLD_CONFIG.read_text())

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024 * 1024  # 2 GB
jobs = {}


def load_keys() -> dict:
    keys = {"anthropic": os.environ.get("ANTHROPIC_API_KEY", ""), "google": os.environ.get("GEMINI_API_KEY", "")}
    if CONFIG.exists():
        keys.update({k: v for k, v in json.loads(CONFIG.read_text()).items() if v})
    return keys


@app.get("/")
def index():
    keys = load_keys()
    return render_template("index.html", has_keys=bool(keys["anthropic"] and keys["google"]))


@app.post("/api/keys")
def save_keys():
    data = request.json or {}
    keys = load_keys()
    for k in ("anthropic", "google"):
        if data.get(k, "").strip():
            keys[k] = data[k].strip()
    CONFIG.write_text(json.dumps(keys))
    CONFIG.chmod(0o600)
    return jsonify(ok=bool(keys["anthropic"] and keys["google"]))


@app.post("/api/crear")
def crear():
    keys = load_keys()
    gratis = request.form.get("modo") == "gratis"
    if not gratis and not (keys["anthropic"] and keys["google"]):
        return jsonify(error="El modo IA Pro necesita tus dos claves (botón Claves). "
                             "O usa el Modo gratis."), 400

    job_id = uuid.uuid4().hex[:10]
    work = JOBS_DIR / job_id
    work.mkdir()

    def save(field: str, prefix: str = "") -> Path | None:
        f = request.files.get(field)
        if f and f.filename:
            p = work / (prefix + secure_filename(f.filename))
            f.save(p)
            return p
        return None

    files = []
    for f in request.files.getlist("videos"):
        if f.filename:
            p = work / secure_filename(f.filename)
            f.save(p)
            files.append(p)
    urls = [u.strip() for u in request.form.get("links", "").splitlines() if u.strip()]
    if not files and not urls:
        return jsonify(error="Sube tus videos (o pega sus links)."), 400

    foto = save("foto", "producto_")
    music = save("musica", "musica_")
    instrucciones = request.form.get("instrucciones", "")
    duracion = int(request.form.get("duracion", "16") or 16)
    calidad = request.form.get("calidad", "economico")
    if calidad not in pipeline.VEO_MODELS:
        calidad = "economico"

    out_name = f"video_{job_id}.mp4"
    job = jobs[job_id] = {"status": "Empezando…", "done": False, "error": None, "plan": None, "video": out_name}

    request_look = request.form.get("look", "aleatorio")
    textos = [t.strip() for t in request.form.get("textos", "").splitlines() if t.strip()]

    def worker():
        try:
            if gratis:
                pipeline.process_free(job, files, urls, duracion, textos, music, work, OUTPUT_DIR / out_name,
                                      request_look)
            else:
                pipeline.process(job, files, urls, instrucciones, duracion, calidad, foto, music, work,
                                 OUTPUT_DIR / out_name, keys)
        except anthropic.AuthenticationError:
            job["error"] = "Tu clave de Anthropic no es válida. Cámbiala en Claves."
        except anthropic.RateLimitError:
            job["error"] = "Demasiadas peticiones a Claude. Espera un minuto y vuelve a intentar."
        except anthropic.APIConnectionError:
            job["error"] = "Sin conexión a internet."
        except anthropic.APIStatusError as e:
            job["error"] = f"Error de Claude: {e.message}"
        except Exception as e:  # mostrar cualquier otro fallo en la ventana
            job["error"] = str(e)

    threading.Thread(target=worker, daemon=True).start()
    return jsonify(job_id=job_id)


@app.get("/api/estado/<job_id>")
def estado(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify(error="Trabajo no encontrado"), 404
    return jsonify(job)


@app.get("/videos/<path:name>")
def video(name):
    return send_from_directory(OUTPUT_DIR, name)


@app.post("/api/finder/<path:name>")
def finder(name):
    path = OUTPUT_DIR / secure_filename(name)
    if sys.platform == "darwin" and path.exists():
        subprocess.run(["open", "-R", str(path)])
    return jsonify(ok=True)


@app.post("/api/copiar")
def copiar():
    text = (request.json or {}).get("text", "")
    if sys.platform == "darwin":
        subprocess.run(["pbcopy"], input=text, text=True)
    return jsonify(ok=True)


@app.post("/api/abrir")
def abrir():
    url = (request.json or {}).get("url", "")
    if url.startswith("https://"):
        webbrowser.open(url)
    return jsonify(ok=True)


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


if __name__ == "__main__":
    port = free_port()
    url = f"http://127.0.0.1:{port}"
    server = threading.Thread(target=lambda: app.run(host="127.0.0.1", port=port, debug=False), daemon=True)
    server.start()
    try:
        import webview

        webview.create_window("SN DROP", url, width=1280, height=880, min_size=(420, 600),
                              background_color="#05070D")
        webview.start()
    except Exception:
        print(f"Abriendo en el navegador: {url}")
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
        server.join()
