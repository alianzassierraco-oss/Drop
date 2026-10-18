/* =========================================================
   CONFIGURACIÓN — edita estos datos con la información real
   ========================================================= */
const CONFIG = {
  brandName: "Inmobiliaria",
  phone: "",            // ej. "+52 55 1234 5678"
  email: "",            // ej. "contacto@tudominio.com"
  whatsapp: "",         // solo dígitos con lada de país, ej. "5215512345678"
  address: "[Dirección de la oficina]",
  hours: "[Horario de atención]",
  currency: "MXN",
  locale: "es-MX",
};

/* =========================================================
   PROPIEDADES DE EJEMPLO — reemplázalas con tu inventario
   operacion: "venta" | "renta"
   tipo: "casa" | "departamento" | "terreno" | "local"
   ========================================================= */
const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

const PROPERTIES = [
  {
    id: "P-001",
    titulo: "Casa con jardín y terraza",
    operacion: "venta",
    tipo: "casa",
    precio: 4850000,
    ubicacion: "Colonia de ejemplo, Ciudad",
    recamaras: 3, banos: 2.5, estacionamientos: 2, m2: 220, terreno: 260,
    descripcion: "Casa de dos niveles con sala-comedor de doble altura, cocina integral, jardín privado y terraza en planta alta. Texto de ejemplo: reemplázalo con la descripción real.",
    caracteristicas: ["Jardín privado", "Terraza", "Cocina integral", "Cuarto de servicio", "Bodega", "Calentador solar"],
    fotos: [IMG("photo-1564013799919-ab600027ffc6"), IMG("photo-1600585154340-be6161a56a0c"), IMG("photo-1600607687939-ce8a6c25118c")],
  },
  {
    id: "P-002",
    titulo: "Departamento luminoso con balcón",
    operacion: "renta",
    tipo: "departamento",
    precio: 18500,
    ubicacion: "Zona centro, Ciudad",
    recamaras: 2, banos: 2, estacionamientos: 1, m2: 95,
    descripcion: "Departamento en piso alto con balcón, grandes ventanales y amenidades en el edificio. Texto de ejemplo.",
    caracteristicas: ["Balcón", "Elevador", "Gimnasio", "Seguridad 24 h", "Admite mascotas"],
    fotos: [IMG("photo-1502672260266-1c1ef2d93688"), IMG("photo-1522708323590-d24dbb6b0267"), IMG("photo-1493809842364-78817add7ffb")],
  },
  {
    id: "P-003",
    titulo: "Residencia contemporánea con alberca",
    operacion: "venta",
    tipo: "casa",
    precio: 12900000,
    ubicacion: "Fraccionamiento de ejemplo, Ciudad",
    recamaras: 4, banos: 4.5, estacionamientos: 3, m2: 480, terreno: 600,
    descripcion: "Residencia de diseño contemporáneo con alberca, estudio, family room y amplias áreas sociales. Texto de ejemplo.",
    caracteristicas: ["Alberca", "Estudio", "Family room", "Vestidor", "Cuarto de lavado", "Paneles solares"],
    fotos: [IMG("photo-1580587771525-78b9dba3b914"), IMG("photo-1600596542815-ffad4c1539a9"), IMG("photo-1600607687939-ce8a6c25118c")],
  },
  {
    id: "P-004",
    titulo: "Casa familiar en privada",
    operacion: "venta",
    tipo: "casa",
    precio: 3250000,
    ubicacion: "Privada de ejemplo, Ciudad",
    recamaras: 3, banos: 2, estacionamientos: 2, m2: 160, terreno: 140,
    descripcion: "Casa en privada con acceso controlado, cerca de escuelas y comercios. Texto de ejemplo.",
    caracteristicas: ["Acceso controlado", "Áreas verdes", "Patio de servicio", "Cocina equipada"],
    fotos: [IMG("photo-1568605114967-8130f3a36994"), IMG("photo-1600585154340-be6161a56a0c")],
  },
  {
    id: "P-005",
    titulo: "Departamento amueblado",
    operacion: "renta",
    tipo: "departamento",
    precio: 24000,
    ubicacion: "Zona norte, Ciudad",
    recamaras: 1, banos: 1, estacionamientos: 1, m2: 68,
    descripcion: "Departamento completamente amueblado, listo para habitar. Ideal para profesionistas. Texto de ejemplo.",
    caracteristicas: ["Amueblado", "Roof garden", "Coworking", "Seguridad 24 h"],
    fotos: [IMG("photo-1522708323590-d24dbb6b0267"), IMG("photo-1493809842364-78817add7ffb")],
  },
  {
    id: "P-006",
    titulo: "Casa moderna con estudio",
    operacion: "renta",
    tipo: "casa",
    precio: 35000,
    ubicacion: "Colonia de ejemplo, Ciudad",
    recamaras: 3, banos: 3, estacionamientos: 2, m2: 250, terreno: 230,
    descripcion: "Casa moderna con estudio, jardín y cocina abierta hacia el comedor. Texto de ejemplo.",
    caracteristicas: ["Estudio", "Jardín", "Cocina abierta", "Bodega"],
    fotos: [IMG("photo-1512917774080-9991f1c4c750"), IMG("photo-1600607687939-ce8a6c25118c")],
  },
];

/* =========================================================
   UTILIDADES
   ========================================================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const money = new Intl.NumberFormat(CONFIG.locale, { style: "currency", currency: CONFIG.currency, maximumFractionDigits: 0 });
const formatPrice = (p) => `${money.format(p.precio)}${p.operacion === "renta" ? " <small>/ mes</small>" : ""}`;

const TIPOS = { casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local comercial" };

const ICONS = {
  bed: '<svg viewBox="0 0 24 24"><path d="M3 7h2v6h6V9h8a3 3 0 0 1 3 3v7h-2v-2H5v2H3zm5 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>',
  bath: '<svg viewBox="0 0 24 24"><path d="M7 5a2 2 0 0 1 4 0h-2v6H3v2a6 6 0 0 0 4 5.7V21h2v-2h6v2h2v-2.3A6 6 0 0 0 21 13v-2H11V5a4 4 0 0 0-8 0h2a2 2 0 0 1 2 0z"/></svg>',
  car: '<svg viewBox="0 0 24 24"><path d="M5 11 6.5 6.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11a2 2 0 0 1 2 2v5h-2v2h-2v-2H7v2H5v-2H3v-5a2 2 0 0 1 2-2zm2.1 0h9.8l-1-3H8.1zM6.5 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>',
  area: '<svg viewBox="0 0 24 24"><path d="M3 3h7v2H6.4l4.3 4.3-1.4 1.4L5 6.4V10H3zm11 0h7v7h-2V6.4l-4.3 4.3-1.4-1.4L17.6 5H14zM3 14h2v3.6l4.3-4.3 1.4 1.4L6.4 19H10v2H3zm15.6 5-4.3-4.3 1.4-1.4 4.3 4.3V14h2v7h-7v-2z"/></svg>',
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* =========================================================
   CONFIGURACIÓN EN LA PÁGINA
   ========================================================= */
function applyConfig() {
  $$('[data-config="brandName"]').forEach((el) => (el.textContent = CONFIG.brandName));
  $$('[data-config="address"]').forEach((el) => (el.textContent = CONFIG.address));
  $$('[data-config="hours"]').forEach((el) => (el.textContent = CONFIG.hours));
  $$('[data-config="phone"]').forEach((el) => {
    if (CONFIG.phone) { el.textContent = CONFIG.phone; el.href = `tel:${CONFIG.phone.replace(/\s/g, "")}`; }
  });
  $$('[data-config="email"]').forEach((el) => {
    if (CONFIG.email) { el.textContent = CONFIG.email; el.href = `mailto:${CONFIG.email}`; }
  });
  const wa = $("#whatsappBtn");
  if (CONFIG.whatsapp) wa.href = `https://wa.me/${CONFIG.whatsapp}`;
  else wa.hidden = true;
  $("#year").textContent = new Date().getFullYear();
}

/* =========================================================
   CATÁLOGO Y FILTROS
   ========================================================= */
const state = { operacion: "", tipo: "", q: "", recamaras: 0, precioMax: "", orden: "recientes" };

function filtered() {
  const list = PROPERTIES.filter((p) =>
    (!state.operacion || p.operacion === state.operacion) &&
    (!state.tipo || p.tipo === state.tipo) &&
    (!state.q || norm(`${p.titulo} ${p.ubicacion}`).includes(norm(state.q))) &&
    (p.recamaras || 0) >= state.recamaras &&
    (!state.precioMax || p.precio <= Number(state.precioMax))
  );
  const sorters = {
    "precio-asc": (a, b) => a.precio - b.precio,
    "precio-desc": (a, b) => b.precio - a.precio,
    "m2-desc": (a, b) => b.m2 - a.m2,
  };
  return sorters[state.orden] ? list.sort(sorters[state.orden]) : list;
}

function cardHtml(p) {
  const specs = [
    p.recamaras ? `<li>${ICONS.bed}${p.recamaras} rec.</li>` : "",
    p.banos ? `<li>${ICONS.bath}${p.banos} baños</li>` : "",
    p.estacionamientos ? `<li>${ICONS.car}${p.estacionamientos}</li>` : "",
    p.m2 ? `<li>${ICONS.area}${p.m2} m²</li>` : "",
  ].join("");
  return `
    <button class="card reveal" data-id="${escapeHtml(p.id)}" aria-label="Ver detalles: ${escapeHtml(p.titulo)}">
      <div class="card__media">
        <img src="${escapeHtml(p.fotos[0])}" alt="" loading="lazy" onerror="this.remove()">
        <span class="badge ${p.operacion === "renta" ? "badge--renta" : ""}">${p.operacion === "renta" ? "En renta" : "En venta"}</span>
      </div>
      <div class="card__body">
        <span class="card__price">${formatPrice(p)}</span>
        <h3 class="card__title">${escapeHtml(p.titulo)}</h3>
        <p class="card__loc">${escapeHtml(TIPOS[p.tipo] || p.tipo)} · ${escapeHtml(p.ubicacion)}</p>
        <ul class="specs">${specs}</ul>
      </div>
    </button>`;
}

function render() {
  buildPriceOptions();
  const list = filtered();
  $("#propertyGrid").innerHTML = list.map(cardHtml).join("");
  $("#emptyState").hidden = list.length > 0;
  $("#resultsCount").textContent = `${list.length} ${list.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}`;
  $$(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.filterOp === state.operacion));
  observeReveal();
}

const PRICE_STEPS = {
  venta: [2000000, 3500000, 5000000, 8000000, 12000000],
  renta: [10000, 15000, 20000, 30000, 50000],
};

function buildPriceOptions() {
  const sel = $("#filterPrecio");
  const steps = PRICE_STEPS[state.operacion];
  const key = state.operacion || "none";
  if (sel.dataset.key === key) return;
  sel.dataset.key = key;
  sel.innerHTML = '<option value="">Sin límite</option>' +
    (steps || []).map((v) => `<option value="${v}">${money.format(v)}</option>`).join("");
  sel.disabled = !steps;
  sel.title = steps ? "" : "Elige venta o renta para filtrar por precio";
  state.precioMax = "";
}

function initFilters() {
  $$(".chip").forEach((chip) => chip.addEventListener("click", () => { state.operacion = chip.dataset.filterOp; render(); }));
  $("#filterPrecio").addEventListener("change", (e) => { state.precioMax = e.target.value; render(); });
  $("#filterOrden").addEventListener("change", (e) => { state.orden = e.target.value; render(); });
  $("#clearFilters").addEventListener("click", () => {
    Object.assign(state, { operacion: "", tipo: "", q: "", recamaras: 0, precioMax: "" });
    $("#heroSearch").reset();
    render();
  });

  // Buscador del hero
  let heroOp = "venta";
  $$(".search__tab").forEach((tab) => tab.addEventListener("click", () => {
    heroOp = tab.dataset.op;
    $$(".search__tab").forEach((t) => { t.classList.toggle("is-active", t === tab); t.setAttribute("aria-selected", t === tab); });
  }));
  $("#heroSearch").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    Object.assign(state, { operacion: heroOp, tipo: f.get("tipo"), q: f.get("q").trim(), recamaras: Number(f.get("recamaras")) });
    render();
    $("#propiedades").scrollIntoView();
  });
}

/* =========================================================
   MODAL DE DETALLE
   ========================================================= */
let lastFocus = null;

function openProperty(id) {
  const p = PROPERTIES.find((x) => x.id === id);
  if (!p) return;
  let idx = 0;
  const rows = [
    ["Operación", p.operacion === "renta" ? "Renta" : "Venta"],
    ["Tipo", TIPOS[p.tipo] || p.tipo],
    p.recamaras && ["Recámaras", p.recamaras],
    p.banos && ["Baños", p.banos],
    p.estacionamientos && ["Estacionamientos", p.estacionamientos],
    p.m2 && ["Construcción", `${p.m2} m²`],
    p.terreno && ["Terreno", `${p.terreno} m²`],
    ["Clave", p.id],
  ].filter(Boolean);

  $("#modalBody").innerHTML = `
    <div class="gallery">
      <img id="galleryImg" src="${escapeHtml(p.fotos[0])}" alt="${escapeHtml(p.titulo)}" onerror="this.style.visibility='hidden'">
      ${p.fotos.length > 1 ? `
        <button class="gallery__nav gallery__nav--prev" data-step="-1" aria-label="Foto anterior">‹</button>
        <button class="gallery__nav gallery__nav--next" data-step="1" aria-label="Foto siguiente">›</button>
        <span class="gallery__count" id="galleryCount">1 / ${p.fotos.length}</span>` : ""}
    </div>
    <div class="detail">
      <div>
        <p class="eyebrow">${p.operacion === "renta" ? "En renta" : "En venta"}</p>
        <h2 id="modalTitle">${escapeHtml(p.titulo)}</h2>
        <p class="card__loc">${escapeHtml(p.ubicacion)}</p>
        <p class="card__price" style="margin:1rem 0">${formatPrice(p)}</p>
        <p class="detail__desc">${escapeHtml(p.descripcion)}</p>
        ${p.caracteristicas?.length ? `<h3>Características</h3><ul class="detail__features">${p.caracteristicas.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>` : ""}
      </div>
      <aside class="detail__aside">
        <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>
        <a href="#contacto" class="btn btn--block" data-interest="Me interesa la propiedad ${escapeHtml(p.id)} — ${escapeHtml(p.titulo)}">Solicitar información</a>
      </aside>
    </div>`;

  $$(".gallery__nav", $("#modalBody")).forEach((btn) => btn.addEventListener("click", () => {
    idx = (idx + Number(btn.dataset.step) + p.fotos.length) % p.fotos.length;
    const img = $("#galleryImg");
    img.style.visibility = "";
    img.src = p.fotos[idx];
    $("#galleryCount").textContent = `${idx + 1} / ${p.fotos.length}`;
  }));

  lastFocus = document.activeElement;
  $("#propertyModal").hidden = false;
  document.body.style.overflow = "hidden";
  $(".modal__close").focus();
}

function closeModal() {
  $("#propertyModal").hidden = true;
  document.body.style.overflow = "";
  lastFocus?.focus();
}

function initModal() {
  $("#propertyGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) openProperty(card.dataset.id);
  });
  $("#propertyModal").addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
    if (e.target.closest("[data-interest]")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#propertyModal").hidden) closeModal();
  });
}

/* =========================================================
   CONTACTO
   ========================================================= */
function initContact() {
  // Los botones con data-interest precargan el mensaje del formulario
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-interest]");
    if (!el) return;
    const text = el.dataset.interest;
    $("#contactMessage").value = text;
    const sel = $('#contactForm select[name="interes"]');
    if (/vender o rentar mi/i.test(text)) sel.value = "Vender o rentar mi propiedad";
    else if (/renta/i.test(text)) sel.value = "Rentar una propiedad";
    else sel.value = "Comprar una propiedad";
  });

  // Enlaces legales: reemplaza con tus páginas reales
  $$("[data-legal]").forEach((a) => a.addEventListener("click", (e) => {
    if (a.getAttribute("href") === "#") { e.preventDefault(); alert("Agrega aquí el enlace a tu documento legal."); }
  }));

  const form = $("#contactForm");
  const status = $("#formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    $$(".field", form).forEach((f) => f.classList.remove("has-error"));
    const missing = $$("[required]", form).filter((i) => (i.type === "checkbox" ? !i.checked : !i.value.trim()));
    if (missing.length) {
      missing.forEach((i) => i.closest(".field")?.classList.add("has-error"));
      status.className = "form__status is-error";
      status.textContent = "Completa los campos obligatorios y acepta el aviso de privacidad.";
      missing[0].focus();
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    const text = `Hola, soy ${d.nombre}.\nInterés: ${d.interes}\nTeléfono: ${d.telefono}${d.email ? `\nCorreo: ${d.email}` : ""}${d.mensaje ? `\n\n${d.mensaje}` : ""}`;

    // Sin servidor: envía por WhatsApp o correo según lo configurado.
    if (CONFIG.whatsapp) {
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    } else if (CONFIG.email) {
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Contacto desde el sitio web")}&body=${encodeURIComponent(text)}`;
    } else {
      status.className = "form__status is-error";
      status.textContent = "Configura un WhatsApp o correo en app.js para recibir mensajes.";
      return;
    }
    status.className = "form__status is-ok";
    status.textContent = "¡Gracias! Te contactaremos pronto.";
    form.reset();
  });
}

/* =========================================================
   MENÚ MÓVIL Y ANIMACIONES
   ========================================================= */
function initMenu() {
  const toggle = $("#menuToggle");
  const nav = $("#nav");
  const set = (open) => { nav.classList.toggle("is-open", open); toggle.setAttribute("aria-expanded", open); };
  toggle.addEventListener("click", () => set(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => set(false)));
}

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObserver.unobserve(en.target); }
    }), { threshold: 0.12 })
  : null;

function observeReveal() {
  $$(".reveal:not(.is-visible)").forEach((el) => (revealObserver ? revealObserver.observe(el) : el.classList.add("is-visible")));
}

/* ========================================================= */
applyConfig();
initMenu();
initFilters();
initModal();
initContact();
render();
