/* ==========================================================================
   SITE CONFIG — edit these values once and they update every page.
   Everything in [BRACKETS] is a placeholder the agency must replace.
   ========================================================================== */
const SITE = {
  name: "[Agency Name]",
  logoText: "LOGO",            // shown inside the round logo if no image is set
  logoImage: "",               // e.g. "assets/img/logo.png"
  tagline: "Study, Work & Live in Australia",
  // Link for every "Get Started" / "Book Strategy Session" button (form, Calendly, WhatsApp…)
  bookingUrl: "index.html#contact",
  whatsapp: "",                // e.g. "61400000000" — leave empty to hide the floating button
  // YouTube video ID for the intro video (the part after "v=" in the link). Empty = placeholder.
  youtubeId: "",
  offices: [
    { city: "[City] Office", address: "[Street address, suburb, postcode]", phones: ["+61 4XX XXX XXX"], email: "[info@youragency.com]" },
    { city: "[City] Office", address: "[Street address, suburb, postcode]", phones: ["+61 4XX XXX XXX"], email: "[info@youragency.com]" },
  ],
  social: { instagram: "", facebook: "", tiktok: "", youtube: "", linkedin: "" },
  // Paste your Google Reviews widget embed code here (HTML string) or leave empty to show placeholders.
  reviewsEmbed: "",
  googleRating: { score: "5.0", count: "[#]", url: "#" },
};

/* PHOTO LIBRARY — every photo on the site comes from here.
   Values are Unsplash photo IDs (free to use) or your own file paths, e.g. "assets/img/team.jpg". */
const PHOTOS = {
  sydney:      "1506973035872-a4ec16b8e8d9",
  opera:       "1523482580672-f109ba8cb9be",
  melbourne:   "1545044846-351ba102b6d5",
  coast:       "1529108190281-9a4f620bc2d8",
  beach:       "1507525428034-b723cf961d3e",
  graduation:  "1523050854058-8df90110c9f1",
  campus:      "1541339907198-e08756dedf3f",
  students:    "1522202176988-66273c2fd55f",
  friends:     "1529156069898-49953e39b3ac",
  studying:    "1434030216411-0b793f4b4173",
  team:        "1521737604893-d14cc237f11d",
  meeting:     "1556761175-b413da4baf72",
  trades:      "1504307651254-35680f356dfd",
  engineer:    "1581091226825-a6a2a5aee158",
  nurse:       "1576091160399-112ba8d25d1d",
  chef:        "1556910103-1c02745aae4d",
  family:      "1511895426328-dc8714191300",
  couple:      "1516589178581-6cd7833ae3b2",
  law:         "1589829545856-d10d557cf95f",
  signing:     "1450101499163-c8848c66ca85",
  passport:    "1488646953014-85cb44e25828",
  plane:       "1436491865332-7a61a109cc05",
};

const NAV = [
  { href: "student-visa.html", label: "Student Visa" },
  { href: "jobs.html", label: "Jobs" },
  { href: "sponsor.html", label: "Sponsor Guide" },
  { href: "family.html", label: "Family Link" },
  { href: "skilled.html", label: "Skilled Pathway" },
  { href: "appeals.html", label: "Visa Appeals" },
  { href: "about.html", label: "About Us" },
  { href: "faq.html", label: "FAQs" },
];

const QUICK_LINKS = [
  { href: "student-visa.html", label: "Student visa" },
  { href: "family.html", label: "Family link" },
  { href: "sponsor.html", label: "Sponsor guide" },
  { href: "skilled.html", label: "Skilled pathway" },
  { href: "jobs.html", label: "Jobs in Australia" },
];

const MARQUEE = [
  ["sydney", "Sydney"], ["melbourne", "Melbourne"], ["beach", "Queensland"], ["campus", "World-class universities"],
  ["coast", "Great Ocean Road"], ["friends", "Student life"], ["opera", "Sydney Opera House"], ["graduation", "Graduation day"],
];

/* ========================================================================== */

(function () {
  const here = location.pathname.split("/").pop() || "index.html";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const photo = (key, w = 1600) => {
    const v = PHOTOS[key] || key;
    return /[/.]/.test(v) ? v : `https://images.unsplash.com/photo-${v}?auto=format&fit=crop&w=${w}&q=80`;
  };
  const logo = () => `<span class="logo">${SITE.logoImage ? `<img src="${esc(SITE.logoImage)}" alt="">` : esc(SITE.logoText)}</span>`;

  // Header
  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <div class="container nav-bar">
        <a class="brand" href="index.html" aria-label="${esc(SITE.name)} home">${logo()}</a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <nav id="site-nav" class="site-nav">
          ${NAV.map((n) => `<a href="${n.href}"${n.href === here ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
          <a class="btn btn-red btn-sm" data-booking href="#">Get Started</a>
        </nav>
      </div>`;
    const toggle = header.querySelector(".nav-toggle");
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open);
    });
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Hero backgrounds + photos
  document.querySelectorAll("[data-hero]").forEach((el) => el.style.setProperty("--hero-img", `url("${photo(el.dataset.hero, 2200)}")`));
  document.querySelectorAll("[data-band]").forEach((el) => el.style.setProperty("--band-img", `url("${photo(el.dataset.band, 2200)}")`));
  document.querySelectorAll("img[data-photo]").forEach((img) => {
    img.loading = "lazy";
    img.decoding = "async";
    img.src = photo(img.dataset.photo, Number(img.dataset.w) || 1200);
  });

  // Hero quick links
  document.querySelectorAll("[data-quicklinks]").forEach((ul) => {
    ul.innerHTML = QUICK_LINKS.filter((q) => q.href !== here).map((q) => `<li><a href="${q.href}">${q.label}</a></li>`).join("");
  });

  // Video
  document.querySelectorAll("[data-video]").forEach((el) => {
    el.innerHTML = SITE.youtubeId
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(SITE.youtubeId)}" title="Video" loading="lazy"
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : `<div class="video-placeholder" style="--poster:url('${photo(el.dataset.video || "students", 1200)}')"><div><div class="play"></div>Your YouTube video goes here<br><small>(set <code>youtubeId</code> in assets/site.js)</small></div></div>`;
  });

  // Photo marquee
  document.querySelectorAll("[data-marquee]").forEach((el) => {
    const items = MARQUEE.map(([k, c]) => `<figure><img src="${photo(k, 700)}" alt="${esc(c)}" loading="lazy"><figcaption>${esc(c)}</figcaption></figure>`).join("");
    el.innerHTML = `<div class="marquee-track">${items}${items.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"')}</div>`;
  });

  // Hide any photo that fails to load instead of showing a broken icon
  document.querySelectorAll("main img").forEach((img) => img.addEventListener("error", () => { img.style.visibility = "hidden"; }, { once: true }));

  // Reviews block
  const reviews = document.getElementById("reviews");
  if (reviews) {
    const body = SITE.reviewsEmbed
      ? SITE.reviewsEmbed
      : `<div class="review-grid">${[1, 2, 3].map(() => `
          <figure class="review-card">
            <div class="stars" aria-label="5 stars">★★★★★</div>
            <blockquote>[Paste a real client review from your Google Business profile here.]</blockquote>
            <figcaption>[Client name] · <span class="muted">[date]</span></figcaption>
          </figure>`).join("")}
        </div>`;
    reviews.innerHTML = `
      <div class="container">
        <div class="section-head center">
          <p class="eyebrow">Reviews</p>
          <h2>What our clients say</h2>
          <p class="rating"><strong>${esc(SITE.googleRating.score)}</strong> <span class="stars">★★★★★</span>
            <span class="muted">(${esc(SITE.googleRating.count)} Google reviews)</span>
            · <a href="${esc(SITE.googleRating.url)}">Review us on Google</a></p>
        </div>
        ${body}
      </div>`;
  }

  // CTA band
  document.querySelectorAll("[data-cta]").forEach((el) => {
    el.innerHTML = `
      <div class="container cta-inner">
        <div>
          <h2>${esc(el.dataset.cta || "Talk to one of our consultants")}</h2>
          <p>Book a strategy session and get a clear, honest roadmap for your situation.</p>
        </div>
        <a class="btn btn-light" data-booking href="#">Book Strategy Session</a>
      </div>`;
  });

  // Footer
  const footer = document.getElementById("site-footer");
  if (footer) {
    const socials = Object.entries(SITE.social).filter(([, v]) => v);
    footer.innerHTML = `
      <div class="container footer-grid">
        <div>
          <a class="brand" href="index.html">${logo()}</a>
          <p style="margin-top:14px"><strong style="color:#fff">${esc(SITE.name)}</strong><br><span class="muted-light">${esc(SITE.tagline)}</span></p>
          ${socials.length ? `<p class="socials">${socials.map(([k, v]) => `<a href="${esc(v)}">${k}</a>`).join(" · ")}</p>` : ""}
        </div>
        <div>
          <h4>Useful links</h4>
          <ul>${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
        </div>
        ${SITE.offices.map((o) => `
          <div>
            <h4>${esc(o.city)}</h4>
            <p>${esc(o.address)}</p>
            <p>${o.phones.map((p) => `<a href="tel:${esc(p.replace(/\s/g, ""))}">${esc(p)}</a>`).join("<br>")}</p>
            <p><a href="mailto:${esc(o.email)}">${esc(o.email)}</a></p>
          </div>`).join("")}
      </div>
      <div class="container disclaimer">
        <p><strong>Disclaimer:</strong> ${esc(SITE.name)} is a consultancy that provides marketing and administrative support for immigration services.
        All immigration advice and legal services are delivered exclusively by affiliated, independently contracted Australian lawyers and registered migration agents.
        We do not provide immigration advice ourselves. The final decision on all visa and migration applications is made solely by the Department of Home Affairs,
        and no specific outcome can be guaranteed.</p>
        <p class="muted-light">© ${new Date().getFullYear()} ${esc(SITE.name)}. All rights reserved.</p>
      </div>`;
  }

  // Brand name + booking links
  document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = SITE.name));
  document.querySelectorAll("[data-booking]").forEach((el) => el.setAttribute("href", SITE.bookingUrl));

  // Reveal on scroll
  const revealables = document.querySelectorAll("main section:not(.hero) .section-head, .card, .step, .photo-card, .img-stack, .facts, .timeline li, .stat, .intro > *, details");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealables.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 4) * 80}ms`;
      io.observe(el);
    });
  }

  // Floating WhatsApp
  if (SITE.whatsapp) {
    const a = document.createElement("a");
    a.className = "wa-float";
    a.href = `https://wa.me/${SITE.whatsapp}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Chat on WhatsApp");
    a.textContent = "WhatsApp";
    document.body.appendChild(a);
  }
})();
