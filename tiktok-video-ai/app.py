"""TikTok Video AI — app local para Mac. Ejecuta: python app.py y abre http://127.0.0.1:5055"""

import json
import os
import threading
import uuid
import webbrowser
from pathlib import Path

import anthropic
from flask import Flask, jsonify, render_template, request, send_from_directory
from werkzeug.utils import secure_filename

import pipeline

HOME = Path.home() / "TikTokVideoAI"
JOBS_DIR = HOME / "trabajos"
OUTPUT_DIR = HOME / "videos_creados"
CONFIG = HOME / "config.json"
for d in (JOBS_DIR, OUTPUT_DIR):
    d.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024 * 1024  # 2 GB
jobs: dict[str, dict] = {}


def get_api_key() -> str:
    if CONFIG.exists():
        key = json.loads(CONFIG.read_text()).get("api_key", "")
        if key:
            return key
    return os.environ.get("ANTHROPIC_API_KEY", "")


@app.get("/")
def index():
    return render_template("index.html", has_key=bool(get_api_key()))


@app.post("/api/key")
def save_key():
    key = (request.json or {}).get("api_key", "").strip()
    if not key:
        return jsonify(error="Escribe tu API key"), 400
    CONFIG.write_text(json.dumps({"api_key": key}))
    CONFIG.chmod(0o600)
    return jsonify(ok=True)


@app.post("/api/crear")
def crear():
    api_key = get_api_key()
    if not api_key:
        return jsonify(error="Primero guarda tu API key de Anthropic (botón ⚙︎)."), 400

    job_id = uuid.uuid4().hex[:10]
    work = JOBS_DIR / job_id
    work.mkdir()

    files = []
    for f in request.files.getlist("videos"):
        if f.filename:
            p = work / secure_filename(f.filename)
            f.save(p)
            files.append(p)
    urls = [u.strip() for u in request.form.get("links", "").splitlines() if u.strip()]
    if not files and not urls:
        return jsonify(error="Sube al menos un video o pega un link de TikTok."), 400

    music = None
    m = request.files.get("musica")
    if m and m.filename:
        music = work / ("musica_" + secure_filename(m.filename))
        m.save(music)

    instrucciones = request.form.get("instrucciones", "")
    duracion = int(request.form.get("duracion", "20") or 20)
    out_name = f"video_{job_id}.mp4"
    job = jobs[job_id] = {"status": "Empezando…", "done": False, "error": None, "plan": None, "video": out_name}

    def worker():
        try:
            pipeline.process(job, files, urls, instrucciones, duracion, music, work,
                             OUTPUT_DIR / out_name, api_key)
        except anthropic.AuthenticationError:
            job["error"] = "Tu API key no es válida. Cámbiala en ⚙︎."
        except anthropic.RateLimitError:
            job["error"] = "Demasiadas peticiones. Espera un minuto y vuelve a intentar."
        except anthropic.APIConnectionError:
            job["error"] = "Sin conexión a internet."
        except anthropic.APIStatusError as e:
            job["error"] = f"Error de la IA: {e.message}"
        except Exception as e:  # mostrar cualquier otro fallo en la interfaz
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


if __name__ == "__main__":
    url = "http://127.0.0.1:5055"
    print(f"\n  TikTok Video AI corriendo en {url}\n  Tus videos se guardan en {OUTPUT_DIR}\n")
    threading.Timer(1.2, lambda: webbrowser.open(url)).start()
    app.run(host="127.0.0.1", port=5055, debug=False)
