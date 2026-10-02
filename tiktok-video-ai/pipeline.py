"""Motor de la app: analiza videos de TikTok con Claude y monta un video nuevo con ffmpeg."""

import base64
import json
import re
import shutil
import subprocess
import textwrap
from pathlib import Path

import anthropic
from PIL import Image, ImageDraw, ImageFont

MODEL = "claude-opus-5-5"
WIDTH, HEIGHT, FPS = 1080, 1920, 30
FRAMES_PER_VIDEO = 10


def ffmpeg_bin() -> str:
    """Usa el ffmpeg del sistema (brew) o el que trae imageio-ffmpeg."""
    found = shutil.which("ffmpeg")
    if found:
        return found
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg falló:\n{result.stderr[-1500:]}")
    return result


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
        f = out_dir / f"v{idx}_{i}.jpg"
        run([ffmpeg_bin(), "-y", "-ss", str(t), "-i", str(video), "-frames:v", "1",
             "-vf", "scale=-2:640", "-q:v", "4", str(f)])
        if f.exists():
            frames.append((t, f))
    return frames


PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "titulo": {"type": "string"},
        "analisis": {"type": "string", "description": "Qué hace funcionar a los videos originales: gancho, ritmo, estilo."},
        "segmentos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "video": {"type": "integer", "description": "Número de video (empieza en 1)."},
                    "inicio": {"type": "number"},
                    "fin": {"type": "number"},
                    "texto": {"type": "string", "description": "Texto corto en pantalla (máx ~8 palabras) o vacío."},
                },
                "required": ["video", "inicio", "fin", "texto"],
                "additionalProperties": False,
            },
        },
        "caption": {"type": "string"},
        "hashtags": {"type": "array", "items": {"type": "string"}},
        "guion_voz": {"type": "string", "description": "Guion opcional para grabar una voz en off."},
    },
    "required": ["titulo", "analisis", "segmentos", "caption", "hashtags", "guion_voz"],
    "additionalProperties": False,
}

SYSTEM = """Eres un editor experto en videos virales de TikTok, Reels y Shorts.
Recibes fotogramas (con su segundo exacto) de uno o varios videos y las instrucciones del usuario.
Diseña un video NUEVO vertical cortando y reordenando fragmentos de esos videos:
- Empieza con el gancho más fuerte en los primeros 2 segundos.
- Cortes dinámicos (normalmente 1.5 a 4 s por segmento).
- Usa solo tiempos dentro de la duración de cada video.
- Textos en pantalla cortos, potentes y en el idioma del usuario.
- Respeta la duración objetivo.
Escribe todo en español salvo que el usuario pida otro idioma."""


def make_plan(client: anthropic.Anthropic, videos: list[dict], instrucciones: str, duracion: int) -> dict:
    content: list[dict] = []
    for v in videos:
        content.append({"type": "text", "text": f"=== VIDEO {v['n']} — duración {v['duration']:.1f}s ==="})
        for t, f in v["frames"]:
            content.append({"type": "text", "text": f"Video {v['n']}, segundo {t}:"})
            content.append({"type": "image", "source": {
                "type": "base64", "media_type": "image/jpeg",
                "data": base64.standard_b64encode(f.read_bytes()).decode()}})
    content.append({"type": "text", "text":
                    f"Instrucciones del usuario: {instrucciones or 'Haz el video más viral posible.'}\n"
                    f"Duración objetivo: unos {duracion} segundos."})

    with client.beta.messages.stream(
        model=MODEL,
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
        raise RuntimeError("La IA no pudo procesar este contenido. Prueba con otros videos.")
    if response.stop_reason == "max_tokens":
        raise RuntimeError("La respuesta de la IA quedó incompleta. Intenta de nuevo.")
    text = next(b.text for b in response.content if b.type == "text")
    return json.loads(text)


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
        y = int(HEIGHT * 0.28) - len(lines) * line_h // 2
        for line in lines:
            w = draw.textlength(line, font=font)
            draw.text(((WIDTH - w) / 2, y), line, font=font, fill="white",
                      stroke_width=7, stroke_fill="black")
            y += line_h
    img.save(out)
    return out


def render(plan: dict, videos: list[dict], work: Path, out_file: Path, music: Path | None, progress) -> Path:
    by_n = {v["n"]: v for v in videos}
    parts = []
    segs = [s for s in plan["segmentos"] if s["video"] in by_n]
    for i, seg in enumerate(segs):
        v = by_n[seg["video"]]
        start = max(0.0, min(seg["inicio"], v["duration"] - 0.5))
        end = min(max(seg["fin"], start + 0.5), v["duration"])
        dur = end - start
        overlay = text_overlay(seg["texto"], work / f"txt_{i}.png")
        part = work / f"part_{i}.mp4"
        audio_map = "0:a:0" if v["has_audio"] else "2:a"
        run([ffmpeg_bin(), "-y", "-ss", f"{start:.2f}", "-t", f"{dur:.2f}", "-i", str(v["path"]),
             "-i", str(overlay),
             "-f", "lavfi", "-t", f"{dur:.2f}", "-i", "anullsrc=r=44100:cl=stereo",
             "-filter_complex",
             f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
             f"crop={WIDTH}:{HEIGHT},setsar=1,fps={FPS}[bg];[bg][1:v]overlay=0:0[v]",
             "-map", "[v]", "-map", audio_map,
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-ar", "44100", "-ac", "2", "-shortest", str(part)])
        parts.append(part)
        progress(f"Montando segmento {i + 1} de {len(segs)}…")

    if not parts:
        raise RuntimeError("La IA no devolvió segmentos válidos.")

    listfile = work / "lista.txt"
    listfile.write_text("".join(f"file '{p.name}'\n" for p in parts))
    joined = work / "unido.mp4"
    run([ffmpeg_bin(), "-y", "-f", "concat", "-safe", "0", "-i", str(listfile), "-c", "copy", str(joined)])

    if music:
        progress("Agregando música…")
        run([ffmpeg_bin(), "-y", "-i", str(joined), "-stream_loop", "-1", "-i", str(music),
             "-filter_complex", "[0:a]volume=0.6[a0];[1:a]volume=0.35[a1];"
             "[a0][a1]amix=inputs=2:duration=first[a]",
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest", str(out_file)])
    else:
        shutil.copy(joined, out_file)
    return out_file


def process(job: dict, files: list[Path], urls: list[str], instrucciones: str, duracion: int,
            music: Path | None, work: Path, out_file: Path, api_key: str) -> None:
    def progress(msg: str) -> None:
        job["status"] = msg

    for u in urls:
        progress(f"Descargando {u[:50]}…")
        files.append(download_url(u, work))

    videos = []
    for n, f in enumerate(files, start=1):
        progress(f"Analizando video {n} de {len(files)}…")
        info = probe(f)
        videos.append({"n": n, "path": f, **info, "frames": extract_frames(f, info["duration"], work, n)})

    progress("La IA está viendo tus videos y creando el plan de edición…")
    client = anthropic.Anthropic(api_key=api_key)
    plan = make_plan(client, videos, instrucciones, duracion)
    job["plan"] = plan

    render(plan, videos, work, out_file, music, progress)
    job["status"] = "¡Listo!"
    job["done"] = True
