import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles.css";
import { families } from "./data/families.js";

const app = document.querySelector("#app");
const navItems = [
  { href: "/search", label: "Familien finden" },
  { href: "/login", label: "Anmelden" }
];

const icon = (name) => `<i class="bi bi-${name}" aria-hidden="true"></i>`;

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
            <div class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              ${links}
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
            <span class="eyebrow"><span class="eyebrow-dot"></span> Urlaub ist schöner zusammen</span>
            <h1>Neue Orte.<br>Neue Freunde.<br><span>Unvergessliche Ferien.</span></h1>
            <p class="hero-description">Finde Familien, die zur gleichen Zeit am gleichen Ort sind – und schenke deinen Kindern Urlaubsmomente, die verbinden.</p>
            <div class="hero-trust">
              <div class="avatar-stack" aria-hidden="true">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80" alt="">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" alt="">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="">
              </div>
              <span>Gemeinsam unterwegs –<br><strong>Familien wie deine</strong></span>
            </div>
          </div>
          <div class="hero-visual" role="img" aria-label="Familie genießt gemeinsam einen sonnigen Tag am Meer">
            <div class="hero-photo"></div>
            <div class="floating-note">
              <span class="note-icon">${icon("heart-fill")}</span>
              <span><strong>Urlaubsfreunde?</strong><small>Nur ein Match entfernt</small></span>
            </div>
            <span class="sun-doodle" aria-hidden="true">✳</span>
          </div>
          <div class="search-panel">
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
      <section class="how-section">
        <div class="container">
          <div class="section-heading text-center">
            <span class="eyebrow">Ganz einfach zusammenfinden</span>
            <h2>Ein Urlaub, viele neue <span>Lieblingsmenschen</span></h2>
            <p>In drei kleinen Schritten zu großen gemeinsamen Erinnerungen.</p>
          </div>
          <div class="row g-4 how-steps">
            <div class="col-md-4">
              <article class="step-card">
                <div class="step-icon step-teal">${icon("search-heart")}</div>
                <span class="step-number">01</span>
                <h3>Urlaub eintragen</h3>
                <p>Verrate uns, wann und wo ihr unterwegs seid – und was deine Kinder gern sprechen.</p>
              </article>
            </div>
            <div class="col-md-4">
              <article class="step-card">
                <div class="step-icon step-peach">${icon("people")}</div>
                <span class="step-number">02</span>
                <h3>Familien entdecken</h3>
                <p>Finde passende Familien mit Kindern in ähnlichem Alter und einer gemeinsamen Sprache.</p>
              </article>
            </div>
            <div class="col-md-4">
              <article class="step-card">
                <div class="step-icon step-yellow">${icon("sun")}</div>
                <span class="step-number">03</span>
                <h3>Zusammen losziehen</h3>
                <p>Knüpft ganz entspannt Kontakt und macht euren Urlaub gemeinsam noch bunter.</p>
              </article>
            </div>
          </div>
          <div class="bottom-cta">
            <div>
              <span class="eyebrow">Euer nächstes Abenteuer wartet</span>
              <h2>Gemeinsam unterwegs?</h2>
              <p>Erstelle jetzt kostenlos dein Familienprofil.</p>
            </div>
            <a class="btn btn-primary btn-lg" href="/register">Jetzt kostenlos starten ${icon("arrow-right")}</a>
          </div>
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
