/* GleamXi · landing Shopify (temporizador, compra directa, animaciones) */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var C = window.GLEAMXI_CONFIG || {};

  /* ---------- Formato de dinero de la tienda ---------- */
  function money(cents) {
    var fmt = C.moneyFormat || "${{amount_no_decimals}}";
    var v = (cents / 100);
    function grp(n, d, t, s) {
      var p = n.toFixed(d).split(".");
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, t);
      return p[0] + (p[1] ? s + p[1] : "");
    }
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, k) {
      switch (k) {
        case "amount": return grp(v, 2, ",", ".");
        case "amount_no_decimals": return grp(v, 0, ",", ".");
        case "amount_with_comma_separator": return grp(v, 2, ".", ",");
        case "amount_no_decimals_with_comma_separator": return grp(v, 0, ".", ",");
        case "amount_with_apostrophe_separator": return grp(v, 2, "'", ".");
        default: return grp(v, 0, ".", ",");
      }
    });
  }

  /* ---------- Temporizador (fecha fija) ---------- */
  var end = new Date(C.finPromocion).getTime();
  var boxes = document.querySelectorAll("[data-countdown]");
  var inlines = document.querySelectorAll("[data-countdown-inline]");
  var last = {};
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function render() {
    var diff = isNaN(end) ? 0 : Math.max(0, end - Date.now());
    var s = Math.floor(diff / 1000);
    var t = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
    boxes.forEach(function (b, i) {
      ["d", "h", "m", "s"].forEach(function (k) {
        var el = b.querySelector('[data-cd="' + k + '"]');
        var v = pad(t[k]);
        if (el && el.textContent !== v) {
          el.textContent = v;
          if (last[i + k] !== undefined) { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
          last[i + k] = v;
        }
      });
    });
    var txt = (t.d > 0 ? t.d + "d " : "") + pad(t.h) + ":" + pad(t.m) + ":" + pad(t.s);
    inlines.forEach(function (el) { el.textContent = diff > 0 ? txt : "Finalizada"; });
    if (diff <= 0) {
      boxes.forEach(function (b) {
        var msg = b.querySelector("[data-cd-ended]");
        if (msg) { msg.hidden = false; msg.textContent = C.textoPromoFinalizada || "La promoción ha finalizado."; }
      });
      return false;
    }
    return true;
  }
  if (render()) { var timer = setInterval(function () { if (!render()) clearInterval(timer); }, 1000); }

  /* ---------- Selector de paquete + compra directa ---------- */
  var box = document.getElementById("buyBox");
  if (box) {
    var radios = box.querySelectorAll('input[name="pack"]');
    var qtyOut = document.getElementById("qtyOut");
    var totalOut = document.getElementById("totalOut");
    var buy = document.getElementById("buyNow");
    var qty = 1;
    function current() { return box.querySelector('input[name="pack"]:checked') || radios[0]; }
    function update() {
      var r = current();
      radios.forEach(function (x) { x.closest(".pack").classList.toggle("is-on", x === r); });
      qtyOut.textContent = qty;
      totalOut.textContent = money(parseInt(r.getAttribute("data-price"), 10) * qty);
      buy.href = "/cart/" + r.value + ":" + qty;
    }
    radios.forEach(function (r) { r.addEventListener("change", update); });
    box.querySelectorAll("[data-qty]").forEach(function (b) {
      b.addEventListener("click", function () {
        qty = Math.min(10, Math.max(1, qty + parseInt(b.getAttribute("data-qty"), 10)));
        update();
      });
    });
    buy.addEventListener("click", function () { buy.setAttribute("aria-busy", "true"); setTimeout(function () { buy.removeAttribute("aria-busy"); }, 4000); });
    update();
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("is-in"); }); }

  /* ---------- Barra de compra móvil ---------- */
  var bar = document.getElementById("buybar"), hero = document.querySelector(".hero"), order = document.getElementById("pedido");
  if (bar && hero && order && "IntersectionObserver" in window) {
    var heroOut = false, orderIn = false;
    var upd = function () { bar.classList.toggle("is-visible", heroOut && !orderIn); };
    new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (e) { orderIn = e[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(order);
  }
})();
