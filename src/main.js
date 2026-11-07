import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles.css";
import heroImage from "./assets/holiday-buddies-hero.png";
import familySearchHero from "./assets/family-search-hero.png";
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
    children: [5, 8],
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
    children: [6],
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

function searchForm({ reset = false } = {}) {
  const legacyAge = new URLSearchParams(location.search).get("age");
  return `
    <form class="trip-search" id="trip-search-form">
      <div class="search-field destination-field">
        <label for="destination">${icon("geo-alt")} Reiseziel oder Hotel</label>
        <div class="landing-destination-control">
          <input id="destination" name="destination" type="search" placeholder="Ziel oder Hotel eingeben" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="destination-suggestions">
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
            <input id="start-date" name="start" type="date">
            <label for="end-date">Abreise</label>
            <input id="end-date" name="end" type="date">
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
            <p>Gib das Alter deiner Kinder an.</p>
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
              <div class="child-age-entry">
                <label for="age">Kind 1</label>
                <input id="age" name="childAge" type="number" min="0" max="18" inputmode="numeric" placeholder="Alter" aria-label="Alter von Kind 1">
                <button type="button" data-action="remove-child-age" aria-label="Kind 1 entfernen">${icon("x-lg")}</button>
              </div>
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
      <button class="btn btn-primary search-submit" type="submit" aria-label="Familien suchen">
        ${icon("search")}<span class="search-button-label">Familien suchen</span>
      </button>
      ${reset ? '<button class="family-filter-reset" type="reset">Filter zurücksetzen</button>' : ""}
    </form>`;
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
              <span class="hero-benefit-icon">${icon("umbrella")}</span>
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
  const children = family.children.map((age) => `${age} Jahre`).join(", ");
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

function searchPage() {
  return `
    <main id="main-content" class="results-page">
      <section class="family-search-hero">
        <div class="container family-search-hero-inner">
          <div class="family-search-hero-copy">
            <span class="eyebrow"><span class="eyebrow-dot"></span> Familien finden</span>
            <h1>Familien finden<br><span>für deinen Urlaub.</span></h1>
            <p>Entdecke Familien, die zur gleichen Zeit am gleichen Ort sind und lernt euch kennen.</p>
          </div>
          <div class="family-search-hero-visual">
            <img src="${familySearchHero}" alt="Vier Kinder spielen gemeinsam im klaren Wasser an einem sonnigen Strand" fetchpriority="high">
            <span class="family-search-flight" aria-hidden="true">
              <svg viewBox="0 0 130 45"><path d="M3 36C27 3 48 43 75 19S105 34 127 4"/></svg>
              ${icon("airplane-fill")}
            </span>
            <span class="family-search-hero-tag">${icon("people-fill")} Gemeinsam mehr erleben!</span>
          </div>
        </div>
      </section>
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
      <section class="my-trips-hero">
        <div class="container my-trips-hero-inner">
          <div class="my-trips-intro">
            <span class="eyebrow"><span class="eyebrow-dot"></span> Meine Reisen</span>
            <h1>Meine Reisen</h1>
            <p>Hier findest du deine geplanten Urlaube. Lege neue Reisen an und entscheide, welche Informationen du teilen möchtest.</p>
            <button class="btn btn-primary my-trips-create" type="button" data-trip-action="new">
              ${icon("plus-lg")} Neue Reise erstellen
            </button>
          </div>
          <div class="my-trips-hero-visual">
            <img src="${heroImage}" alt="Kinder entdecken gemeinsam das Meer im Urlaub" fetchpriority="high">
            <span class="my-trips-sun-rays" aria-hidden="true">〟</span>
          </div>
        </div>
      </section>
      <section class="container my-trips-content" aria-label="Deine Reisen">
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
          <label for="trip-destination">Reiseziel</label>
          <input id="trip-destination" name="destination" type="text" placeholder="z. B. Mallorca" required>
          <label for="trip-region">Ort / Region</label>
          <input id="trip-region" name="region" type="text" placeholder="z. B. Alcúdia, Mallorca" required>
          <div class="trip-form-dates">
            <div><label for="trip-start">Anreise</label><input id="trip-start" name="start" type="date" required></div>
            <div><label for="trip-end">Abreise</label><input id="trip-end" name="end" type="date" required></div>
          </div>
          <label for="trip-children">Alter der Kinder</label>
          <input id="trip-children" name="children" type="text" placeholder="z. B. 5, 8" required>
          <label for="trip-languages">Sprachen</label>
          <input id="trip-languages" name="languages" type="text" placeholder="z. B. Deutsch, Englisch" required>
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
    const children = trip.children.map((age) => `${age}`).join(" und ");
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
  const childAges = params.getAll("childAge").map(Number).filter(Number.isInteger).sort((a, b) => a - b);
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
    const matchingChildAges = [...family.children].sort((a, b) => a - b);
    const hasRequestedChildAges = childAges.every((requestedAge) => {
      const matchIndex = matchingChildAges.findIndex((familyAge) => Math.abs(familyAge - requestedAge) <= 2);
      if (matchIndex === -1) return false;
      matchingChildAges.splice(matchIndex, 1);
      return true;
    });
    const hasAge = hasRequestedChildAges && family.children.some((age) => age >= minAge && age <= maxAge);
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

function setupLandingSearch(form) {
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
    const ages = [...childAgeList.querySelectorAll('input[name="childAge"]')]
      .map((input) => input.value).filter((value) => value !== "");
    const languages = [...form.querySelectorAll('input[name="language"]:checked')].map((input) => input.value);
    const ageRange = form.querySelector('select[name="age"]')?.value;
    const ageSummary = ages.length ? `${ages.length} ${ages.length === 1 ? "Kind" : "Kinder"}: ${ages.join(", ")} J.` : "";
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
    entry.className = "child-age-entry";
    entry.innerHTML = `<label>Kind ${index}</label>
      <input name="childAge" type="number" min="0" max="18" inputmode="numeric" placeholder="Alter" aria-label="Alter von Kind ${index}">
      <button type="button" data-action="remove-child-age" aria-label="Kind ${index} entfernen">${icon("x-lg")}</button>`;
    childAgeList.append(entry);
    const input = entry.querySelector("input");
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
        entry.querySelector("label").textContent = `Kind ${index + 1}`;
        entry.querySelector("input").setAttribute("aria-label", `Alter von Kind ${index + 1}`);
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

  let ageIndex = 0;
  for (const [key, value] of new URLSearchParams(location.search)) {
    if (key === "childAge") {
      const input = childAgeList.querySelectorAll('input[name="childAge"]')[ageIndex] ?? addChild(false);
      if (input) { input.value = value; ageIndex += 1; }
    } else if (key === "language") {
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
    const childrenInput = form.elements.namedItem("children");

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
        form.elements.namedItem("children").value = trip?.children.join(", ") ?? "";
        form.elements.namedItem("languages").value = trip?.languages.join(", ") ?? "";
        document.querySelector("#trip-dialog-title").textContent =
          trip ? "Reise bearbeiten" : "Neue Reise erstellen";
        document.querySelector("#trip-form-message").hidden = true;
        destinationInput.setCustomValidity("");
        endInput.setCustomValidity("");
        childrenInput.setCustomValidity("");
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
      const ages = childrenInput.value.split(",").map((age) => Number(age.trim()));
      childrenInput.setCustomValidity(
        ages.some((age) => !Number.isInteger(age) || age < 0 || age > 18)
          ? "Bitte gib Kinderalter als Zahlen zwischen 0 und 18 ein, getrennt durch Kommas."
          : ""
      );
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const id = Number(formData.get("id"));
      const existingTrip = myTrips.find((trip) => trip.id === id);
      const destination = formData.get("destination").toString().trim();
      const updatedTrip = {
        id: existingTrip?.id ?? nextTripId++,
        destination,
        region: formData.get("region").toString().trim(),
        start: formData.get("start").toString(),
        end: formData.get("end").toString(),
        children: ages,
        languages: formData.get("languages").toString().split(",").map((language) => language.trim()).filter(Boolean),
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
      if (value) params.append(key, value.toString());
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

}

document.addEventListener("click", (event) => {
  const searchForm = document.querySelector("#trip-search-form");
  if (searchForm && !event.composedPath().includes(searchForm)) closeLandingPopovers(searchForm);
  const link = event.target.closest('a[href^="/"]');
  if (!link || link.target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const form = document.querySelector("#trip-search-form");
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
