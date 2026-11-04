# GleamXi – Landing page 2x1

Página estática lista para publicar (HTML + CSS + JS, sin dependencias).

## Archivos
- `index.html` – la página.
- `assets/css/styles.css` – estilos.
- `assets/js/config.js` – **lo único que necesitas editar**.
- `assets/js/main.js` – temporizador, WhatsApp, formulario y animaciones.
- `assets/img/` – imágenes del producto.

## Configuración (`assets/js/config.js`)
| Campo | Qué hace |
|---|---|
| `whatsapp` | Tu número con código de país, solo dígitos (ej. `573001234567`). |
| `finPromocion` | Fecha fija de fin del 2x1 (ej. `2026-11-30T23:59:59-05:00`). El contador no se reinicia al recargar. |
| `precioPromo` / `precioNormal` | Opcionales. En `null` no se muestran precios. |
| `moneda` / `idioma` | Formato del precio (ej. `COP` / `es-CO`). |

## Publicar
- **GitHub Pages:** Settings → Pages → Branch: la rama con estos archivos, carpeta `/ (root)`.
- **Netlify / Vercel:** arrastra la carpeta del proyecto o conecta el repositorio (no requiere build).
- **Hosting propio:** sube todos los archivos manteniendo la estructura de carpetas.
