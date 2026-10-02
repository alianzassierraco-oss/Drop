document.addEventListener("DOMContentLoaded", function () {
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Mobile drawer ---- */
  var burger = document.querySelector(".nav__burger");
  var drawer = document.querySelector(".mobile-drawer");
  var drawerClose = document.querySelector(".mobile-drawer__close");
  function closeDrawer() { drawer.classList.remove("is-open"); }
  if (burger && drawer) {
    burger.addEventListener("click", function () { drawer.classList.add("is-open"); });
    drawerClose.addEventListener("click", closeDrawer);
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeDrawer);
    });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 90 + "ms";
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Quantity selector ---- */
  var qtyInput = document.getElementById("qty-input");
  var qtyMinus = document.getElementById("qty-minus");
  var qtyPlus = document.getElementById("qty-plus");
  var unitPrice = 24.99;
  var totalPriceEl = document.getElementById("offer-total");

  function updateTotal() {
    if (!qtyInput) return;
    var qty = parseInt(qtyInput.value, 10) || 1;
    if (totalPriceEl) {
      totalPriceEl.textContent = "$" + (unitPrice * qty).toFixed(2);
    }
  }
  if (qtyInput) {
    qtyMinus.addEventListener("click", function () {
      var val = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
      qtyInput.value = val;
      updateTotal();
    });
    qtyPlus.addEventListener("click", function () {
      var val = Math.min(10, (parseInt(qtyInput.value, 10) || 1) + 1);
      qtyInput.value = val;
      updateTotal();
    });
    qtyInput.addEventListener("change", function () {
      var val = Math.min(10, Math.max(1, parseInt(qtyInput.value, 10) || 1));
      qtyInput.value = val;
      updateTotal();
    });
    updateTotal();
  }

  /* ---- Sticky mobile buy bar ---- */
  var buybar = document.querySelector(".mobile-buybar");
  var hero = document.querySelector(".hero");
  var offer = document.getElementById("oferta");
  if (buybar && hero) {
    var toggle = function () {
      var heroBottom = hero.getBoundingClientRect().bottom;
      var offerTop = offer ? offer.getBoundingClientRect().top : Infinity;
      var offerBottom = offer ? offer.getBoundingClientRect().bottom : Infinity;
      var pastHero = heroBottom < 0;
      var withinOffer = offerTop < window.innerHeight && offerBottom > 0;
      if (pastHero && !withinOffer) {
        buybar.classList.add("is-visible");
      } else {
        buybar.classList.remove("is-visible");
      }
    };
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
  }

  /* ---- Only one FAQ open at a time ---- */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---- Smooth close of mobile drawer on escape ---- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer) closeDrawer();
  });
});
