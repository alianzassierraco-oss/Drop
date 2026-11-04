/* =========================================================
   CONFIGURACIÓN DE LA TIENDA GLEAMXI
   Edita SOLO este archivo para cambiar número de WhatsApp,
   precios y fecha de fin de la promoción.
   ========================================================= */
window.GLEAMXI_CONFIG = {
  // Número de WhatsApp con código de país, solo dígitos (sin +, espacios ni guiones).
  // Ejemplo Colombia: "573001234567" · México: "5215512345678"
  whatsapp: "573000000000",

  // Fecha y hora en que TERMINA la promoción 2x1.
  // Formato: "AAAA-MM-DDTHH:MM:SS" + zona horaria (-05:00 = Colombia/Perú/Ecuador).
  // Es una fecha fija: el contador NO se reinicia al recargar la página.
  finPromocion: "2026-11-30T23:59:59-05:00",

  // Precios (opcional). Déjalos en null para no mostrar cifras en la página.
  // precioPromo = lo que paga el cliente por las 2 unidades.
  // precioNormal = lo que costarían 2 unidades sin promoción (aparece tachado).
  precioPromo: null,   // ej: 89900
  precioNormal: null,  // ej: 179800
  moneda: "COP",       // código ISO de moneda: COP, MXN, USD, PEN, CLP...
  idioma: "es-CO",     // formato de números: es-CO, es-MX, es-PE, es-CL...

  // Texto que se muestra cuando el contador llega a cero.
  textoPromoFinalizada: "La promoción terminó. Escríbenos para conocer las ofertas vigentes."
};
