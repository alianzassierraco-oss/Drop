/* ==========================================================================
   SITE CONFIG — edit these values once and they update every page.
   Everything in [BRACKETS] is a placeholder the agency must replace.
   ========================================================================== */
const SITE = {
  name: "[Agency Name]",
  shortName: "[AGENCY]",
  tagline: "Study, Work & Live in Australia",
  // Link for "Get Started" / "Book Strategy Session" buttons (form, Calendly, WhatsApp, etc.)
  bookingUrl: "#contact",
  whatsapp: "", // e.g. "61400000000" — leave empty to hide the floating button
  offices: [
    { city: "[City] Office", address: "[Street address, suburb, postcode]", phones: ["+61 4XX XXX XXX"], email: "[info@youragency.com]" },
    { city: "[City] Office", address: "[Street address, suburb, postcode]", phones: ["+61 4XX XXX XXX"], email: "[info@youragency.com]" },
  ],
  social: { instagram: "", facebook: "", tiktok: "", linkedin: "" },
  // Paste your Google Reviews widget embed code here (string of HTML) or leave empty to show placeholders.
  reviewsEmbed: "",
  googleRating: { score: "5.0", count: "[#]", url: "#" },
};

const NAV = [
  { href: "student-visa.html", label: "Student Visa" },
  { href: "skilled.html", label: "Skilled Pathway" },
  { href: "sponsor.html", label: "Sponsor Guide" },
  { href: "family.html", label: "Family Link" },
  { href: "jobs.html", label: "Jobs" },
  { href: "appeals.html", label: "Visa Appeals" },
  { href: "about.html", label: "About Us" },
  { href: "faq.html", label: "FAQs" },
];

/* ========================================================================== */

(function () {
  const here = location.pathname.split("/").pop() || "index.html";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Header
  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <div class="container nav-bar">
        <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">✦</span>${esc(SITE.name)}</a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <nav id="site-nav" class="site-nav">
          ${NAV.map((n) => `<a href="${n.href}"${n.href === here ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
          <a class="btn btn-sm" href="${esc(SITE.bookingUrl)}">Get Started</a>
        </nav>
      </div>`;
    const toggle = header.querySelector(".nav-toggle");
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open);
    });
  }

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
        <div class="section-head">
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
        <a class="btn btn-light" href="${esc(SITE.bookingUrl)}">Book Strategy Session</a>
      </div>`;
  });

  // Footer
  const footer = document.getElementById("site-footer");
  if (footer) {
    const socials = Object.entries(SITE.social).filter(([, v]) => v);
    footer.innerHTML = `
      <div class="container footer-grid">
        <div>
          <a class="brand brand-light" href="index.html"><span class="brand-mark" aria-hidden="true">✦</span>${esc(SITE.name)}</a>
          <p class="muted-light">${esc(SITE.tagline)}</p>
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

  // Brand name placeholders inside page content
  document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = SITE.name));
  document.querySelectorAll("[data-booking]").forEach((el) => el.setAttribute("href", SITE.bookingUrl));

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
