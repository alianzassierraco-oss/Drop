# 🎬 TikTok Video AI (para Mac)

App que corre en tu Mac: le mandas videos de TikTok (archivos o links) y la IA (Claude)
los mira, elige los mejores momentos y crea un **video nuevo vertical 9:16** con textos en
pantalla, además del caption, hashtags y un guion para voz en off.

## Cómo instalarla (una sola vez)

1. **Descarga esta carpeta** `tiktok-video-ai` en tu Mac
   (en GitHub: botón verde **Code → Download ZIP**, y descomprímelo).
2. Si no tienes Python: instálalo desde <https://www.python.org/downloads/macos/>.
3. Consigue tu **API key** de Anthropic en <https://console.anthropic.com/settings/keys>
   (necesita saldo; cada video cuesta pocos centavos de dólar).

## Cómo abrirla

- Haz **doble clic** en `Abrir TikTok Video AI.command`.
  - La primera vez macOS puede bloquearlo: clic derecho → **Abrir** → **Abrir**.
  - Si dice "permiso denegado", abre Terminal y escribe:
    `chmod +x ` (con espacio), arrastra el archivo a la ventana y pulsa Enter.
- Se abre sola en tu navegador: <http://127.0.0.1:5055>
- La primera vez te pide la API key (botón **API key** arriba a la derecha).

## Cómo se usa

1. Arrastra uno o varios videos de TikTok (o pega links de TikTok).
2. Escribe qué video quieres (o elige un estilo: Resumen viral, Anuncio, Tutorial, Antes y después).
3. Elige la duración y, si quieres, una música de fondo.
4. Pulsa **Crear video con IA** y espera 1–3 minutos.
5. Descarga el video y copia el caption + hashtags.

Los videos creados se guardan en tu carpeta `~/TikTokVideoAI/videos_creados`.

## Cómo funciona

1. `ffmpeg` saca fotogramas de cada video.
2. Claude ve los fotogramas + tus instrucciones y devuelve un plan de edición
   (qué partes cortar, en qué orden, qué texto poner).
3. `ffmpeg` corta, recorta a 1080×1920, pone los textos y une todo.

> Usa videos propios o con permiso del creador: subir contenido ajeno puede violar derechos de autor
> y las normas de TikTok.
