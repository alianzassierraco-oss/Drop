# Sitio de visas para Australia — plantilla

Rediseño de un sitio de consultoría migratoria (visa de estudiante, visas calificadas, patrocinio, familia, empleo y apelaciones).
Es un sitio estático: HTML + CSS + un poco de JavaScript, sin dependencias ni instalación.

## Páginas

| Archivo | Contenido |
|---|---|
| `index.html` | Inicio: servicios, por qué elegirnos, reseñas y formulario de contacto |
| `student-visa.html` | Visa de estudiante (subclase 500) |
| `skilled.html` | Visas calificadas 189 / 190 / 491 |
| `sponsor.html` | Visas patrocinadas por empleador 482 / 186 / 494 |
| `family.html` | Visas de pareja, padres e hijos |
| `jobs.html` | Empleo, recursos y regiones DAMA |
| `appeals.html` | Apelaciones de visas (ART) |
| `about.html` | Visión, misión y equipo |
| `faq.html` | Preguntas frecuentes |

## Qué tiene que completar el dueño

Todo lo que está entre **[corchetes]** es un dato que hay que reemplazar.

1. **`assets/site.js`**, objeto `SITE` al principio del archivo: nombre de la agencia, oficinas, teléfonos, email,
   enlace del botón "Get Started" (formulario, Calendly, etc.), WhatsApp, redes sociales y valoración de Google.
   Se cambia una sola vez y se actualiza en todas las páginas.
2. **Reseñas:** pegar en `SITE.reviewsEmbed` el código del widget de reseñas de Google del negocio.
   Mientras esté vacío, se muestran tarjetas de ejemplo.
3. **`about.html`:** nombres, cargos, credenciales y biografías del equipo, y los años de experiencia.
4. **`jobs.html`:** enlaces a los archivos descargables (están como `#`).
5. **`index.html`:** conectar el formulario de contacto a un servicio (Formspree, Netlify Forms, etc.) en el `action`.
6. **`index.html`:** los idiomas que habla el equipo.
7. **Logo:** poner el archivo en `assets/img/` y escribir la ruta en `SITE.logoImage` (si no, se ve el texto de `SITE.logoText`).
8. **Video:** pegar el ID del video de YouTube en `SITE.youtubeId` (lo que va después de `v=` en el enlace).
9. **Cifras:** en `index.html`, cambiar las estadísticas entre corchetes ([500+], [122], etc.) por números reales.

## Fotos

Todas las fotos se eligen en un solo lugar: el objeto `PHOTOS` en `assets/site.js`.
Por defecto son fotos libres de [Unsplash](https://unsplash.com) que se cargan desde internet.
Para usar fotos propias (recomendado: oficina, equipo, clientes reales con permiso), copiarlas a `assets/img/`
y reemplazar el valor, por ejemplo `team: "assets/img/equipo.jpg"`. Se actualizan en todas las páginas.

## Verlo en la computadora

Abrir `index.html` en el navegador (doble clic). Para publicarlo se puede subir la carpeta completa
a cualquier hosting estático (Netlify, Vercel, GitHub Pages, cPanel, etc.).

## Notas

- La información migratoria (costos, requisitos, plazos) cambia a menudo. Antes de publicar, revisarla en
  [immi.homeaffairs.gov.au](https://immi.homeaffairs.gov.au). Cada sección tiene enlaces a las fuentes oficiales.
- Se corrigieron errores del sitio original ("Skilled pathwat", "NORTHEN", "begining", "folowing", etc.)
  y se quitó la visa 489, que ya está cerrada a nuevas solicitudes.
- La página que antes se llamaba "Reviews" en realidad trataba de apelaciones; ahora se llama **Visa Appeals** (`appeals.html`).
