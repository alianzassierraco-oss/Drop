/* GleamXi · lógica de la landing (temporizador, WhatsApp, animaciones) */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var C = window.GLEAMXI_CONFIG || {};
  var WA = String(C.whatsapp || "").replace(/\D/g, "");

  /* ---------- WhatsApp ---------- */
  function waLink(msg) {
    return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
  }
  document.querySelectorAll("[data-whatsapp]").forEach(function (el) {
    el.href = waLink(el.getAttribute("data-whatsapp"));
    el.target = "_blank";
    el.rel = "noopener";
  });

  /* ---------- Precios (opcionales) ---------- */
  function money(v) {
    try {
      return new Intl.NumberFormat(C.idioma || "es-CO", {
        style: "currency", currency: C.moneda || "COP", maximumFractionDigits: 0
      }).format(v);
    } catch (e) { return "$" + v; }
  }
  if (typeof C.precioPromo === "number") {
    var box = document.querySelector("[data-price]");
    box.hidden = false;
    box.querySelector("[data-price-new]").textContent = money(C.precioPromo) + " x 2";
    if (typeof C.precioNormal === "number" && C.precioNormal > C.precioPromo) {
      box.querySelector("[data-price-old]").textContent = money(C.precioNormal);
      box.querySelector("[data-price-save]").textContent =
        "Ahorras " + money(C.precioNormal - C.precioPromo);
    }
    var mini = document.querySelector("[data-mini-price]");
    if (mini) mini.textContent = money(C.precioPromo);
  }

  /* ---------- Temporizador (fecha fija, no se reinicia) ---------- */
  var end = new Date(C.finPromocion).getTime();
  var boxes = document.querySelectorAll("[data-countdown]");
  var inlines = document.querySelectorAll("[data-countdown-inline]");
  var last = {};
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function render() {
    var diff = isNaN(end) ? 0 : Math.max(0, end - Date.now());
    var s = Math.floor(diff / 1000);
    var t = {
      d: Math.floor(s / 86400),
      h: Math.floor((s % 86400) / 3600),
      m: Math.floor((s % 3600) / 60),
      s: s % 60
    };
    boxes.forEach(function (b, i) {
      ["d", "h", "m", "s"].forEach(function (k) {
        var el = b.querySelector('[data-cd="' + k + '"]');
        var v = pad(t[k]);
        if (el && el.textContent !== v) {
          el.textContent = v;
          if (last[i + k] !== undefined) {
            el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
          }
          last[i + k] = v;
        }
      });
    });
    var inline = (t.d > 0 ? t.d + "d " : "") + pad(t.h) + ":" + pad(t.m) + ":" + pad(t.s);
    inlines.forEach(function (el) { el.textContent = diff > 0 ? inline : "Finalizada"; });

    if (diff <= 0) {
      boxes.forEach(function (b) {
        var msg = b.querySelector("[data-cd-ended]");
        if (msg) { msg.hidden = false; msg.textContent = C.textoPromoFinalizada || "La promoción ha finalizado."; }
      });
      return false;
    }
    return true;
  }
  if (render()) {
    var timer = setInterval(function () { if (!render()) clearInterval(timer); }, 1000);
  }

  /* ---------- Formulario de pedido → WhatsApp ---------- */
  var form = document.getElementById("orderForm");
  var err = document.getElementById("formError");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var bad = !f.value.trim() || (f.name === "telefono" && f.value.replace(/\D/g, "").length < 7);
        f.classList.toggle("invalid", bad);
        if (bad && ok) { f.focus(); ok = false; }
      });
      err.hidden = ok;
      if (!ok) return;

      var d = new FormData(form);
      var qty = parseInt(d.get("cantidad"), 10) || 1;
      var lines = [
        "¡Hola! Quiero hacer un pedido de *GleamXi Rosemary Keratin Hair Oil* 🌿",
        "",
        "🎁 *Promoción 2x1:* " + qty + (qty > 1 ? " promociones" : " promoción") + " (" + qty * 2 + " unidades)",
        "",
        "👤 Nombre: " + d.get("nombre").trim(),
        "📱 Celular: " + d.get("telefono").trim(),
        "🏙️ Ciudad: " + d.get("ciudad").trim() + (d.get("region").trim() ? ", " + d.get("region").trim() : ""),
        "📍 Dirección: " + d.get("direccion").trim()
      ];
      if (typeof C.precioPromo === "number") lines.push("💰 Total: " + money(C.precioPromo * qty));
      if (d.get("notas").trim()) lines.push("📝 Notas: " + d.get("notas").trim());
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
    });
    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("invalid") && e.target.value.trim()) e.target.classList.remove("invalid");
    });
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Barra de compra móvil ---------- */
  var bar = document.getElementById("buybar");
  var hero = document.querySelector(".hero");
  var order = document.getElementById("pedido");
  if (bar && "IntersectionObserver" in window) {
    var heroOut = false, orderIn = false;
    var upd = function () { bar.classList.toggle("is-visible", heroOut && !orderIn); };
    new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (e) { orderIn = e[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(order);
  }

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
