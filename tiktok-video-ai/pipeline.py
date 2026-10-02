"""Motor de SN DROP.

Modo IA Pro:
1. Claude mira 2-3 TikToks de referencia y escribe un guion de escenas nuevas.
2. Veo (IA de video de Google) genera cada escena desde cero, con sonido.
3. ffmpeg une las escenas, pone los textos en pantalla y la música.

Modo gratis: detecta los cortes de tus propios videos y arma un TikTok nuevo
con los mejores tramos, tus textos y tu música, sin usar servicios de pago.
"""

from __future__ import annotations

import base64
import json
import math
import random
import re
import shutil
import subprocess
import textwrap
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import anthropic
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from PIL import Image, ImageDraw, ImageFont

CLAUDE_MODEL = "claude-opus-5-5"
# Se prueban en orden: si Google retira un nombre se usa el siguiente.
VEO_MODELS = {
    "calidad": ["veo-3.1-generate-001", "veo-3.1-generate-preview"],
    "rapido": ["veo-3.1-fast-generate-001", "veo-3.1-fast-generate-preview"],
}
SCENE_SECONDS = 8
WIDTH, HEIGHT, FPS = 1080, 1920, 30
FRAMES_PER_VIDEO = 8


# ---------- utilidades de video ----------

def ffmpeg_bin() -> str:
    """Usa el ffmpeg del sistema si existe, si no el que trae imageio-ffmpeg."""
    found = shutil.which("ffmpeg")
    if found:
        return found
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg falló:\n{result.stderr[-1500:]}")


def probe(path: Path) -> dict:
    """Duración y si tiene audio, leyendo la salida de `ffmpeg -i` (no requiere ffprobe)."""
    out = subprocess.run([ffmpeg_bin(), "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", out)
    if not m:
        raise RuntimeError(f"No pude leer el video {path.name}")
    h, mnt, s = m.groups()
    return {"duration": int(h) * 3600 + int(mnt) * 60 + float(s), "has_audio": "Audio:" in out}


def download_url(url: str, dest: Path) -> Path:
    """Descarga un video de TikTok desde un link (usa yt-dlp)."""
    import yt_dlp

    opts = {
        "outtmpl": str(dest / "%(id)s.%(ext)s"),
        "format": "mp4/best",
        "quiet": True,
        "noplaylist": True,
        "ffmpeg_location": ffmpeg_bin(),
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return Path(ydl.prepare_filename(info))


def extract_frames(video: Path, duration: float, out_dir: Path, idx: int) -> list[tuple[float, Path]]:
    frames = []
    for i in range(FRAMES_PER_VIDEO):
        t = round(duration * (i + 0.5) / FRAMES_PER_VIDEO, 2)
        f = out_dir / f"ref{idx}_{i}.jpg"
        run([ffmpeg_bin(), "-y", "-ss", str(t), "-i", str(video), "-frames:v", "1",
             "-vf", "scale=-2:640", "-q:v", "4", str(f)])
        if f.exists():
            frames.append((t, f))
    return frames


# ---------- 1. Claude: guion ----------

PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "titulo": {"type": "string"},
        "analisis": {"type": "string", "description": "Qué hace funcionar a los videos de referencia."},
        "escenas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "prompt_video": {"type": "string", "description": "Prompt en inglés para el generador de video."},
                    "texto_pantalla": {"type": "string", "description": "Texto corto en pantalla (máx ~8 palabras) o vacío."},
                    "usar_foto_producto": {"type": "boolean"},
                },
                "required": ["prompt_video", "texto_pantalla", "usar_foto_producto"],
                "additionalProperties": False,
            },
        },
        "caption": {"type": "string"},
        "hashtags": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["titulo", "analisis", "escenas", "caption", "hashtags"],
    "additionalProperties": False,
}

SYSTEM = f"""Eres director creativo de videos virales de TikTok, Reels y Shorts.
Recibes fotogramas de 2 o 3 TikToks de referencia y lo que quiere el usuario.
Estudia qué los hace funcionar (gancho, ritmo, encuadres, luz, estilo, tipo de personas, sonido)
y crea el guion de un video COMPLETAMENTE NUEVO, original, elegante y que funcione para vender o enganchar.
No copies personas, marcas ni logos de las referencias: toma solo el estilo y la estructura.

Cada escena dura {SCENE_SECONDS} segundos y la genera una IA de video a partir de "prompt_video". Para cada prompt:
- Escríbelo en inglés, muy visual y concreto: sujeto, acción, entorno, luz, movimiento de cámara, lente, estilo.
- Formato vertical 9:16 de smartphone, look premium y cinematográfico.
- Describe el sonido (música, ambiente). Si alguien habla, escribe la frase exacta entre comillas
  y en el idioma del usuario, por ejemplo: A woman says in Spanish: "..."
- Pide "no on-screen text, no subtitles, no logos": los textos los pone la app aparte.
- Mantén personajes, colores y ambiente coherentes entre escenas para que parezca un solo video.
La primera escena debe enganchar en el primer segundo y la última cerrar con una llamada a la acción.
Marca usar_foto_producto=true solo en escenas donde el producto se vea de cerca, si el usuario subió una foto.
"texto_pantalla", caption y hashtags van en el idioma del usuario (español por defecto)."""


def make_plan(client: anthropic.Anthropic, refs: list[dict], instrucciones: str, escenas: int,
              tiene_foto: bool) -> dict:
    content: list[dict] = []
    for v in refs:
        content.append({"type": "text", "text": f"=== TIKTOK DE REFERENCIA {v['n']} ({v['duration']:.0f}s) ==="})
        for t, f in v["frames"]:
            content.append({"type": "text", "text": f"Referencia {v['n']}, segundo {t}:"})
            content.append({"type": "image", "source": {
                "type": "base64", "media_type": "image/jpeg",
                "data": base64.standard_b64encode(f.read_bytes()).decode()}})
    content.append({"type": "text", "text":
                    f"Lo que quiere el usuario: {instrucciones or 'Un video nuevo, viral y elegante.'}\n"
                    f"Número de escenas: exactamente {escenas}.\n"
                    f"¿Subió foto de su producto?: {'sí' if tiene_foto else 'no'}."})

    with client.beta.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=32000,
        system=SYSTEM,
        thinking={"type": "adaptive"},
        output_config={"effort": "high", "format": {"type": "json_schema", "schema": PLAN_SCHEMA}},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        messages=[{"role": "user", "content": content}],
    ) as stream:
        response = stream.get_final_message()

    if response.stop_reason == "refusal":
        raise RuntimeError("La IA no pudo trabajar con estos videos. Prueba con otros.")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("La respuesta de la IA quedó incompleta. Intenta de nuevo.")
    text = next(b.text for b in response.content if b.type == "text")
    plan = json.loads(text)
    plan["escenas"] = plan["escenas"][:escenas]
    return plan


# ---------- 2. Veo: generar cada escena ----------

def _veo_once(client: genai.Client, model: str, prompt: str, image: types.Image | None, out: Path) -> Path:
    operation = client.models.generate_videos(
        model=model,
        prompt=prompt,
        image=image,
        config=types.GenerateVideosConfig(
            aspect_ratio="9:16",
            duration_seconds=SCENE_SECONDS,
            number_of_videos=1,
            negative_prompt="text, subtitles, captions, watermark, logo, blurry, distorted hands",
        ),
    )
    while not operation.done:
        time.sleep(10)
        operation = client.operations.get(operation)
    if operation.error:
        raise RuntimeError(f"Veo: {operation.error}")
    videos = operation.response.generated_videos if operation.response else None
    if not videos:
        raise RuntimeError("Veo no devolvió video (posible filtro de contenido).")
    client.files.download(file=videos[0].video)
    videos[0].video.save(str(out))
    return out


def generate_scene(client: genai.Client, calidad: str, prompt: str, image: types.Image | None, out: Path) -> Path:
    last_error: Exception | None = None
    for model in VEO_MODELS[calidad]:
        for img in ([image, None] if image else [None]):  # si falla con foto, reintenta sin foto
            try:
                return _veo_once(client, model, prompt, img, out)
            except genai_errors.ClientError as e:
                last_error = e
                if e.code == 404:  # modelo no disponible: probar el siguiente
                    break
                if e.code in (401, 403) or "API key" in str(e):
                    raise RuntimeError("Tu API key de Google no es válida o no tiene acceso a Veo "
                                       "(necesita facturación activada).") from e
                if e.code == 429:
                    raise RuntimeError("Google dice que llegaste al límite de videos. Espera un rato.") from e
            except RuntimeError as e:
                last_error = e
    raise RuntimeError(f"No se pudo generar una escena: {last_error}")


# ---------- 3. Montaje ----------

def _font(size: int):
    for p in ["/System/Library/Fonts/Supplemental/Arial Black.ttf",
              "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
              "/Library/Fonts/Arial Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size=size)


def text_overlay(text: str, out: Path) -> Path:
    """PNG transparente 1080x1920 con el texto estilo TikTok (blanco con borde negro)."""
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    if text.strip():
        draw = ImageDraw.Draw(img)
        font = _font(78)
        lines = textwrap.wrap(text.strip(), width=18)
        line_h = 96
        y = int(HEIGHT * 0.25) - len(lines) * line_h // 2
        for line in lines:
            w = draw.textlength(line, font=font)
            draw.text(((WIDTH - w) / 2, y), line, font=font, fill="white", stroke_width=7, stroke_fill="black")
            y += line_h
    img.save(out)
    return out


# Looks de color para el modo gratis (filtros de ffmpeg)
LOOKS = {
    "vibrante": "eq=saturation=1.35:contrast=1.08:brightness=0.02",
    "cine": "eq=contrast=1.15:saturation=0.85,colorbalance=rs=0.05:bs=-0.05:rh=-0.04:bh=0.06,vignette=PI/5",
    "frio": "eq=contrast=1.08:saturation=1.1,colorbalance=bs=0.12:bm=0.06:rs=-0.05",
    "calido": "eq=contrast=1.06:saturation=1.15,colorbalance=rs=0.10:rm=0.05:bs=-0.08",
    "blanco y negro": "hue=s=0,eq=contrast=1.25",
}


def assemble(clips: list[tuple], work: Path, out_file: Path, music: Path | None) -> Path:
    """clips: (archivo, inicio, duración o None para todo, texto en pantalla[, efectos]).

    efectos (opcional): zoom (1.0-1.4), ox/oy (posición del recorte 0-1), espejo, look, velocidad, flash.
    """
    parts = []
    for i, (clip, start, length, texto, *rest) in enumerate(clips):
        fx = rest[0] if rest else {}
        info = probe(clip)
        length = length or info["duration"] - start
        dur = f"{length:.2f}"
        speed = fx.get("velocidad", 1.0)
        zoom = fx.get("zoom", 1.0)
        vf = [f"scale={int(WIDTH * zoom)}:{int(HEIGHT * zoom)}:force_original_aspect_ratio=increase",
              f"crop={WIDTH}:{HEIGHT}:(iw-{WIDTH})*{fx.get('ox', 0.5)}:(ih-{HEIGHT})*{fx.get('oy', 0.5)}"]
        if fx.get("espejo"):
            vf.append("hflip")
        if fx.get("look") in LOOKS:
            vf.append(LOOKS[fx["look"]])
        vf += ["setsar=1", f"fps={FPS}", f"setpts=PTS/{speed}"]
        if fx.get("flash"):
            vf.append("fade=in:st=0:d=0.15:color=white")
        audio_src = "0:a:0" if info["has_audio"] else "2:a"
        overlay = text_overlay(texto, work / f"txt_{i}.png")
        part = work / f"part_{i}.mp4"
        run([ffmpeg_bin(), "-y", "-ss", f"{start:.2f}", "-t", dur, "-i", str(clip), "-i", str(overlay),
             "-f", "lavfi", "-t", dur, "-i", "anullsrc=r=44100:cl=stereo",
             "-filter_complex",
             f"[0:v]{','.join(vf)}[bg];[bg][1:v]overlay=0:0[v];[{audio_src}]atempo={speed}[a]",
             "-map", "[v]", "-map", "[a]",
             "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-ar", "44100", "-ac", "2", "-shortest", str(part)])
        parts.append(part)

    listfile = work / "lista.txt"
    listfile.write_text("".join(f"file '{p.name}'\n" for p in parts))
    joined = work / "unido.mp4"
    run([ffmpeg_bin(), "-y", "-f", "concat", "-safe", "0", "-i", str(listfile), "-c", "copy", str(joined)])

    if music:
        run([ffmpeg_bin(), "-y", "-i", str(joined), "-stream_loop", "-1", "-i", str(music),
             "-filter_complex", "[0:a]volume=0.8[a0];[1:a]volume=0.3[a1];[a0][a1]amix=inputs=2:duration=first[a]",
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest", str(out_file)])
    else:
        shutil.copy(joined, out_file)
    return out_file


# ---------- todo junto ----------

def process(job: dict, files: list[Path], urls: list[str], instrucciones: str, duracion: int,
            calidad: str, foto: Path | None, music: Path | None, work: Path, out_file: Path,
            keys: dict) -> None:
    def progress(msg: str) -> None:
        job["status"] = msg

    for u in urls:
        progress("Descargando TikTok…")
        files.append(download_url(u, work))

    refs = []
    for n, f in enumerate(files, start=1):
        progress(f"Mirando TikTok {n} de {len(files)}…")
        info = probe(f)
        refs.append({"n": n, **info, "frames": extract_frames(f, info["duration"], work, n)})

    escenas = max(1, min(5, math.ceil(duracion / SCENE_SECONDS)))
    progress("La IA está estudiando tus TikToks y escribiendo el guion…")
    plan = make_plan(anthropic.Anthropic(api_key=keys["anthropic"]), refs, instrucciones, escenas, foto is not None)
    job["plan"] = plan

    image = None
    if foto:
        mime = "image/png" if foto.suffix.lower() == ".png" else "image/jpeg"
        image = types.Image(image_bytes=foto.read_bytes(), mime_type=mime)

    gclient = genai.Client(api_key=keys["google"])
    total = len(plan["escenas"])
    progress(f"Generando {total} escenas nuevas con IA de video (tarda 2-6 minutos)…")
    done = [0]

    def one(i_esc):
        i, esc = i_esc
        img = image if esc["usar_foto_producto"] else None
        path = generate_scene(gclient, calidad, esc["prompt_video"], img, work / f"escena_{i}.mp4")
        done[0] += 1
        progress(f"Escenas listas: {done[0]} de {total}…")
        return path

    with ThreadPoolExecutor(max_workers=total) as pool:
        paths = list(pool.map(one, enumerate(plan["escenas"])))

    progress("Montando el video final…")
    assemble([(p, 0.0, None, e["texto_pantalla"]) for p, e in zip(paths, plan["escenas"])], work, out_file, music)
    job["status"] = "¡Listo!"
    job["done"] = True


# ---------- modo gratis ----------

def scene_cuts(video: Path) -> list[float]:
    """Segundos donde cambia la toma (detección de escenas de ffmpeg)."""
    out = subprocess.run([ffmpeg_bin(), "-hide_banner", "-i", str(video), "-an",
                          "-vf", "scale=160:-2,scdet=threshold=10", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return [float(t) for t in re.findall(r"lavfi\.scd\.time: ([0-9.]+)", out)]


def free_plan(videos: list[dict], duracion: float, textos: list[str], rng: random.Random) -> list[dict]:
    """Elige tramos cortos de cada video, en orden distinto cada vez, hasta llenar la duración."""
    shots_by_video = []
    for v in videos:
        bounds = [0.3] + [c for c in v["cuts"] if 0.3 < c < v["duration"] - 0.3] + [v["duration"]]
        shots = []
        for a, b in zip(bounds, bounds[1:]):
            t = a + rng.uniform(0, 0.6)  # cada versión arranca en un punto distinto
            while b - t >= 1.0:  # tomas largas se parten en tramos cortos y variados
                step = rng.uniform(1.3, 2.4)
                shots.append({"video": v["n"], "inicio": round(t, 2), "fin": round(min(t + step, b), 2)})
                t += step
        rng.shuffle(shots)  # orden nuevo: ya no sigue la historia del video original
        shots_by_video.append({"n": v["n"], "shots": shots, "ritmo": len(v["cuts"]) / max(v["duration"], 1)})

    # Empieza el video más dinámico (más cortes por segundo): sirve de gancho.
    shots_by_video.sort(key=lambda x: -x["ritmo"])
    queues = [list(x["shots"]) for x in shots_by_video]
    plan, total = [], 0.0
    while total < duracion and any(queues):
        for q in queues:
            if q and total < duracion:
                shot = q.pop(0)
                shot["fin"] = round(min(shot["fin"], shot["inicio"] + duracion - total), 2)
                if shot["fin"] - shot["inicio"] >= 0.7:
                    plan.append(shot)
                    total += shot["fin"] - shot["inicio"]
    if not plan:
        raise RuntimeError("Los videos son muy cortos. Sube clips de al menos 3 segundos.")

    for seg in plan:
        seg["texto"] = ""
    if textos:  # primer texto al inicio, último al final, el resto repartido
        n = len(plan)
        m = min(len(textos), n)
        for k, t in enumerate(textos[:m]):
            idx = 0 if m == 1 else round(k * (n - 1) / (m - 1))
            plan[idx]["texto"] = t
    return plan


def process_free(job: dict, files: list[Path], urls: list[str], duracion: int, textos: list[str],
                 music: Path | None, work: Path, out_file: Path, look: str = "aleatorio") -> None:
    def progress(msg: str) -> None:
        job["status"] = msg

    for u in urls:
        progress("Descargando TikTok…")
        files.append(download_url(u, work))

    videos = []
    for n, f in enumerate(files, start=1):
        progress(f"Buscando los mejores momentos del video {n} de {len(files)}…")
        videos.append({"n": n, "path": f, **probe(f), "cuts": scene_cuts(f)})

    rng = random.Random()  # cada video sale distinto
    if look not in LOOKS:
        look = rng.choice(list(LOOKS))
    espejo = rng.random() < 0.5
    velocidad = rng.choice([1.0, 1.1, 1.15])
    plan = free_plan(videos, duracion * velocidad, textos, rng)
    for i, seg in enumerate(plan):
        z = rng.uniform(1.12, 1.4) if i % 2 == 0 else rng.uniform(1.0, 1.15)  # zoom alternado
        seg["fx"] = {"zoom": round(z, 2), "ox": round(rng.random(), 2), "oy": round(rng.uniform(0.3, 0.7), 2),
                     "espejo": espejo, "look": look, "velocidad": velocidad, "flash": i > 0 and rng.random() < 0.4}
    job["plan"] = {"modo": "gratis", "titulo": "Tu video está listo", "segmentos": plan,
                   "estilo": f"Look {look} · {'espejo · ' if espejo else ''}velocidad x{velocidad} · zooms y cortes nuevos"}
    progress("Aplicando efectos y montando el video…")
    by_n = {v["n"]: v["path"] for v in videos}
    assemble([(by_n[s["video"]], s["inicio"], s["fin"] - s["inicio"], s["texto"], s["fx"]) for s in plan],
             work, out_file, music)
    job["status"] = "¡Listo!"
    job["done"] = True
