import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles.css";
import heroImage from "./assets/holiday-buddies-hero.png";
import { families } from "./data/families.js";

const app = document.querySelector("#app");
const navItems = [
  { href: "/", label: "Startseite" },
  { href: "/search", label: "Familien finden" },
];

const icon = (name) => `<i class="bi bi-${name}" aria-hidden="true"></i>`;
const exampleTrips = [
  {
    destination: "Mallorca",
    dates: "12.–22. Juli 2027",
    image: "https://images.unsplash.com/photo-1672264430465-781cd9154896?auto=format&fit=crop&w=800&q=82",
    imageAlt: "Türkisblaue Bucht an Mallorcas Küste",
    children: [{ age: 5, gender: "Mädchen" }, { age: 7, gender: "Junge" }],
  },
  {
    destination: "Kreta",
    dates: "4.–14. August 2027",
    image: "https://images.unsplash.com/photo-1725918568208-7d43d00bf916?auto=format&fit=crop&w=800&q=82",
    imageAlt: "Strand und Berge an Kretas Küste",
    children: [{ age: 4, gender: "Mädchen" }, { age: 8, gender: "Mädchen" }],
  },
  {
    destination: "Gardasee",
    dates: "10.–20. Juli 2027",
    image: "https://images.unsplash.com/photo-1659971810646-09efbdb6c7d4?auto=format&fit=crop&w=800&q=82",
    imageAlt: "Blick auf einen See und die umliegenden Berge",
    children: [{ age: 6, gender: "Junge" }, { age: 9, gender: "Junge" }],
  },
  {
    destination: "Sardinien",
    dates: "2.–12. August 2027",
    image: "https://images.unsplash.com/photo-1770412404097-170f88af6386?auto=format&fit=crop&w=800&q=82",
    imageAlt: "Sardiniens felsige Küste mit klarem türkisfarbenem Wasser",
    children: [{ age: 6, gender: "Mädchen" }, { age: 8, gender: "Junge" }],
  },
];

function header() {
  const links = navItems.map(({ href, label }) =>
    `<a class="nav-link${location.pathname === href ? " active" : ""}" href="${href}">${label}</a>`
  ).join("");

  return `
    <a class="skip-link" href="#main-content">Zum Inhalt springen</a>
    <header class="site-header">
      <nav class="navbar navbar-expand-lg" aria-label="Hauptnavigation">
        <div class="container">
          <a class="navbar-brand brand-mark" href="/" aria-label="Holiday Buddies Startseite">
            <span class="brand-icon">${icon("sun-fill")}</span>
            <span>holiday<span class="brand-light">buddies</span></span>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-navigation" aria-controls="main-navigation" aria-expanded="false" aria-label="Menü öffnen">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="main-navigation">
            <div class="navbar-nav main-nav mx-lg-auto align-items-lg-center gap-lg-2">
              ${links}
            </div>
            <div class="navbar-nav auth-nav align-items-lg-center gap-lg-2">
              <a class="nav-link" href="/login">Anmelden</a>
              <a class="btn btn-primary nav-cta" href="/register">Kostenlos starten</a>
            </div>
          </div>
        </div>
      </nav>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="container footer-inner">
        <a class="brand-mark footer-brand" href="/">
          <span class="brand-icon">${icon("sun-fill")}</span>
          <span>holiday<span class="brand-light">buddies</span></span>
        </a>
        <p>Gemeinsam wird Urlaub noch schöner. <span aria-hidden="true">☀️</span></p>
        <span class="footer-note">Ein erster Prototyp für Familien</span>
      </div>
    </footer>`;
}

function searchForm({ compact = false } = {}) {
  return `
    <form class="trip-search${compact ? " trip-search-compact" : ""}" id="trip-search-form">
      <div class="search-field destination-field">
        <label for="destination">${icon("geo-alt")} Reiseziel</label>
        <input id="destination" name="destination" type="search" placeholder="Wohin soll’s gehen?" autocomplete="off">
      </div>
      <div class="search-field date-field">
        <label for="start-date">${icon("calendar3")} Reisezeitraum</label>
        <div class="date-inputs">
          <input id="start-date" name="start" type="date" aria-label="Anreise">
          <span aria-hidden="true">–</span>
          <input id="end-date" name="end" type="date" aria-label="Abreise">
        </div>
      </div>
      <div class="search-field">
        <label for="age">${icon("emoji-smile")} Alter der Kinder</label>
        <select id="age" name="age">
          <option value="">Alle Altersgruppen</option>
          <option value="3-5">3–5 Jahre</option>
          <option value="6-8">6–8 Jahre</option>
          <option value="9-12">9–12 Jahre</option>
        </select>
      </div>
      <div class="search-field">
        <label for="language">${icon("chat-dots")} Sprache</label>
        <select id="language" name="language">
          <option value="">Alle Sprachen</option>
          <option>Deutsch</option>
          <option>Englisch</option>
          <option>Spanisch</option>
          <option>Französisch</option>
          <option>Türkisch</option>
        </select>
      </div>
      <button class="btn btn-primary search-submit" type="submit" aria-label="Familien suchen">
        ${icon("search")}<span class="search-button-label">Suchen</span>
      </button>
    </form>`;
}

function landingPage() {
  return `
    <main id="main-content">
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-copy">
            <span class="eyebrow"><span class="eyebrow-dot"></span> Familien. Urlaub. Gemeinsam.</span>
            <h1>Spielkameraden<br><span>im Urlaub</span> finden.</h1>
            <p class="hero-description">Verbinde dich mit Familien, die zur gleichen Zeit am gleichen Urlaubsort sind – für gemeinsame Erlebnisse, neue Freundschaften und unvergessliche Ferien.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#familien-suche">Familien entdecken ${icon("arrow-right")}</a>
              <a class="btn btn-outline-primary hero-secondary" href="#wie-es-funktioniert">So funktioniert&apos;s</a>
            </div>
          </div>
          <div class="hero-visual">
            <img class="hero-photo" src="${heroImage}" alt="Vier fröhliche Kinder spielen gemeinsam in den Wellen am Strand" fetchpriority="high">
          </div>
          <div class="search-panel" id="familien-suche">
            <div class="search-heading">
              <div>
                <span class="search-kicker">Dein nächstes Abenteuer</span>
                <h2>Wer ist zur gleichen Zeit dort?</h2>
              </div>
              <span class="search-heading-icon">${icon("compass")}</span>
            </div>
            ${searchForm()}
            <p class="search-footnote">${icon("sparkles")} Unverbindlich suchen – ganz ohne Konto.</p>
          </div>
        </div>
      </section>
      <section class="planned-trips-section" aria-labelledby="planned-trips-title">
        <div class="container">
          <div class="planned-trips-heading">
            <h2 id="planned-trips-title">Schon geplante Reisen – sei dabei!</h2>
            <span class="planned-trips-example-label">${icon("stars")} Fiktive Beispielreisen</span>
          </div>
          <div class="planned-trips-grid">
            ${exampleTrips.map((trip) => `
              <article class="planned-trip-card">
                <img class="planned-trip-image" src="${trip.image}" alt="${trip.imageAlt}" loading="lazy" decoding="async">
                <div class="planned-trip-content">
                  <h3>${trip.destination}</h3>
                  <p class="planned-trip-date">${icon("calendar3")}<span>${trip.dates}</span></p>
                  <div class="planned-trip-children">
                    ${trip.children.map((child) => `
                      <span class="planned-trip-child">
                        ${icon(child.gender === "Mädchen" ? "gender-female" : "gender-male")}
                        <span>${child.gender} · ${child.age} J.</span>
                      </span>
                    `).join("")}
                  </div>
                </div>
              </article>
            `).join("")}
            <aside class="planned-trips-cta">
              <span class="planned-trips-cta-icon">${icon("compass")}</span>
              <h3>Weitere Reisen entdecken</h3>
              <p>Finde Familien, die zur gleichen Zeit unterwegs sind.</p>
              <a class="planned-trips-cta-button" href="/search" aria-label="Familien suchen">${icon("arrow-right")}</a>
            </aside>
          </div>
        </div>
      </section>
      <section class="how-section" id="wie-es-funktioniert" aria-labelledby="how-title">
        <div class="container">
          <div class="section-heading text-center">
            <span class="eyebrow">Gemeinsam planen</span>
            <h2 id="how-title">So funktioniert <span>HolidayBuddies</span></h2>
            <p>In vier einfachen Schritten zu gemeinsamen Urlaubsmomenten.</p>
          </div>
          <div class="how-steps">
            <svg class="how-step-arrows" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M205 56 C248 16 350 16 395 50" />
              <path class="how-step-arrowhead" d="m383 44 12 6-12 5" />
              <path d="M505 56 C548 16 650 16 695 50" />
              <path class="how-step-arrowhead" d="m683 44 12 6-12 5" />
              <path d="M805 56 C848 16 950 16 995 50" />
              <path class="how-step-arrowhead" d="m983 44 12 6-12 5" />
            </svg>
            <article class="how-step">
              <div class="how-step-visual">
                <span class="how-step-number" aria-hidden="true">1</span>
                <div class="how-step-icon-circle">
                  ${icon("laptop")}
                  <span class="how-step-icon-accent">${icon("person-plus-fill")}</span>
                </div>
              </div>
              <h3>Kostenlos registrieren</h3>
              <p>Erstelle in wenigen Sekunden dein Familienkonto.</p>
            </article>
            <article class="how-step">
              <div class="how-step-visual">
                <span class="how-step-number" aria-hidden="true">2</span>
                <div class="how-step-icon-circle">
                  ${icon("calendar-event")}
                  <span class="how-step-icon-accent">${icon("airplane-fill")}</span>
                </div>
              </div>
              <h3>Deine Reise eintragen</h3>
              <p>Gib Reiseziel, Reisezeitraum und das Alter deiner Kinder an.</p>
            </article>
            <article class="how-step">
              <div class="how-step-visual">
                <span class="how-step-number" aria-hidden="true">3</span>
                <div class="how-step-icon-circle">
                  ${icon("people-fill")}
                  <span class="how-step-icon-accent">${icon("search")}</span>
                </div>
              </div>
              <h3>Passende Familien finden</h3>
              <p>Entdecke Familien, die zur gleichen Zeit am gleichen Ort sind.</p>
            </article>
            <article class="how-step">
              <div class="how-step-visual">
                <span class="how-step-number" aria-hidden="true">4</span>
                <div class="how-step-icon-circle">
                  ${icon("chat-heart")}
                  <span class="how-step-icon-accent">${icon("heart-fill")}</span>
                </div>
              </div>
              <h3>In Kontakt kommen</h3>
              <p>Tauscht euch aus, plant gemeinsame Aktivitäten und freut euch auf einen noch schöneren Urlaub!</p>
            </article>
          </div>
          <div class="benefits-bar" aria-label="Vorteile von HolidayBuddies">
            <div class="benefit-item">
              <span class="benefit-icon">${icon("people")}</span>
              <div>
                <h3>Gleichgesinnte Familien</h3>
                <p>Familien mit Kindern in ähnlichem Alter</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">${icon("calendar-event")}</span>
              <div>
                <h3>Gleiche Reisezeit &amp; Ort</h3>
                <p>Gemeinsame Urlaubsmomente</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">${icon("shield-check")}</span>
              <div>
                <h3>Sicher &amp; vertrauensvoll</h3>
                <p>Eltern entscheiden selbst, mit wem sie Kontakt aufnehmen</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">${icon("heart")}</span>
              <div>
                <h3>Mehr als nur Urlaub</h3>
                <p>Neue Freundschaften – oft über die Reise hinaus</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="family-trip-cta-section" aria-labelledby="family-trip-cta-title">
        <div class="container family-trip-cta-container">
          <div class="family-trip-cta-blob">
            <div class="family-trip-cta-flight" aria-hidden="true">
              <svg viewBox="0 0 150 90" preserveAspectRatio="none">
                <path d="M9 71 C39 86 48 20 82 43 S119 60 132 23" />
              </svg>
              ${icon("airplane-fill")}
            </div>
            <h2 id="family-trip-cta-title">Bereit für deinen nächsten Familienurlaub?</h2>
            <a class="btn btn-light family-trip-cta-button" href="/register">Jetzt kostenlos starten ${icon("arrow-right")}</a>
          </div>
          <svg class="family-trip-sandcastle" viewBox="0 0 190 150" aria-hidden="true">
            <path d="M14 139V84h22V56h29v28h16V39h40v45h16V56h29v28h23v55H14Z" fill="#efd5a2" />
            <path d="M42 56v-9h8v9m12 0v-9h8v9m26-17V28h10v11m14 0V28h10v11m23 17v-9h8v9m12 0v-9h8v9" fill="#efd5a2" stroke="#d3ae79" stroke-width="2" />
            <path d="M78 139v-27a18 18 0 0 1 36 0v27" fill="#b99463" />
            <path d="M44 101h12v11H44zm95 0h12v11h-12z" fill="#c6a171" />
            <path d="M99 28V8" stroke="#9c7d52" stroke-width="3" />
            <path d="M101 9h30l-13 9 13 8h-30z" fill="#ef8750" />
            <path d="M3 139c24-11 34-7 54 0 26-10 42-7 62 0 21-9 43-9 68 0v11H3z" fill="#f5e2c1" />
          </svg>
        </div>
      </section>
    </main>`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" })
    .format(new Date(`${date}T12:00:00`));
}

function familyCard(family, index) {
  const children = family.children.map((age) => `${age} Jahre`).join(" & ");
  return `
    <article class="family-card">
      <div class="family-card-top">
        <div class="family-avatar ${family.color}">
          <img src="${family.avatar}" alt="" loading="lazy">
        </div>
        <div class="family-identity">
          <h3>${family.name}</h3>
          <span>${icon("geo-alt")} ${family.region}</span>
        </div>
        <span class="match-badge">${icon("stars")} Gute Verbindung</span>
      </div>
      <p class="family-note">„${family.note}“</p>
      <div class="family-details">
        <div class="detail-item">
          <span class="detail-icon">${icon("geo-alt")}</span>
          <span><small>Reiseziel</small><strong>${family.destination}</strong></span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">${icon("calendar3")}</span>
          <span><small>Reisezeitraum</small><strong>${formatDate(family.start)} – ${formatDate(family.end)}</strong></span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">${icon("emoji-smile")}</span>
          <span><small>Kinder</small><strong>${children}</strong></span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">${icon("chat-dots")}</span>
          <span><small>Sprachen</small><strong>${family.languages.join(", ")}</strong></span>
        </div>
      </div>
      <button class="btn btn-outline-primary contact-button" type="button" data-family="${index}">
        ${icon("send")} Kontakt anfragen
      </button>
    </article>`;
}

function searchPage() {
  return `
    <main id="main-content" class="results-page">
      <section class="results-intro">
        <div class="container">
          <span class="eyebrow">Gemeinsam macht’s mehr Spaß</span>
          <h1>Familien <span>finden</span></h1>
          <p>Entdecke Familien, deren Urlaubspläne zu euren passen.</p>
          <div class="results-search-panel">${searchForm({ compact: true })}</div>
        </div>
      </section>
      <section class="container results-content" aria-labelledby="results-title">
        <div class="results-heading">
          <div>
            <h2 id="results-title">Familien für euer Abenteuer</h2>
            <p id="results-count" aria-live="polite"></p>
          </div>
          <label class="sort-control" for="sort-results">Sortieren nach
            <select id="sort-results" aria-label="Suchergebnisse sortieren">
              <option value="relevance">Beste Verbindung</option>
              <option value="soonest">Reisebeginn</option>
            </select>
          </label>
        </div>
        <div class="row g-4" id="family-results"></div>
        <div class="empty-state d-none" id="empty-results">
          <span>${icon("search")}</span>
          <h3>Keine Familien gefunden</h3>
          <p>Versuche, deine Suche anzupassen – vielleicht wartet eure Urlaubscrew nur ein paar Filter weiter.</p>
        </div>
      </section>
    </main>`;
}

function authPage(mode) {
  const registering = mode === "register";
  return `
    <main id="main-content" class="auth-page">
      <section class="auth-card">
        <div class="auth-illustration">
          <span class="auth-sun" aria-hidden="true">✳</span>
          <span class="auth-illustration-tag">${icon("heart-fill")} Urlaubsmomente teilen</span>
          <div class="auth-illustration-copy">
            <span>Gemeinsam ist’s schöner</span>
            <p>Die schönste Urlaubserinnerung? Die neuen Freunde, die man unterwegs findet.</p>
          </div>
        </div>
        <div class="auth-form-side">
          <a class="auth-back" href="/">${icon("arrow-left")} Zurück zur Startseite</a>
          <div class="auth-form-content">
            <span class="eyebrow">${registering ? "Schön, dass du da bist" : "Willkommen zurück"}</span>
            <h1>${registering ? "Finde eure Urlaubscrew." : "Schön, dich zu sehen."}</h1>
            <p class="auth-subtitle">${registering ? "Erstelle dein Profil und entdeckt gemeinsam mehr." : "Melde dich an und finde Familien für euer nächstes Abenteuer."}</p>
            <form id="auth-form">
              ${registering ? `
                <div class="mb-3">
                  <label class="form-label" for="name">Dein Name</label>
                  <input class="form-control" id="name" name="name" type="text" autocomplete="name" placeholder="z. B. Alex Muster" required>
                </div>` : ""}
              <div class="mb-3">
                <label class="form-label" for="email">E-Mail-Adresse</label>
                <input class="form-control" id="email" name="email" type="email" autocomplete="email" placeholder="du@beispiel.de" required>
              </div>
              <div class="mb-3">
                <label class="form-label" for="password">Passwort</label>
                <input class="form-control" id="password" name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" placeholder="Mindestens 8 Zeichen" minlength="8" required>
              </div>
              ${registering ? `
                <div class="form-check auth-check">
                  <input class="form-check-input" id="privacy" type="checkbox" required>
                  <label class="form-check-label" for="privacy">Ich stimme den <a href="#auth-demo-note">Datenschutzhinweisen</a> zu.</label>
                </div>` : `
                <div class="auth-options">
                  <label class="form-check">
                    <input class="form-check-input" type="checkbox" id="remember">
                    <span class="form-check-label">Angemeldet bleiben</span>
                  </label>
                  <a href="#auth-notice" data-action="reset-password">Passwort vergessen?</a>
                </div>`}
              <button class="btn btn-primary auth-submit" type="submit">${registering ? "Kostenloses Konto erstellen" : "Anmelden"} ${icon("arrow-right")}</button>
              <p class="prototype-message" id="auth-notice" role="status" hidden></p>
            </form>
            <p class="auth-switch">${registering ? "Schon ein Konto?" : "Noch kein Konto?"} <a href="${registering ? "/login" : "/register"}">${registering ? "Jetzt anmelden" : "Kostenlos registrieren"}</a></p>
            <p class="auth-demo-note" id="auth-demo-note">${icon("info-circle")} Demo-Prototyp: Es werden keine Konten erstellt oder Daten gespeichert.</p>
          </div>
        </div>
      </section>
    </main>`;
}

function navigate(url) {
  history.pushState({}, "", url);
  mountPage();
  window.scrollTo(0, 0);
}

function filteredFamilies() {
  const params = new URLSearchParams(location.search);
  const destination = params.get("destination")?.toLocaleLowerCase("de") ?? "";
  const language = params.get("language") ?? "";
  const ageRange = params.get("age") ?? "";
  const start = params.get("start");
  const end = params.get("end");
  const [minAge, maxAge] = ageRange ? ageRange.split("-").map(Number) : [0, Infinity];

  return families.filter((family) => {
    const hasDestination = `${family.destination} ${family.region}`.toLocaleLowerCase("de").includes(destination);
    const hasLanguage = !language || family.languages.includes(language);
    const hasAge = family.children.some((age) => age >= minAge && age <= maxAge);
    const datesOverlap = (!start || family.end >= start) && (!end || family.start <= end);
    return hasDestination && hasLanguage && hasAge && datesOverlap;
  });
}

function renderFamilies() {
  const results = document.querySelector("#family-results");
  if (!results) return;
  const matches = filteredFamilies();
  if (document.querySelector("#sort-results")?.value === "soonest") {
    matches.sort((first, second) => first.start.localeCompare(second.start));
  }
  results.innerHTML = matches.map((family) =>
    `<div class="col-lg-6">${familyCard(family, families.indexOf(family))}</div>`
  ).join("");
  document.querySelector("#results-count").textContent =
    `${matches.length} ${matches.length === 1 ? "Familie" : "Familien"} passend zu eurer Suche`;
  document.querySelector("#empty-results").classList.toggle("d-none", matches.length > 0);
}

function mountPage() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const page = path === "/search"
    ? searchPage()
    : path === "/login"
      ? authPage("login")
      : path === "/register"
        ? authPage("register")
        : landingPage();
  app.innerHTML = `${header()}${page}${footer()}`;

  if (path === "/") {
    document.querySelector(".hero-actions")?.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      history.pushState({}, "", link.hash);
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY });
      root.style.scrollBehavior = previousScrollBehavior;
    });
  }

  if (path === "/search") {
    const form = document.querySelector("#trip-search-form");
    for (const [key, value] of new URLSearchParams(location.search)) {
      const field = form.elements.namedItem(key);
      if (field) field.value = value;
    }
    renderFamilies();
  }

  document.querySelector("#trip-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData) {
      if (value) params.set(key, value.toString());
    }
    navigate(`/search${params.size ? `?${params}` : ""}`);
  });

  document.querySelector("#auth-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const notice = document.querySelector("#auth-notice");
    notice.textContent = "Das Formular ist im Prototyp noch nicht mit einem Konto verbunden.";
    notice.hidden = false;
  });

  document.querySelector('[data-action="reset-password"]')?.addEventListener("click", (event) => {
    event.preventDefault();
    const notice = document.querySelector("#auth-notice");
    notice.textContent = "Das Zurücksetzen des Passworts ist im Prototyp noch nicht verfügbar.";
    notice.hidden = false;
  });

  document.querySelector("#family-results")?.addEventListener("click", (event) => {
    const button = event.target.closest(".contact-button");
    if (!button) return;
    button.innerHTML = `${icon("check2")} Anfrage vorgemerkt`;
    button.disabled = true;
    button.setAttribute("aria-label", `Kontaktanfrage für ${families[Number(button.dataset.family)].name} vorgemerkt. Demo ohne Backend.`);
  });
  document.querySelector("#sort-results")?.addEventListener("change", renderFamilies);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="/"]');
  if (!link || link.target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});

window.addEventListener("popstate", mountPage);
mountPage();
