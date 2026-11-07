import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles.css";
import familySearchHero from "./assets/familien_suchen.png";
import myTripsHero from "./assets/meiner_eisen.png";
import landingMobileHero from "./assets/holidaybuddies_opener_mb.png";
import { families } from "./data/families.js";

const app = document.querySelector("#app");
const navItems = [
  { href: "/", label: "Startseite" },
  { href: "/search", label: "Familien finden" },
  { href: "/trips", label: "Meine Reisen" },
];

const icon = (name) => `<i class="bi bi-${name}" aria-hidden="true"></i>`;
const favoriteFamilyIds = new Set();
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
let myTrips = [
  {
    id: 1,
    destination: "Mallorca",
    region: "Alcúdia, Mallorca",
    start: "2027-07-12",
    end: "2027-07-22",
    children: [{ age: 5, gender: "" }, { age: 8, gender: "" }],
    languages: ["Deutsch", "Englisch"],
    image: exampleTrips[0].image,
    visible: true,
  },
  {
    id: 2,
    destination: "Kreta",
    region: "Chania, Kreta",
    start: "2026-08-04",
    end: "2026-08-14",
    children: [{ age: 6, gender: "" }],
    languages: ["Deutsch"],
    image: exampleTrips[1].image,
    visible: false,
  },
];
let nextTripId = 3;

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

function childEntry(index) {
  return `<div class="child-age-entry">
    <span class="child-entry-label">Kind ${index}</span>
    <input name="childAge" type="number" min="0" max="18" inputmode="numeric" placeholder="Alter" aria-label="Alter von Kind ${index}">
    <select class="form-select form-select-sm child-gender" name="childGender" aria-label="Geschlecht von Kind ${index} (optional)">
      <option value="">Optional</option>
      <option value="Junge">Junge</option>
      <option value="Mädchen">Mädchen</option>
    </select>
    <button type="button" data-action="remove-child-age" aria-label="Kind ${index} entfernen">${icon("x-lg")}</button>
  </div>`;
}

function searchForm({ reset = false, trip = false } = {}) {
  const legacyAge = trip ? null : new URLSearchParams(location.search).get("age");
  return `
    ${trip ? '<div class="trip-search trip-form-fields">' : '<form class="trip-search" id="trip-search-form">'}
      <div class="search-field destination-field">
        <label for="destination">${icon("geo-alt")} Reiseziel oder Hotel</label>
        <div class="landing-destination-control">
          <input id="destination" name="destination" type="search" placeholder="Ziel oder Hotel eingeben" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="destination-suggestions"${trip ? " required" : ""}>
          <button type="button" class="landing-map-toggle" data-action="map" aria-label="Reiseziele auf einer Karte auswählen" aria-expanded="false" aria-controls="destination-map">${icon("map")}</button>
        </div>
        <div class="landing-suggestions landing-popover" id="destination-suggestions" role="listbox" aria-label="Vorschläge für Reiseziel oder Hotel" hidden></div>
        <div class="landing-map landing-popover" id="destination-map" hidden>
          <strong>Reiseziel auf der Karte wählen</strong>
          <p>Schematische Übersicht der verfügbaren Beispielziele</p>
          <div class="landing-map-graphic" aria-label="Schematische Karte des Mittelmeerraums">
            <svg viewBox="0 0 360 170" preserveAspectRatio="none" aria-hidden="true">
              <rect width="360" height="170" fill="#d9f3f1"/>
              <path d="M0 0h360v52l-40 8-29-8-30 20-31-8-27 21-16-8-12-24-20-10-25 10-22-9-33 10-30-13L0 49zM0 130l48-10 37 10 33-4 38 14 46-5 44 14 43-9 71 8v22H0zM105 99l29-5 10 8-20 8-20-3zM214 111l36-5 9 8-31 6-16-3z" fill="#eaf3e4" stroke="#bfded4" stroke-width="2"/>
            </svg>
            <button type="button" data-map-destination="Mallorca" class="landing-map-pin pin-mallorca">Mallorca</button>
            <button type="button" data-map-destination="Gardasee" class="landing-map-pin pin-garda">Gardasee</button>
            <button type="button" data-map-destination="Kreta" class="landing-map-pin pin-kreta">Kreta</button>
          </div>
          <p>Wähle einen Ort aus, um ihn in die Suche zu übernehmen.</p>
        </div>
      </div>
      ${trip ? `<div class="search-field trip-region-field">
        <label for="trip-region">${icon("geo-alt")} Ort / Region</label>
        <input id="trip-region" name="region" type="text" placeholder="z. B. Alcúdia, Mallorca" required>
      </div>` : ""}
      <div class="search-field date-field">
        <span class="search-field-label" id="landing-date-label">${icon("calendar3")} Reisezeitraum</span>
        <details class="landing-picker date-picker">
          <summary aria-labelledby="landing-date-label landing-date-summary"><span id="landing-date-summary" data-date-summary>Zeitraum auswählen</span>${icon("calendar3")}</summary>
          <div class="landing-popover landing-date-options">
            <p>Wähle Anreise und Abreise im Kalender oder gib sie einzeln ein.</p>
            <div class="landing-calendar">
              <div class="landing-calendar-heading">
                <button type="button" data-calendar-month="-1" aria-label="Vorheriger Monat">${icon("chevron-left")}</button>
                <strong data-calendar-month-label aria-live="polite"></strong>
                <button type="button" data-calendar-month="1" aria-label="Nächster Monat">${icon("chevron-right")}</button>
              </div>
              <div class="landing-calendar-weekdays" aria-hidden="true"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div>
              <div class="landing-calendar-days" aria-label="Kalendertage"></div>
            </div>
            <label for="start-date">Anreise</label>
            <input id="start-date" name="start" type="date"${trip ? " required" : ""}>
            <label for="end-date">Abreise</label>
            <input id="end-date" name="end" type="date"${trip ? " required" : ""}>
            <p class="landing-date-error" id="landing-date-error" role="alert" hidden></p>
            <button type="button" class="landing-picker-done" data-action="close-picker">Übernehmen</button>
          </div>
        </details>
      </div>
      <div class="search-field">
        <span class="search-field-label" id="landing-child-label">${icon("people")} Alter der Kinder</span>
        <details class="landing-picker child-picker">
          <summary aria-labelledby="landing-child-label landing-child-summary"><span id="landing-child-summary" data-child-summary>Alle Altersgruppen</span>${icon("chevron-down")}</summary>
          <div class="landing-popover landing-child-options">
            <p>Gib das Alter deiner Kinder an. Junge oder Mädchen ist optional.</p>
            ${["3-5", "6-8", "9-12"].includes(legacyAge) ? `
              <label for="legacy-age">Bisheriger Altersbereich</label>
              <select id="legacy-age" name="age">
                <option value="">Kein Altersbereich</option>
                <option value="3-5">3–5 Jahre</option>
                <option value="6-8">6–8 Jahre</option>
                <option value="9-12">9–12 Jahre</option>
              </select>
            ` : ""}
            <div class="child-age-list" id="child-age-list">
              ${childEntry(1)}
            </div>
            <button class="add-child-age" type="button" data-action="add-child-age">${icon("plus-circle")} Kind hinzufügen</button>
            <button type="button" class="landing-picker-done" data-action="close-picker">Übernehmen</button>
          </div>
        </details>
      </div>
      <div class="search-field">
        <span class="search-field-label" id="landing-language-label">${icon("globe2")} Sprache</span>
        <details class="landing-picker language-picker">
          <summary aria-labelledby="landing-language-label landing-language-summary"><span id="landing-language-summary" data-language-summary>Alle Sprachen</span>${icon("chevron-down")}</summary>
          <div class="landing-popover language-options">
            <p>Wähle eine oder mehrere Sprachen.</p>
            ${["Deutsch", "Englisch", "Spanisch", "Französisch", "Türkisch"].map((language) => `
              <label><input type="checkbox" name="language" value="${language}"><span>${language}</span></label>
            `).join("")}
            <button type="button" class="landing-picker-done" data-action="close-picker">Übernehmen</button>
          </div>
        </details>
      </div>
      ${trip ? "" : `<button class="btn btn-primary search-submit" type="submit" aria-label="Familien suchen">
        ${icon("search")}<span class="search-button-label">Familien suchen</span>
      </button>`}
      ${reset ? '<button class="family-filter-reset" type="reset">Filter zurücksetzen</button>' : ""}
    ${trip ? "</div>" : "</form>"}`;
}

function landingPage() {
  return `
    <main id="main-content">
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-copy">
            <span class="eyebrow"><span class="eyebrow-dot"></span> FAMILIEN. URLAUB. ENTSPANNT.</span>
            <h1>Spielkameraden<br><span>im Urlaub</span> finden.</h1>
            <p class="hero-description">Damit deine Kinder im Urlaub schnell neue Freunde finden – und du die Zeit endlich auch zum Entspannen genießen kannst.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#familien-suche">Familien entdecken ${icon("arrow-right")}</a>
              <a class="btn btn-outline-primary hero-secondary" href="#wie-es-funktioniert">So funktioniert&apos;s</a>
            </div>
          </div>
          <img class="hero-photo" src="${landingMobileHero}" alt="Vier fröhliche Kinder spielen gemeinsam im Wasser am Strand" fetchpriority="high">
          <div class="hero-benefits" aria-label="Deine Vorteile">
            <div class="hero-benefit">
              <span class="hero-benefit-icon">${icon("people")}</span>
              <span>Spielkameraden<br>für deine Kinder</span>
            </div>
            <div class="hero-benefit">
              <span class="hero-benefit-icon">${icon("check2")}</span>
              <span>Mehr Entspannung<br>für dich</span>
            </div>
            <div class="hero-benefit">
              <span class="hero-benefit-icon">${icon("shield-check")}</span>
              <span>Ein sorgloser<br>Familienurlaub</span>
            </div>
          </div>
        </div>
      </section>
      <section class="hero-search-section shared-search" id="familien-suche">
        <div class="container">
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
          <div class="family-trip-cta-content">
            <span class="family-trip-cta-icon" aria-hidden="true">${icon("sun")}</span>
            <h2 id="family-trip-cta-title">Bereit für deinen nächsten Familienurlaub?</h2>
            <p>Entdecke Familien, die zur gleichen Zeit am gleichen Ort sind.</p>
            <a class="btn btn-primary family-trip-cta-button" href="/register">Jetzt kostenlos starten ${icon("arrow-right")}</a>
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
  const children = family.children.map((child) => `${child.age} Jahre`).join(", ");
  const date = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const startDate = new Date(`${family.start}T12:00:00`);
  const endDate = new Date(`${family.end}T12:00:00`);
  const sameMonth = startDate.getMonth() === endDate.getMonth()
    && startDate.getFullYear() === endDate.getFullYear();
  const dateRange = sameMonth
    ? `${new Intl.DateTimeFormat("de-DE", { day: "numeric" }).format(startDate)}.–${date.format(endDate)}`
    : `${date.format(startDate)} – ${date.format(endDate)}`;
  const isFavorite = favoriteFamilyIds.has(index);
  return `
    <article class="family-result-card${family.matchScore >= 90 ? " is-strong-match" : ""}">
      <img class="family-result-image" src="${family.image}" alt="Landschaft bei ${escapeHTML(family.destination)}" loading="lazy" decoding="async">
      <div class="family-result-content">
        <div class="family-result-heading">
          <div class="family-result-name">${icon("people-fill")}<h3>${escapeHTML(family.name)}</h3></div>
          ${family.matchScore >= 90 ? `<span class="family-result-match">${icon("stars")} Passt zu deiner Reise</span>` : ""}
          <button class="family-favorite${isFavorite ? " is-favorite" : ""}" type="button" data-favorite="${index}" aria-label="${isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}: ${escapeHTML(family.name)}" aria-pressed="${isFavorite}">
            ${icon(isFavorite ? "heart-fill" : "heart")}
          </button>
        </div>
        <div class="family-result-location">${icon("geo-alt-fill")}<span>${escapeHTML(family.region)}, ${escapeHTML(family.destination.split(", ")[0])}</span></div>
        <div class="family-result-facts">
          <span>${icon("calendar3")}<span>${dateRange}</span></span>
          <span>${icon("people-fill")}<span>${family.children.length} ${family.children.length === 1 ? "Kind" : "Kinder"}: ${escapeHTML(children)}</span></span>
          <span>${icon("globe2")}<span>${escapeHTML(family.languages.join(", "))}</span></span>
        </div>
        <p class="family-result-note">${escapeHTML(family.note)}</p>
        <a class="family-contact-button" href="/login" aria-label="Anmelden, um ${escapeHTML(family.name)} zu kontaktieren">
          ${icon("chat-dots")} Kontakt anfragen <span class="family-contact-hint">Anmeldung erforderlich</span>
        </a>
      </div>
    </article>`;
}

function pageHero({ variant, image, alt, eyebrow, heading, highlight, description }) {
  return `
    <section class="page-hero page-hero-${variant}">
      <img class="page-hero-image" src="${image}" alt="${alt}" fetchpriority="high">
      <div class="container page-hero-inner">
        <div class="page-hero-copy">
          <span class="eyebrow"><span class="eyebrow-dot"></span> ${eyebrow}</span>
          <h1>${heading}<br><span>${highlight}</span></h1>
          <p>${description}</p>
        </div>
      </div>
    </section>`;
}

function searchPage() {
  return `
    <main id="main-content" class="results-page">
      ${pageHero({
        variant: "search",
        image: familySearchHero,
        alt: "Vier Kinder bauen gemeinsam eine Sandburg am Strand",
        eyebrow: "Familien finden",
        heading: "Finde Familien,",
        highlight: "die zu euch passen.",
        description: "Entdecke Familien, die zur gleichen Zeit am gleichen Ort sind und lernt euch kennen.",
      })}
      <section class="container family-search-layout" aria-label="Familien suchen und Ergebnisse">
        <aside class="family-filter-card shared-search" aria-labelledby="family-filter-title">
          <h2 id="family-filter-title">${icon("funnel")} Suche anpassen</h2>
          ${searchForm({ reset: true })}
        </aside>
        <div class="family-results-panel">
          <div class="family-results-heading">
            <div>
              <h2 id="results-title">Passende Familien</h2>
              <p id="results-count" aria-live="polite"></p>
            </div>
            <label class="family-sort-control" for="sort-results">Sortieren nach
              <select id="sort-results" aria-label="Suchergebnisse sortieren">
                <option value="relevance">Beste Übereinstimmung</option>
                <option value="soonest">Reisedatum (aufsteigend)</option>
              </select>
            </label>
          </div>
          <div class="family-results-list" id="family-results"></div>
          <div class="empty-state d-none" id="empty-results">
            <span>${icon("search")}</span>
            <h3>Keine Familien gefunden</h3>
            <p>Versuche, deine Suche anzupassen – vielleicht wartet eure Urlaubscrew nur ein paar Filter weiter.</p>
          </div>
        </div>
      </section>
    </main>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function tripDateRange(start, end) {
  const startDay = new Intl.DateTimeFormat("de-DE", { day: "numeric" })
    .format(new Date(`${start}T12:00:00`));
  const formattedEnd = new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${end}T12:00:00`));
  return `${startDay}–${formattedEnd}`;
}

function tripDuration(start, end) {
  const startTime = new Date(`${start}T12:00:00`).getTime();
  const endTime = new Date(`${end}T12:00:00`).getTime();
  return Math.round((endTime - startTime) / 86_400_000);
}

function myTripsPage() {
  return `
    <main id="main-content" class="my-trips-page">
      ${pageHero({
        variant: "trips",
        image: myTripsHero,
        alt: "Eine Familie genießt gemeinsam den Ausblick auf das Meer",
        eyebrow: "Meine Reisen",
        heading: "Deine Reisen.",
        highlight: "Deine Vorfreude.",
        description: "Hier findest du deine geplanten Urlaube. Lege neue Reisen an und entscheide, welche Informationen du teilen möchtest.",
      })}
      <section class="container my-trips-content" aria-label="Deine Reisen">
        <button class="btn btn-primary my-trips-create" type="button" data-trip-action="new">
          ${icon("plus-lg")} Neue Reise hinzufügen
        </button>
        <div id="my-trips-list" class="my-trips-list">
          ${renderMyTrips()}
        </div>
        <button class="my-trips-bottom-cta" type="button" data-trip-action="new">
          <span class="my-trips-bottom-icon">${icon("plus-lg")}</span>
          <span class="my-trips-bottom-copy">
            <strong>Weitere Reise erstellen</strong>
            <span>Plane deinen nächsten Urlaub und finde passende Familien.</span>
          </span>
          <span class="my-trips-flight" aria-hidden="true">
            <svg viewBox="0 0 180 65" preserveAspectRatio="none">
              <path d="M4 51 C36 5 66 64 101 29 S144 47 174 7" />
            </svg>
            ${icon("airplane-fill")}
            <span>${icon("geo-alt-fill")}</span>
          </span>
        </button>
      </section>
      <dialog class="trip-dialog" id="trip-dialog" aria-labelledby="trip-dialog-title">
        <form id="trip-form">
          <div class="trip-dialog-heading">
            <div>
              <span class="eyebrow">Urlaub planen</span>
              <h2 id="trip-dialog-title">Neue Reise erstellen</h2>
            </div>
            <button class="trip-dialog-close" type="button" data-trip-action="close" aria-label="Dialog schließen">${icon("x-lg")}</button>
          </div>
          <input type="hidden" name="id">
          <div class="shared-search">${searchForm({ trip: true })}</div>
          <p class="trip-form-message" id="trip-form-message" role="status" hidden></p>
          <div class="trip-dialog-actions">
            <button class="btn btn-outline-primary" type="button" data-trip-action="close">Abbrechen</button>
            <button class="btn btn-primary" type="submit">Reise speichern</button>
          </div>
        </form>
      </dialog>
    </main>`;
}

function renderMyTrips() {
  if (!myTrips.length) {
    return `<div class="my-trips-empty">
      <span>${icon("airplane")}</span>
      <h2>Deine nächste Reise wartet schon</h2>
      <p>Erstelle eine Reise und entdecke Familien, die zur gleichen Zeit unterwegs sind.</p>
      <button class="btn btn-primary" type="button" data-trip-action="new">${icon("plus-lg")} Reise erstellen</button>
    </div>`;
  }

  const today = new Date().toISOString().slice(0, 10);
  return myTrips.map((trip) => {
    const past = trip.end < today;
    const children = trip.children.map((child) => `${child.age}${child.gender ? ` (${child.gender})` : ""}`).join(" und ");
    const query = new URLSearchParams({
      destination: trip.destination,
      start: trip.start,
      end: trip.end,
    });
    return `
      <article class="my-trip-card">
        <div class="my-trip-photo">
          <img src="${escapeHTML(trip.image)}" alt="${escapeHTML(trip.destination)}" loading="lazy">
          <span class="my-trip-status${past ? " is-past" : ""}">${icon(past ? "calendar-check" : "calendar-event")}${past ? "Vergangen" : "Bevorstehend"}</span>
        </div>
        <div class="my-trip-main">
          <div class="my-trip-title">
            <h2>${escapeHTML(trip.destination)}</h2>
            <p>${icon("geo-alt-fill")} ${escapeHTML(trip.region)}</p>
          </div>
          <div class="my-trip-details">
            <div class="my-trip-detail">
              <span class="my-trip-detail-icon">${icon("calendar3")}</span>
              <span>${escapeHTML(tripDateRange(trip.start, trip.end))}<small>${tripDuration(trip.start, trip.end)} Tage</small></span>
            </div>
            <span class="my-trip-divider" aria-hidden="true"></span>
            <div class="my-trip-detail">
              <span class="my-trip-detail-icon">${icon("people-fill")}</span>
              <span>Kinder: ${escapeHTML(children)} ${trip.children.length === 1 ? "Jahr" : "Jahre"}</span>
            </div>
            <div class="my-trip-detail my-trip-languages">
              <span class="my-trip-detail-icon">${icon("globe2")}</span>
              <span>${escapeHTML(trip.languages.join(", "))}</span>
            </div>
          </div>
        </div>
        <div class="my-trip-controls">
          <label class="my-trip-visibility">
            <span>${icon("eye")} Für andere sichtbar</span>
            <input type="checkbox" data-trip-visibility="${trip.id}" aria-label="${escapeHTML(trip.destination)} für andere Familien sichtbar machen"${trip.visible ? " checked" : ""}>
            <span class="my-trip-switch" aria-hidden="true"></span>
          </label>
          <div class="my-trip-actions">
            <button type="button" data-trip-action="edit" data-trip-id="${trip.id}">${icon("pencil")}<span>Bearbeiten</span></button>
            <a href="/search?${query}" aria-label="Passende Familien für ${escapeHTML(trip.destination)} finden">${icon("people")}<span>Passende Familien</span></a>
            <button type="button" data-trip-action="remove" data-trip-id="${trip.id}">${icon("trash3")}<span>Entfernen</span></button>
          </div>
        </div>
      </article>`;
  }).join("");
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
  const childAges = params.getAll("childAge");
  const childGenders = params.getAll("childGender");
  const requestedChildren = Array.from({ length: Math.max(childAges.length, childGenders.length) }, (_, index) => ({
    age: childAges[index] !== undefined && childAges[index] !== "" ? Number(childAges[index]) : null,
    gender: childGenders[index] || "",
  })).filter((child) => child.age !== null || child.gender);
  const languages = params.getAll("language");
  const start = params.get("start");
  const end = params.get("end");
  const [minAge, maxAge] = ageRange ? ageRange.split("-").map(Number) : [0, Infinity];

  return families.filter((family) => {
    const hasDestination = !destination || `${family.destination} ${family.region} ${family.hotel ?? ""}`
      .toLocaleLowerCase("de").includes(destination);
    const selectedLanguages = languages.length ? languages : language ? [language] : [];
    const hasLanguage = !selectedLanguages.length
      || selectedLanguages.some((selectedLanguage) => family.languages.includes(selectedLanguage));
    const matchesChildren = (index, available) => {
      if (index === requestedChildren.length) return true;
      const requested = requestedChildren[index];
      return available.some((child, childIndex) =>
        (requested.age === null || Math.abs(child.age - requested.age) <= 2)
        && (!requested.gender || child.gender === requested.gender)
        && matchesChildren(index + 1, available.filter((_, i) => i !== childIndex)));
    };
    const hasAge = matchesChildren(0, family.children)
      && family.children.some((child) => child.age >= minAge && child.age <= maxAge);
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
  } else {
    matches.sort((first, second) => second.matchScore - first.matchScore);
  }
  results.innerHTML = matches.map((family) => familyCard(family, families.indexOf(family))).join("");
  document.querySelector("#results-count").textContent =
    `${matches.length} ${matches.length === 1 ? "Familie" : "Familien"} passend zu eurer Suche`;
  document.querySelector("#empty-results").classList.toggle("d-none", matches.length > 0);
}

function closeLandingPopovers(form, except = null) {
  form.querySelectorAll(".landing-picker[open]").forEach((picker) => {
    if (picker !== except) picker.open = false;
  });
  if (except?.id !== "destination-suggestions") {
    form.querySelector("#destination-suggestions").hidden = true;
    form.querySelector("#destination").setAttribute("aria-expanded", "false");
  }
  if (except?.id !== "destination-map") {
    form.querySelector("#destination-map").hidden = true;
    form.querySelector('[data-action="map"]').setAttribute("aria-expanded", "false");
  }
}

function setupLandingSearch(form, { fromQuery = true } = {}) {
  const childAgeList = form.querySelector("#child-age-list");
  const destination = form.querySelector("#destination");
  const suggestions = form.querySelector("#destination-suggestions");
  const map = form.querySelector("#destination-map");
  const start = form.elements.namedItem("start");
  const end = form.elements.namedItem("end");
  const values = [...new Set(families.flatMap((family) => [
    family.destination.split(",")[0], family.region, family.hotel,
  ]).filter(Boolean))];
  const dateFormatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  const dayFormatter = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  let calendarMonth = new Date();
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);

  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    form.querySelector("[data-calendar-month-label]").textContent = monthFormatter.format(calendarMonth);
    const blanks = '<span aria-hidden="true"></span>'.repeat(firstWeekday);
    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
      const selected = value === start.value || value === end.value;
      const inRange = start.value && end.value && value > start.value && value < end.value;
      return `<button type="button" data-calendar-day="${value}" aria-label="${dayFormatter.format(date)}" aria-pressed="${selected}"${inRange ? ' class="in-range"' : ""}>${index + 1}</button>`;
    }).join("");
    form.querySelector(".landing-calendar-days").innerHTML = blanks + days;
  }

  function updateSummary() {
    const children = [...childAgeList.querySelectorAll(".child-age-entry")].map((entry) => ({
      age: entry.querySelector('input[name="childAge"]').value,
      gender: entry.querySelector('select[name="childGender"]').value,
    })).filter((child) => child.age !== "" || child.gender);
    const languages = [...form.querySelectorAll('input[name="language"]:checked')].map((input) => input.value);
    const ageRange = form.querySelector('select[name="age"]')?.value;
    const ageSummary = children.map((child) => [child.age !== "" ? `${child.age} J.` : "", child.gender].filter(Boolean).join(" · ")).join(", ");
    form.querySelector("[data-child-summary]").textContent = [ageSummary, ageRange ? `${ageRange.replace("-", "–")} Jahre` : ""]
      .filter(Boolean).join(" · ") || "Alle Altersgruppen";
    form.querySelector("[data-language-summary]").textContent = languages.length ? languages.join(", ") : "Alle Sprachen";
    const format = (value) => dateFormatter.format(new Date(`${value}T12:00:00`));
    form.querySelector("[data-date-summary]").textContent = start.value && end.value
      ? `${format(start.value)} – ${format(end.value)}`
      : start.value ? `Ab ${format(start.value)}` : end.value ? `Bis ${format(end.value)}` : "Zeitraum auswählen";
  }

  function showSuggestions() {
    const query = destination.value.trim().toLocaleLowerCase("de");
    const matches = values.filter((value) => value.toLocaleLowerCase("de").includes(query));
    suggestions.innerHTML = matches.length
      ? matches.map((value, index) => `<button type="button" role="option" id="destination-option-${index}" data-destination="${escapeHTML(value)}">${icon("geo-alt")} ${escapeHTML(value)}</button>`).join("")
      : '<p>Keine passenden Vorschläge. Du kannst dein Ziel trotzdem eingeben.</p>';
    closeLandingPopovers(form, suggestions);
    suggestions.hidden = false;
    destination.setAttribute("aria-expanded", "true");
  }

  function addChild(focus = true) {
    if (childAgeList.children.length >= 6) return null;
    const index = childAgeList.children.length + 1;
    const entry = document.createElement("div");
    entry.innerHTML = childEntry(index);
    const child = entry.firstElementChild;
    childAgeList.append(child);
    const input = child.querySelector("input");
    if (focus) input.focus();
    form.querySelector('[data-action="add-child-age"]').disabled = childAgeList.children.length >= 6;
    return input;
  }

  form.addEventListener("click", (event) => {
    const pickerSummary = event.target.closest(".landing-picker > summary");
    if (pickerSummary && !pickerSummary.parentElement.open) {
      closeLandingPopovers(form, pickerSummary.parentElement);
      if (pickerSummary.parentElement.classList.contains("date-picker")) renderCalendar();
    }
    const monthButton = event.target.closest("[data-calendar-month]");
    if (monthButton) {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + Number(monthButton.dataset.calendarMonth), 1);
      renderCalendar();
    }
    const dayButton = event.target.closest("[data-calendar-day]");
    if (dayButton) {
      const value = dayButton.dataset.calendarDay;
      if (!start.value || end.value) {
        start.value = value;
        end.value = "";
      } else if (value < start.value) {
        end.value = start.value;
        start.value = value;
      } else {
        end.value = value;
      }
      end.setCustomValidity("");
      form.querySelector("#landing-date-error").hidden = true;
      updateSummary();
      renderCalendar();
      form.querySelector(`[data-calendar-day="${value}"]`).focus();
    }
    const selection = event.target.closest("[data-destination], [data-map-destination]");
    if (selection) {
      destination.value = selection.dataset.destination ?? selection.dataset.mapDestination;
      destination.focus();
      closeLandingPopovers(form);
    }
    if (event.target.closest('[data-action="map"]')) {
      const shouldOpen = map.hidden;
      closeLandingPopovers(form, map);
      map.hidden = !shouldOpen;
      form.querySelector('[data-action="map"]').setAttribute("aria-expanded", String(shouldOpen));
    }
    if (event.target.closest('[data-action="add-child-age"]')) addChild();
    const removeButton = event.target.closest('[data-action="remove-child-age"]');
    if (removeButton) {
      removeButton.closest(".child-age-entry").remove();
      childAgeList.querySelectorAll(".child-age-entry").forEach((entry, index) => {
        entry.querySelector(".child-entry-label").textContent = `Kind ${index + 1}`;
        entry.querySelector("input").setAttribute("aria-label", `Alter von Kind ${index + 1}`);
        entry.querySelector("select").setAttribute("aria-label", `Geschlecht von Kind ${index + 1} (optional)`);
        entry.querySelector("button")?.setAttribute("aria-label", `Kind ${index + 1} entfernen`);
      });
      form.querySelector('[data-action="add-child-age"]').disabled = false;
      form.querySelector('[data-action="add-child-age"]').focus();
      updateSummary();
    }
    const done = event.target.closest('[data-action="close-picker"]');
    if (done) {
      const picker = done.closest("details");
      if (picker.classList.contains("date-picker") && start.value && end.value && end.value < start.value) {
        form.querySelector("#landing-date-error").textContent = "Die Abreise muss nach der Anreise liegen.";
        form.querySelector("#landing-date-error").hidden = false;
        end.focus();
        return;
      }
      picker.open = false;
      picker.querySelector("summary").focus();
    }
  });
  destination.addEventListener("focus", showSuggestions);
  destination.addEventListener("input", showSuggestions);
  destination.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && !suggestions.hidden) {
      event.preventDefault();
      suggestions.querySelector('[role="option"]')?.focus();
    }
  });
  suggestions.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const options = [...suggestions.querySelectorAll('[role="option"]')];
    const index = options.indexOf(document.activeElement);
    options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
  });
  form.querySelector(".landing-calendar-days").addEventListener("keydown", (event) => {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const button = event.target.closest("[data-calendar-day]");
    if (!button || !(event.key in offsets)) return;
    event.preventDefault();
    const [year, month, day] = button.dataset.calendarDay.split("-").map(Number);
    const next = new Date(year, month - 1, day + offsets[event.key]);
    calendarMonth = new Date(next.getFullYear(), next.getMonth(), 1);
    renderCalendar();
    const value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    form.querySelector(`[data-calendar-day="${value}"]`).focus();
  });
  form.addEventListener("input", (event) => {
    if (event.target === start || event.target === end) {
      end.setCustomValidity("");
      form.querySelector("#landing-date-error").hidden = true;
      if (event.target.value) {
        const [year, month] = event.target.value.split("-").map(Number);
        calendarMonth = new Date(year, month - 1, 1);
      }
      renderCalendar();
    }
    updateSummary();
  });
  form.addEventListener("change", updateSummary);
  form.addEventListener("invalid", (event) => {
    const picker = event.target.closest(".landing-picker");
    if (picker) {
      closeLandingPopovers(form, picker);
      picker.open = true;
    }
  }, true);

  const params = new URLSearchParams(fromQuery ? location.search : "");
  const ages = params.getAll("childAge");
  const genders = params.getAll("childGender");
  for (let index = 0; index < Math.max(ages.length, genders.length); index += 1) {
    const input = childAgeList.querySelectorAll('input[name="childAge"]')[index] ?? addChild(false);
    if (input) {
      input.value = ages[index] ?? "";
      input.closest(".child-age-entry").querySelector("select").value = genders[index] ?? "";
    }
  }
  for (const [key, value] of params) {
    if (key === "childAge" || key === "childGender") continue;
    if (key === "language") {
      let input = [...form.querySelectorAll('input[name="language"]')].find((checkbox) => checkbox.value === value);
      if (!input && value) {
        const label = document.createElement("label");
        input = document.createElement("input");
        input.type = "checkbox";
        input.name = "language";
        input.value = value;
        const text = document.createElement("span");
        text.textContent = value;
        label.append(input, text);
        form.querySelector(".language-options").insertBefore(label, form.querySelector(".language-options .landing-picker-done"));
      }
      if (input) input.checked = true;
    } else if (key === "age") {
      const field = form.querySelector('select[name="age"]');
      if (field) field.value = value;
    } else {
      const field = form.elements.namedItem(key);
      if (field) field.value = value;
    }
  }
  if (start.value || end.value) {
    const [year, month] = (start.value || end.value).split("-").map(Number);
    calendarMonth = new Date(year, month - 1, 1);
  }
  renderCalendar();
  updateSummary();
  return {
    setTrip(trip) {
      childAgeList.innerHTML = childEntry(1);
      form.querySelector('[data-action="add-child-age"]').disabled = false;
      (trip?.children ?? []).forEach((child, index) => {
        const input = childAgeList.querySelectorAll('input[name="childAge"]')[index] ?? addChild(false);
        input.value = child.age;
        input.closest(".child-age-entry").querySelector("select").value = child.gender;
      });
      form.querySelectorAll('input[name="language"]').forEach((input) => {
        input.checked = trip?.languages.includes(input.value) ?? false;
      });
      if (start.value || end.value) {
        const [year, month] = (start.value || end.value).split("-").map(Number);
        calendarMonth = new Date(year, month - 1, 1);
      }
      closeLandingPopovers(form);
      renderCalendar();
      updateSummary();
    },
  };
}

function mountPage() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const page = path === "/search"
    ? searchPage()
    : path === "/trips"
      ? myTripsPage()
    : path === "/login"
      ? authPage("login")
      : path === "/register"
        ? authPage("register")
        : landingPage();
  app.innerHTML = `${header()}${page}${footer()}`;

  const searchFormElement = document.querySelector("#trip-search-form");
  if (searchFormElement) setupLandingSearch(searchFormElement);

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
    renderFamilies();
    searchFormElement.addEventListener("reset", (event) => {
      event.preventDefault();
      navigate("/search");
    });
    document.querySelector("#family-results").addEventListener("click", (event) => {
      const button = event.target.closest("[data-favorite]");
      if (!button) return;
      const familyId = Number(button.dataset.favorite);
      if (favoriteFamilyIds.has(familyId)) favoriteFamilyIds.delete(familyId);
      else favoriteFamilyIds.add(familyId);
      renderFamilies();
    });
    document.querySelector("#sort-results").addEventListener("change", renderFamilies);
  }

  if (path === "/trips") {
    const list = document.querySelector("#my-trips-list");
    const dialog = document.querySelector("#trip-dialog");
    const form = document.querySelector("#trip-form");
    const destinationInput = form.elements.namedItem("destination");
    const startInput = form.elements.namedItem("start");
    const endInput = form.elements.namedItem("end");
    const tripSearch = setupLandingSearch(form, { fromQuery: false });

    document.querySelector(".my-trips-page").addEventListener("click", (event) => {
      const button = event.target.closest("[data-trip-action]");
      if (!button) return;
      const action = button.dataset.tripAction;
      if (action === "close") {
        dialog.close();
        return;
      }
      if (action === "new" || action === "edit") {
        const trip = action === "edit"
          ? myTrips.find((item) => item.id === Number(button.dataset.tripId))
          : null;
        form.reset();
        form.elements.namedItem("id").value = trip?.id ?? "";
        form.elements.namedItem("destination").value = trip?.destination ?? "";
        form.elements.namedItem("region").value = trip?.region ?? "";
        form.elements.namedItem("start").value = trip?.start ?? "";
        form.elements.namedItem("end").value = trip?.end ?? "";
        tripSearch.setTrip(trip);
        document.querySelector("#trip-dialog-title").textContent =
          trip ? "Reise bearbeiten" : "Neue Reise erstellen";
        document.querySelector("#trip-form-message").hidden = true;
        destinationInput.setCustomValidity("");
        endInput.setCustomValidity("");
        dialog.showModal();
        destinationInput.focus();
        return;
      }
      if (action === "remove") {
        myTrips = myTrips.filter((trip) => trip.id !== Number(button.dataset.tripId));
        list.innerHTML = renderMyTrips();
      }
    });

    list.addEventListener("change", (event) => {
      const input = event.target.closest("[data-trip-visibility]");
      if (!input) return;
      const trip = myTrips.find((item) => item.id === Number(input.dataset.tripVisibility));
      if (trip) trip.visible = input.checked;
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      endInput.setCustomValidity(
        startInput.value && endInput.value && endInput.value < startInput.value
          ? "Das Abreisedatum muss nach der Anreise liegen."
          : ""
      );
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const children = [...form.querySelectorAll(".child-age-entry")].map((entry) => ({
        age: entry.querySelector('input[name="childAge"]').value,
        gender: entry.querySelector('select[name="childGender"]').value,
      })).filter((child) => child.age !== "" || child.gender);
      const languages = formData.getAll("language").map(String);
      const message = document.querySelector("#trip-form-message");
      if (!children.length || children.some((child) => child.age === "")) {
        message.textContent = "Bitte gib für mindestens ein Kind und für jede ausgewählte Angabe ein Alter ein.";
        message.hidden = false;
        form.querySelector(".child-picker").open = true;
        form.querySelector('input[name="childAge"]')?.focus();
        return;
      }
      if (!languages.length) {
        message.textContent = "Bitte wähle mindestens eine Sprache aus.";
        message.hidden = false;
        form.querySelector(".language-picker").open = true;
        form.querySelector('input[name="language"]').focus();
        return;
      }
      const id = Number(formData.get("id"));
      const existingTrip = myTrips.find((trip) => trip.id === id);
      const destination = formData.get("destination").toString().trim();
      const updatedTrip = {
        id: existingTrip?.id ?? nextTripId++,
        destination,
        region: formData.get("region").toString().trim(),
        start: formData.get("start").toString(),
        end: formData.get("end").toString(),
        children: children.map((child) => ({ ...child, age: Number(child.age) })),
        languages,
        image: destination.toLocaleLowerCase("de").includes("kreta")
          ? exampleTrips[1].image
          : exampleTrips[0].image,
        visible: existingTrip?.visible ?? true,
      };

      if (existingTrip) {
        myTrips = myTrips.map((trip) => trip.id === id ? updatedTrip : trip);
      } else {
        myTrips.push(updatedTrip);
      }
      list.innerHTML = renderMyTrips();
      dialog.close();
    });
  }

  document.querySelector("#trip-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const start = form.elements.namedItem("start");
    const end = form.elements.namedItem("end");
    end.setCustomValidity(
      start.value && end.value && end.value < start.value
        ? "Die Abreise muss nach der Anreise liegen."
        : ""
    );
    if (!end.validity.valid) {
      form.querySelector(".date-picker").open = true;
      form.querySelector("#landing-date-error").textContent = end.validationMessage;
      form.querySelector("#landing-date-error").hidden = false;
      end.focus();
      return;
    }
    if (!form.reportValidity()) return;

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData) {
      if (key === "childAge" || key === "childGender") continue;
      if (value) params.append(key, value.toString());
    }
    form.querySelectorAll(".child-age-entry").forEach((entry) => {
      const age = entry.querySelector('input[name="childAge"]').value;
      const gender = entry.querySelector('select[name="childGender"]').value;
      if (age !== "" || gender) {
        params.append("childAge", age);
        params.append("childGender", gender);
      }
    });
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

}

document.addEventListener("click", (event) => {
  const searchForm = document.querySelector("#trip-search-form, #trip-form");
  if (searchForm && !event.composedPath().includes(searchForm)) closeLandingPopovers(searchForm);
  const link = event.target.closest('a[href^="/"]');
  if (!link || link.target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const form = document.querySelector("#trip-search-form, #trip-form");
  if (!form) return;
  const picker = document.activeElement.closest(".landing-picker");
  const focusTarget = picker?.querySelector("summary")
    ?? (form.querySelector("#destination-map").contains(document.activeElement)
      ? form.querySelector('[data-action="map"]')
      : form.querySelector("#destination"));
  const isOpen = form.querySelector(".landing-picker[open]")
    || !form.querySelector("#destination-suggestions").hidden
    || !form.querySelector("#destination-map").hidden;
  if (!isOpen) return;
  event.preventDefault();
  closeLandingPopovers(form);
  focusTarget.focus();
  closeLandingPopovers(form);
});

window.addEventListener("popstate", mountPage);
mountPage();
