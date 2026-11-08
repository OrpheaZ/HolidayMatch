import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Modal from "bootstrap/js/dist/modal.js";
import "./styles.css";
import familySearchHero from "./assets/familien_suchen.png";
import myTripsHero from "./assets/meiner_eisen.png";
import landingMobileHero from "./assets/holidaybuddies_opener_mb.png";
import destinationPlaceholder from "./assets/destination-placeholder.svg";
import { getSupabase, setAuthPersistence } from "./lib/supabase.js";
import { filterFamilies } from "./lib/family-search.js";
import { register, login, ensureProfile } from "./lib/auth.js";
import { fetchOwnTrips, saveOwnTrip, removeOwnTrip, setOwnTripVisibility } from "./lib/trips.js";
import { fetchDestinationCatalog, destinationSuggestions, destinationPhoto, destinationPhotoMarkup, resolveDestination } from "./lib/destinations.js";
import { requestFamilyContact, fetchPersonalReferences, setFamilyFavorite, fetchReceivedContacts } from "./lib/contact.js";
import { paginate, paginationMarkup } from "./lib/pagination.js";
import { fetchPlannedTrips, localDateString } from "./lib/planned-trips.js";
import { uploadTripPhoto, removeTripPhoto, hydrateTripPhotos, releaseTripPhotos } from "./lib/trip-photos.js";
import { choiceKey, formatTripDateRange, initialLanguage, languageStorageKey, localeForLanguage, supportedLanguage, translate, translateChoice, translateElements } from "./lib/i18n.js";

const app = document.querySelector("#app");
let storedLanguage;
try {
  storedLanguage = localStorage.getItem(languageStorageKey);
} catch (error) {
  console.warn("Die gespeicherte Sprache konnte nicht gelesen werden:", error);
}
let language = initialLanguage(storedLanguage, navigator.languages?.length ? navigator.languages : [navigator.language]);
const navItems = [
  { href: "/", label: "Startseite", key: "home" },
  { href: "/search", label: "Familien finden", key: "search" },
  { href: "/trips", label: "Meine Reisen", key: "trips" },
];

const icon = (name) => `<i class="bi bi-${name}" aria-hidden="true"></i>`;
let currentSession = null;
let cleanupPage = () => {};
let updatePageLanguage = () => {};
let destinationCatalog = [];
let catalogPromise;
function loadDestinationCatalog() {
  if (!catalogPromise) {
    catalogPromise = Promise.resolve().then(() => fetchDestinationCatalog(getSupabase())).then((rows) => {
      destinationCatalog = rows;
      return rows;
    }).catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

function photoMarkup(location, imageClass) {
  const photo = destinationCatalog.length ? destinationPhoto(getSupabase(), destinationCatalog, location) : null;
  const altText = photo ? translate(language, "destinationPhotoAlt", { destination: location.destination }) : translate(language, "placeholderPhotoAlt");
  const markup = destinationPhotoMarkup(photo, location.destination, destinationPlaceholder, imageClass, altText);
  return location.photo_path
    ? markup.replace(" data-destination-photo", ` data-trip-photo-path="${escapeHTML(location.photo_path)}" data-trip-photo-alt="${escapeHTML(translate(language, "tripPhotoAlt"))}" data-photo-fallback="${escapeHTML(photo?.url ?? destinationPlaceholder)}" data-destination-photo`)
    : markup;
}
const tripInterests = ["Strand", "Schwimmen", "Spielplatz", "Sandburgen", "Wassersport", "Wandern", "Natur", "Tiere", "Fahrradfahren", "Ausflüge", "Kultur", "Essen", "Brettspiele", "Basteln", "Freizeitpark", "Sport", "Entspannung", "Camping"];

function tripDetailsMarkup(trip, kind = "public") {
  const interests = trip.interests ?? [];
  const reference = kind === "own" ? trip.id : trip.trip_reference;
  return `<div class="trip-extra-details">
    ${interests.length ? `<p><strong>${translate(language, "interests")}</strong> ${escapeHTML(interests.map((value) => translateChoice(language, value)).join(", "))}</p>` : ""}
    <button class="trip-details-link" type="button" data-trip-details="${escapeHTML(reference)}" data-trip-kind="${kind}">${translate(language, "tripDetails")}</button>
  </div>`;
}
function header() {
  const links = navItems.map(({ href, label, key }) =>
    `<a class="nav-link${location.pathname === href ? " active" : ""}" href="${href}" data-i18n="${key}">${label}</a>`
  ).join("");

  return `
    <a class="skip-link" href="#main-content" data-i18n="skip">Zum Inhalt springen</a>
    <header class="site-header">
      <nav class="navbar navbar-expand-lg" aria-label="Hauptnavigation" data-i18n-aria-label="navigation">
        <div class="container">
          <a class="navbar-brand brand-mark" href="/" aria-label="Holiday Buddies Startseite" data-i18n-aria-label="homeLabel">
            <span class="brand-icon">${icon("sun-fill")}</span>
            <span>holiday<span class="brand-light">buddies</span></span>
          </a>
          <label class="site-language">
            <span class="visually-hidden" data-i18n="language">Sprache der Navigation (weitere Inhalte derzeit auf Deutsch)</span>
            <select class="form-select form-select-sm" id="site-language" data-i18n-title="language">
              <option value="de"${language === "de" ? " selected" : ""}>DE</option>
              <option value="en"${language === "en" ? " selected" : ""}>EN</option>
              <option value="bg"${language === "bg" ? " selected" : ""}>BG</option>
            </select>
          </label>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-navigation" aria-controls="main-navigation" aria-expanded="false" aria-label="Menü öffnen" data-i18n-aria-label="menu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="main-navigation">
            <div class="navbar-nav main-nav mx-lg-auto align-items-lg-center gap-lg-2">
              ${links}
            </div>
            <div class="navbar-nav auth-nav align-items-lg-center gap-lg-2" id="auth-navigation">
              <a class="nav-link" href="/login">Anmelden</a>
              <a class="btn btn-primary nav-cta" href="/register">Kostenlos starten</a>
            </div>
          </div>
        </div>
      </nav>
      <p class="container text-danger small mb-0" id="auth-navigation-error" role="alert" hidden></p>
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
        <p><span data-i18n="footer">Gemeinsam wird Urlaub noch schöner.</span> <span aria-hidden="true">☀️</span></p>
        <span class="footer-note" data-i18n="prototype">Ein erster Prototyp für Familien</span>
      </div>
    </footer>`;
}

function childEntry(index, trip = false) {
  const age = `<input name="childAge" type="number" min="0" max="18" step="1" inputmode="numeric" placeholder="${translate(language, "ageExample")}" data-i18n-placeholder="ageExample" aria-label="${translate(language, "childAgeLabel", { number: index })}">`;
  const gender = `<select class="form-select form-select-sm child-gender" name="childGender" aria-label="${translate(language, "childGenderLabel", { number: index })}">
      <option value="" data-i18n="${trip ? "optional" : "anyGender"}">${translate(language, trip ? "optional" : "anyGender")}</option>
      <option value="Junge" data-i18n="genderBoy">${translate(language, "genderBoy")}</option>
      <option value="Mädchen" data-i18n="genderGirl">${translate(language, "genderGirl")}</option>
    </select>`;
  return `<div class="child-age-entry${trip ? "" : " child-search-entry"}">
    <span class="child-entry-label">${translate(language, "childLabel", { number: index })}</span>
    ${trip ? `<label class="child-entry-field"><span data-i18n="ageYears">${translate(language, "ageYears")}</span>${age}</label>
    <label class="child-entry-field"><span><span data-i18n="gender">${translate(language, "gender")}</span> <span class="child-field-optional" data-i18n="optionalSuffix">${translate(language, "optionalSuffix")}</span></span>${gender}</label>` : `<label class="child-entry-field"><span data-i18n="ageYears">${translate(language, "ageYears")}</span>${age}</label>
    <label class="child-entry-field"><span data-i18n="gender">${translate(language, "gender")}</span>${gender}</label>`}
    <button type="button" data-action="remove-child-age" aria-label="${translate(language, "removeChildLabel", { number: index })}">${icon("x-lg")}</button>
  </div>`;
}

function searchForm({ reset = false, trip = false } = {}) {
  const legacyAge = trip ? null : new URLSearchParams(location.search).get("age");
  return `
    ${trip ? '<div class="trip-search trip-form-fields">' : '<form class="trip-search" id="trip-search-form">'}
      <div class="search-field destination-field">
        <label for="destination">${icon("geo-alt")} <span data-i18n="${trip ? "destination" : "destinationOrHotel"}">${trip ? "Reiseziel" : "Reiseziel oder Hotel"}</span></label>
        <div class="landing-destination-control">
          <input id="destination" name="destination" type="search" placeholder="${trip ? "z. B. Kreta, Griechenland" : "Ziel oder Hotel eingeben"}" data-i18n-placeholder="${trip ? "destinationExample" : "destinationPlaceholder"}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="destination-suggestions"${trip ? ' maxlength="150" required' : ""}>
          <button type="button" class="landing-map-toggle" data-action="map" aria-label="Reiseziele auf einer Karte auswählen" data-i18n-aria-label="mapSelect" aria-expanded="false" aria-controls="destination-map">${icon("map")}</button>
        </div>
        <div class="landing-suggestions landing-popover" id="destination-suggestions" role="listbox" aria-label="${trip ? "Vorschläge für Reiseziel" : "Vorschläge für Reiseziel oder Hotel"}" data-i18n-aria-label="${trip ? "destinationSuggestions" : "destinationHotelSuggestions"}" hidden></div>
        <div class="landing-map landing-popover" id="destination-map" hidden>
          <strong data-i18n="mapChoose">Reiseziel auf der Karte wählen</strong>
          <p data-i18n="mapDescription">Schematische Übersicht der verfügbaren Beispielziele</p>
          <div class="landing-map-graphic" aria-label="Schematische Karte des Mittelmeerraums" data-i18n-aria-label="mapLabel">
            <svg viewBox="0 0 360 170" preserveAspectRatio="none" aria-hidden="true">
              <rect width="360" height="170" fill="#d9f3f1"/>
              <path d="M0 0h360v52l-40 8-29-8-30 20-31-8-27 21-16-8-12-24-20-10-25 10-22-9-33 10-30-13L0 49zM0 130l48-10 37 10 33-4 38 14 46-5 44 14 43-9 71 8v22H0zM105 99l29-5 10 8-20 8-20-3zM214 111l36-5 9 8-31 6-16-3z" fill="#eaf3e4" stroke="#bfded4" stroke-width="2"/>
            </svg>
            <button type="button" data-map-destination="Mallorca" class="landing-map-pin pin-mallorca">Mallorca</button>
            <button type="button" data-map-destination="Gardasee" class="landing-map-pin pin-garda">Gardasee</button>
            <button type="button" data-map-destination="Kreta" class="landing-map-pin pin-kreta">Kreta</button>
          </div>
          <p data-i18n="mapHint">Wähle einen Ort aus, um ihn in die Suche zu übernehmen.</p>
        </div>
      </div>
      ${trip ? `<div class="search-field trip-region-field">
        <label for="trip-accommodation">${icon("building")} <span data-i18n="accommodation">Hotel / Unterkunft (optional)</span></label>
        <input id="trip-accommodation" name="accommodation" type="text" placeholder="Name der Unterkunft" data-i18n-placeholder="accommodationName" maxlength="150">
      </div>` : ""}
      <div class="search-field date-field">
        <span class="search-field-label" id="landing-date-label">${icon("calendar3")} <span data-i18n="travelDates">Reisezeitraum</span></span>
        <details class="landing-picker date-picker">
          <summary aria-labelledby="landing-date-label landing-date-summary"><span id="landing-date-summary" data-date-summary>Zeitraum auswählen</span>${icon("calendar3")}</summary>
          <div class="landing-popover landing-date-options">
            <p data-i18n="dateHint">Wähle Anreise und Abreise im Kalender oder gib sie einzeln ein.</p>
            <div class="landing-calendar">
              <div class="landing-calendar-heading">
                <button type="button" data-calendar-month="-1" aria-label="Vorheriger Monat" data-i18n-aria-label="previousMonth">${icon("chevron-left")}</button>
                <strong data-calendar-month-label aria-live="polite"></strong>
                <button type="button" data-calendar-month="1" aria-label="Nächster Monat" data-i18n-aria-label="nextMonth">${icon("chevron-right")}</button>
              </div>
              <div class="landing-calendar-weekdays" aria-hidden="true"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div>
              <div class="landing-calendar-days" aria-label="Kalendertage" data-i18n-aria-label="calendarDays"></div>
            </div>
            <label for="start-date" data-i18n="arrival">Anreise</label>
            <input id="start-date" name="start" type="date"${trip ? " required" : ""}>
            <label for="end-date" data-i18n="departure">Abreise</label>
            <input id="end-date" name="end" type="date"${trip ? " required" : ""}>
            <p class="landing-date-error" id="landing-date-error" role="alert" hidden></p>
            <button type="button" class="landing-picker-done" data-action="close-picker" data-i18n="apply">Übernehmen</button>
          </div>
        </details>
      </div>
      <div class="search-field">
        <span class="search-field-label" id="landing-child-label">${icon("people")} <span data-i18n="childAges">Alter der Kinder</span></span>
        <details class="landing-picker child-picker">
          <summary aria-labelledby="landing-child-label landing-child-summary"><span id="landing-child-summary" data-child-summary>Alle Altersgruppen</span>${icon("chevron-down")}</summary>
          <div class="landing-popover landing-child-options">
            <p data-i18n="${trip ? "childHintTrip" : "childHintSearch"}">${trip ? "Gib das Alter direkt ein und wähle bei Bedarf das Geschlecht aus." : "Gib das Alter deiner Kinder an. Junge oder Mädchen ist optional."}</p>
            ${["3-5", "6-8", "9-12"].includes(legacyAge) ? `
              <label for="legacy-age" data-i18n="previousAge">Bisheriger Altersbereich</label>
              <select id="legacy-age" name="age">
                <option value="" data-i18n="noAgeRange">Kein Altersbereich</option>
                <option value="3-5">3–5 Jahre</option>
                <option value="6-8">6–8 Jahre</option>
                <option value="9-12">9–12 Jahre</option>
              </select>
            ` : ""}
            <div class="child-age-list" id="child-age-list">
              ${childEntry(1, trip)}
            </div>
            <button class="add-child-age" type="button" data-action="add-child-age">${icon("plus-circle")} <span data-i18n="addChild">Kind hinzufügen</span></button>
            <button type="button" class="landing-picker-done" data-action="close-picker" data-i18n="apply">Übernehmen</button>
          </div>
        </details>
      </div>
      <div class="search-field">
        <span class="search-field-label" id="landing-language-label">${icon("globe2")} <span data-i18n="spokenLanguage">Sprache</span></span>
        <details class="landing-picker language-picker">
          <summary aria-labelledby="landing-language-label landing-language-summary"><span id="landing-language-summary" data-language-summary>Alle Sprachen</span>${icon("chevron-down")}</summary>
          <div class="landing-popover language-options">
            <p data-i18n="languageHint">Wähle eine oder mehrere Sprachen.</p>
            ${["Deutsch", "Englisch", "Bulgarisch", "Spanisch", "Französisch", "Türkisch", "Niederländisch", "Italienisch"].map((value) => `
              <label><input type="checkbox" name="language" value="${value}"><span data-i18n="${choiceKey(value)}">${translateChoice(language, value)}</span></label>
            `).join("")}
            <button type="button" class="landing-picker-done" data-action="close-picker" data-i18n="apply">Übernehmen</button>
          </div>
        </details>
      </div>
      ${trip ? "" : `<button class="btn btn-primary search-submit" type="submit" aria-label="Familien suchen" data-i18n-aria-label="searchFamilies">
        ${icon("search")}<span class="search-button-label" data-i18n="searchFamilies">Familien suchen</span>
      </button>`}
      ${reset ? '<button class="family-filter-reset" type="reset" data-i18n="resetFilters">Filter zurücksetzen</button>' : ""}
    ${trip ? "</div>" : "</form>"}`;
}

function landingPage() {
  return `
    <main id="main-content">
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-copy">
            <span class="eyebrow"><span class="eyebrow-dot"></span> <span data-i18n="heroKicker">FAMILIEN. URLAUB. ENTSPANNT.</span></span>
            <h1><span data-i18n="heroTitle">Spielkameraden</span><br><span class="hero-title-highlight" data-i18n="heroTitleHighlight">im Urlaub</span> <span data-i18n="heroTitleEnd">finden.</span></h1>
            <p class="hero-description" data-i18n="heroDescription">Damit deine Kinder im Urlaub schnell neue Freunde finden – und du die Zeit endlich auch zum Entspannen genießen kannst.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#familien-suche"><span data-i18n="discoverFamilies">Familien entdecken</span> ${icon("arrow-right")}</a>
              <a class="btn btn-outline-primary hero-secondary" href="#wie-es-funktioniert" data-i18n="howItWorks">So funktioniert&apos;s</a>
            </div>
          </div>
          <img class="hero-photo" src="${landingMobileHero}" alt="Vier fröhliche Kinder spielen gemeinsam im Wasser am Strand" fetchpriority="high">
          <div class="hero-benefits" aria-label="Deine Vorteile">
            <div class="hero-benefit">
              <span class="hero-benefit-icon">${icon("people")}</span>
              <span data-i18n="benefitPlaymates">Spielkameraden für deine Kinder</span>
            </div>
            <div class="hero-benefit">
              <span class="hero-benefit-icon">${icon("check2")}</span>
              <span data-i18n="benefitRelaxation">Mehr Entspannung für dich</span>
            </div>
            <div class="hero-benefit">
              <span class="hero-benefit-icon">${icon("shield-check")}</span>
              <span data-i18n="benefitHoliday">Ein sorgloser Familienurlaub</span>
            </div>
          </div>
        </div>
      </section>
      <section class="hero-search-section shared-search" id="familien-suche">
        <div class="container">
          <div class="search-panel">
            <div class="search-heading">
              <div>
                <span class="search-kicker" data-i18n="nextAdventure">Dein nächstes Abenteuer</span>
                <h2 data-i18n="whoIsThere">Wer ist zur gleichen Zeit dort?</h2>
              </div>
              <span class="search-heading-icon">${icon("compass")}</span>
            </div>
            ${searchForm()}
            <p class="search-footnote">${icon("sparkles")} <span data-i18n="freeSearch">Unverbindlich suchen – ganz ohne Konto.</span></p>
          </div>
        </div>
      </section>
      <section class="planned-trips-section" aria-labelledby="planned-trips-title">
        <div class="container">
          <div class="planned-trips-heading">
            <h2 id="planned-trips-title" data-i18n="plannedTitle">Schon geplante Reisen – sei dabei!</h2>
          </div>
          <div class="planned-trips-grid">
            <p class="planned-trips-message" id="planned-trips-message" role="status">Reisen werden geladen …</p>
            <aside class="planned-trips-cta">
              <span class="planned-trips-cta-icon">${icon("compass")}</span>
              <h3 data-i18n="discoverTrips">Weitere Reisen entdecken</h3>
              <p data-i18n="findFamiliesSameTime">Finde Familien, die zur gleichen Zeit unterwegs sind.</p>
              <a class="planned-trips-cta-button" href="/search" aria-label="Familien suchen">${icon("arrow-right")}</a>
            </aside>
          </div>
        </div>
      </section>
      <section class="how-section" id="wie-es-funktioniert" aria-labelledby="how-title">
        <div class="container">
          <div class="section-heading text-center">
            <span class="eyebrow" data-i18n="planTogether">Gemeinsam planen</span>
            <h2 id="how-title"><span data-i18n="howItWorks">So funktioniert</span> <span>HolidayBuddies</span></h2>
            <p data-i18n="fourSteps">In vier einfachen Schritten zu gemeinsamen Urlaubsmomenten.</p>
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
              <h3 data-i18n="registerFree">Kostenlos registrieren</h3>
              <p data-i18n="registerHint">Erstelle in wenigen Sekunden dein Familienkonto.</p>
            </article>
            <article class="how-step">
              <div class="how-step-visual">
                <span class="how-step-number" aria-hidden="true">2</span>
                <div class="how-step-icon-circle">
                  ${icon("calendar-event")}
                  <span class="how-step-icon-accent">${icon("airplane-fill")}</span>
                </div>
              </div>
              <h3 data-i18n="enterTrip">Deine Reise eintragen</h3>
              <p data-i18n="enterTripHint">Gib Reiseziel, Reisezeitraum und das Alter deiner Kinder an.</p>
            </article>
            <article class="how-step">
              <div class="how-step-visual">
                <span class="how-step-number" aria-hidden="true">3</span>
                <div class="how-step-icon-circle">
                  ${icon("people-fill")}
                  <span class="how-step-icon-accent">${icon("search")}</span>
                </div>
              </div>
              <h3 data-i18n="findMatching">Passende Familien finden</h3>
              <p data-i18n="discoverSamePlace">Entdecke Familien, die zur gleichen Zeit am gleichen Ort sind.</p>
            </article>
            <article class="how-step">
              <div class="how-step-visual">
                <span class="how-step-number" aria-hidden="true">4</span>
                <div class="how-step-icon-circle">
                  ${icon("chat-heart")}
                  <span class="how-step-icon-accent">${icon("heart-fill")}</span>
                </div>
              </div>
              <h3 data-i18n="connect">In Kontakt kommen</h3>
              <p data-i18n="connectHint">Tauscht euch aus, plant gemeinsame Aktivitäten und freut euch auf einen noch schöneren Urlaub!</p>
            </article>
          </div>
          <div class="benefits-bar" aria-label="Vorteile von HolidayBuddies">
            <div class="benefit-item">
              <span class="benefit-icon">${icon("people")}</span>
              <div>
                <h3 data-i18n="likeMinded">Gleichgesinnte Familien</h3>
                <p data-i18n="similarAges">Familien mit Kindern in ähnlichem Alter</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">${icon("calendar-event")}</span>
              <div>
                <h3 data-i18n="samePlace">Gleiche Reisezeit &amp; Ort</h3>
                <p data-i18n="sharedMoments">Gemeinsame Urlaubsmomente</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">${icon("shield-check")}</span>
              <div>
                <h3 data-i18n="safe">Sicher &amp; vertrauensvoll</h3>
                <p data-i18n="parentsDecide">Eltern entscheiden selbst, mit wem sie Kontakt aufnehmen</p>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">${icon("heart")}</span>
              <div>
                <h3 data-i18n="moreThanHoliday">Mehr als nur Urlaub</h3>
                <p data-i18n="friendships">Neue Freundschaften – oft über die Reise hinaus</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="family-trip-cta-section" aria-labelledby="family-trip-cta-title">
        <div class="container family-trip-cta-container">
          <div class="family-trip-cta-content">
            <span class="family-trip-cta-icon" aria-hidden="true">${icon("sun")}</span>
            <h2 id="family-trip-cta-title" data-i18n="readyHoliday">Bereit für deinen nächsten Familienurlaub?</h2>
            <p data-i18n="discoverSamePlace">Entdecke Familien, die zur gleichen Zeit am gleichen Ort sind.</p>
            <a class="btn btn-primary family-trip-cta-button" href="/register"><span data-i18n="startFree">Jetzt kostenlos starten</span> ${icon("arrow-right")}</a>
          </div>
        </div>
      </section>
    </main>`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" })
    .format(new Date(`${date}T12:00:00`));
}

function familyCard(family, favorites = new Set(), contacted = new Set(), personalReady = true) {
  const children = family.children.map((child) => `${translate(language, "yearCount", { count: child.age })}${child.gender ? ` (${translateChoice(language, child.gender)})` : ""}`).join(", ");
  const dateRange = tripDateRange(family.start_date, family.end_date);
  const isFavorite = favorites.has(family.trip_reference);
  const isContacted = contacted.has(family.trip_reference);
  const location = [family.region, family.destination, family.country].filter(Boolean).join(", ");
  return `
    <article class="family-result-card">
      <figure class="destination-photo family-result-photo">${photoMarkup(family, "family-result-image")}</figure>
      <div class="family-result-content">
        <div class="family-result-heading">
          <div class="family-result-name">${icon("people-fill")}<h3>${translate(language, "family")}</h3></div>
          <button class="family-favorite${isFavorite ? " is-favorite" : ""}" type="button" data-favorite="${escapeHTML(family.trip_reference)}" aria-label="${translate(language, isFavorite ? "removeFavorite" : "addFavorite")}: ${translate(language, "family")} – ${escapeHTML(family.destination)}" aria-pressed="${isFavorite}"${personalReady ? "" : " disabled"}>
            ${icon(isFavorite ? "heart-fill" : "heart")}
          </button>
        </div>
        <div class="family-result-location">${icon("geo-alt-fill")}<span>${escapeHTML(location)}</span></div>
        <div class="family-result-facts">
          <span>${icon("calendar3")}<span>${dateRange}</span></span>
          <span>${icon("people-fill")}<span>${family.children.length ? `${translate(language, family.children.length === 1 ? "childCountOne" : "childCountOther", { count: family.children.length })}: ${escapeHTML(children)}` : translate(language, "noChildren")}</span></span>
          <span>${icon("globe2")}<span>${escapeHTML(family.languages.map((value) => translateChoice(language, value)).join(", ") || translate(language, "noLanguages"))}</span></span>
        </div>
        ${tripDetailsMarkup(family)}
        ${isContacted ? `<p class="contacted-label" role="status">${translate(language, "contacted")}</p>` : `<button class="family-contact-button" type="button" data-contact="${escapeHTML(family.trip_reference)}"${personalReady ? "" : " disabled"}>
          ${icon("chat-dots")} ${translate(language, "contactRequest")}
        </button>`}
        <p data-contact-status role="status" hidden></p>
      </div>
    </article>`;
}

function pageHero({ variant, image }) {
  const search = variant === "search";
  return `
    <section class="page-hero page-hero-${variant}">
      <img class="page-hero-image" src="${image}" data-i18n-alt="${search ? "searchHeroAlt" : "tripsHeroAlt"}" alt="${translate(language, search ? "searchHeroAlt" : "tripsHeroAlt")}" fetchpriority="high">
      <div class="container page-hero-inner">
        <div class="page-hero-copy">
          <span class="eyebrow"><span class="eyebrow-dot"></span> <span data-i18n="${search ? "search" : "trips"}"></span></span>
          <h1><span class="page-hero-heading" data-i18n="${search ? "searchHeroHeading" : "tripsHeroHeading"}"></span><br><span data-i18n="${search ? "searchHeroHighlight" : "tripsHeroHighlight"}"></span></h1>
          <p data-i18n="${search ? "searchHeroDescription" : "tripsHeroDescription"}"></p>
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
          <h2 id="family-filter-title">${icon("funnel")} <span data-i18n="searchFilter">Suche anpassen</span></h2>
          ${searchForm({ reset: true })}
        </aside>
        <div class="family-results-panel">
          <div class="family-results-heading">
            <div>
              <h2 id="results-title" data-i18n="searchResults">Passende Familien</h2>
              <p id="results-count" aria-live="polite"></p>
            </div>
            <label class="family-sort-control" for="sort-results"><span data-i18n="sortBy">Sortieren nach</span>
              <select id="sort-results" aria-label="Suchergebnisse sortieren" data-i18n-aria-label="sortResults">
                <option value="newest" data-i18n="newest">Neueste zuerst</option>
                <option value="soonest" data-i18n="soonest">Reisedatum (aufsteigend)</option>
              </select>
            </label>
          </div>
          <div class="family-results-list" id="family-results"></div>
          <div id="family-pagination"></div>
          <p id="family-results-error" role="alert" hidden></p>
          <p id="personal-results-error" role="alert" hidden></p>
          <div class="empty-state d-none" id="empty-results">
            <span>${icon("search")}</span>
            <h3 data-i18n="noFamilies">Keine Familien gefunden</h3>
            <p data-i18n="noFamiliesHint">Versuche, deine Suche anzupassen – vielleicht wartet eure Urlaubscrew nur ein paar Filter weiter.</p>
          </div>
        </div>
      </section>
    </main>`;
}

function tripDialogsMarkup() {
  return `<dialog class="trip-dialog trip-details-dialog" id="trip-details-dialog" aria-labelledby="trip-details-title">
        <div id="trip-details-content"></div>
      </dialog>
      <dialog class="trip-dialog" id="contact-dialog" aria-labelledby="contact-title">
        <form id="contact-form">
          <div class="trip-dialog-heading"><h2 id="contact-title" data-i18n="contactTitle">Nachricht an die Familie</h2>
            <button type="button" class="trip-dialog-close" data-contact-close aria-label="Dialog schließen" data-i18n-aria-label="closeDialog">${icon("x-lg")}</button></div>
          <label class="form-label" for="contact-message" data-i18n="yourMessage">Deine Nachricht</label>
          <textarea class="form-control" id="contact-message" name="message" rows="5" maxlength="2000" required></textarea>
          <fieldset class="mt-3"><legend class="fs-6" data-i18n="sharedInterests">Gemeinsame Interessen (optional)</legend>
            <div class="d-flex flex-wrap gap-2">${["Strand", "Schwimmen", "Ausflüge", "Natur", "Sport", "Spielen", "Kultur", "Essen"].map((interest, index) =>
    `<input type="checkbox" class="btn-check" name="interest" value="${escapeHTML(interest)}" id="interest-${index}" autocomplete="off"><label class="btn btn-outline-primary btn-sm" for="interest-${index}" data-i18n="${choiceKey(interest)}">${escapeHTML(translateChoice(language, interest))}</label>`).join("")}</div>
          </fieldset>
          <p class="mt-3 mb-0" id="contact-form-status" role="status" hidden></p>
          <div class="trip-dialog-actions"><button class="btn btn-outline-primary" type="button" data-contact-close data-i18n="cancel">Abbrechen</button><button class="btn btn-primary" type="submit" data-i18n="sendRequest">Anfrage senden</button></div>
        </form>
      </dialog>
    `;
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
  return formatTripDateRange(language, start, end);
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
          ${icon("plus-lg")} <span data-i18n="addTrip">Neue Reise hinzufügen</span>
        </button>
        <div id="my-trips-list" class="my-trips-list">
          <p role="status" data-i18n="loadingTrips">Reisen werden geladen …</p>
        </div>
        <div id="trips-pagination"></div>
        <section class="contacted-families mt-4" aria-labelledby="contacted-title">
          <h2 id="contacted-title" data-i18n="contactedFamilies">Kontaktierte Familien</h2>
          <div id="contacted-list"><p role="status" data-i18n="loadingRequests">Kontaktanfragen werden geladen …</p></div>
          <div id="contacted-pagination"></div>
        </section>
        <section class="contacted-families mt-4" aria-labelledby="received-title">
          <h2 id="received-title" data-i18n="receivedRequests">Eingegangene Kontaktanfragen</h2>
          <div id="received-list"><p role="status" data-i18n="loadingRequests">Kontaktanfragen werden geladen …</p></div>
          <div id="received-pagination"></div>
        </section>
        <button class="my-trips-bottom-cta" type="button" data-trip-action="new">
          <span class="my-trips-bottom-icon">${icon("plus-lg")}</span>
          <span class="my-trips-bottom-copy">
            <strong data-i18n="anotherTrip">Weitere Reise erstellen</strong>
            <span data-i18n="anotherTripHint">Plane deinen nächsten Urlaub und finde passende Familien.</span>
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
      <div class="modal trip-visibility-modal" id="trip-visibility-modal" tabindex="-1" aria-labelledby="trip-visibility-title" aria-describedby="trip-visibility-description" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <span class="trip-visibility-modal-icon" aria-hidden="true">${icon("eye")}</span>
              <h2 class="modal-title" id="trip-visibility-title"></h2>
              <button type="button" class="btn-close" data-visibility-cancel aria-label="Schließen" data-i18n-aria-label="closeDialog"></button>
            </div>
            <div class="modal-body" id="trip-visibility-description"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-primary" data-visibility-cancel data-i18n="cancel">Abbrechen</button>
              <button type="button" class="btn btn-primary" data-visibility-confirm></button>
            </div>
          </div>
        </div>
      </div>
      <dialog class="trip-dialog" id="trip-dialog" aria-labelledby="trip-dialog-title">
        <form id="trip-form">
          <div class="trip-dialog-heading">
            <div>
              <span class="eyebrow" data-i18n="planHoliday">Urlaub planen</span>
              <h2 id="trip-dialog-title" data-i18n="newTrip">Neue Reise erstellen</h2>
            </div>
            <button class="trip-dialog-close" type="button" data-trip-action="close" aria-label="Dialog schließen" data-i18n-aria-label="closeDialog">${icon("x-lg")}</button>
          </div>
          <input type="hidden" name="id">
          <div class="shared-search">${searchForm({ trip: true })}</div>
          <div class="trip-extra-form">
            <label for="trip-description" data-i18n="tripDescription"></label>
            <p data-i18n="descriptionHint"></p>
            <textarea class="form-control" id="trip-description" name="description" rows="4" maxlength="1200" data-i18n-placeholder="descriptionExample"></textarea>
            <fieldset class="trip-interest-options">
              <legend data-i18n="interestsOptional"></legend>
              <p data-i18n="interestsHint"></p>
              <div class="d-flex flex-wrap gap-2">${tripInterests.map((interest, index) =>
    `<input class="btn-check" type="checkbox" name="tripInterest" id="trip-interest-${index}" value="${escapeHTML(interest)}" autocomplete="off"><label class="btn btn-outline-primary btn-sm" for="trip-interest-${index}" data-i18n="${choiceKey(interest)}">${escapeHTML(translateChoice(language, interest))}</label>`).join("")}</div>
              <label for="trip-custom-interests" data-i18n="customInterests"></label>
              <input class="form-control" id="trip-custom-interests" name="customInterests" type="text" maxlength="1000" data-i18n-placeholder="customInterestsExample">
            </fieldset>
            <label for="trip-photo" data-i18n="ownPhoto"></label>
            <p data-i18n="photoHint"></p>
            <input class="form-control" id="trip-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp">
            <label class="trip-photo-remove" id="trip-photo-remove-label" hidden><input type="checkbox" name="removePhoto"> <span data-i18n="removePhoto"></span></label>
          </div>
          <p id="trip-destinations-notice" role="status" hidden></p>
          <p class="trip-form-message" id="trip-form-message" role="status" hidden></p>
          <div class="trip-dialog-actions">
            <button class="btn btn-outline-primary" type="button" data-trip-action="close" data-i18n="cancel">Abbrechen</button>
            <button class="btn btn-primary" type="submit" data-i18n="saveTrip">Reise speichern</button>
          </div>
        </form>
      </dialog>
    </main>`;
}

function renderMyTrips(myTrips) {
  if (!myTrips.length) {
    return `<div class="my-trips-empty">
      <span>${icon("airplane")}</span>
      <h2>${translate(language, "emptyTripsTitle")}</h2>
      <p>${translate(language, "emptyTripsHint")}</p>
      <button class="btn btn-primary" type="button" data-trip-action="new">${icon("plus-lg")} ${translate(language, "createTrip")}</button>
    </div>`;
  }

  const today = new Date().toISOString().slice(0, 10);
  return myTrips.map((trip) => {
    const past = trip.end < today;
    const children = trip.children.map((child) => `${translate(language, "yearCount", { count: child.age })}${child.gender ? ` (${translateChoice(language, child.gender)})` : ""}`).join(", ");
    const query = new URLSearchParams({
      destination: trip.destination,
      start: trip.start,
      end: trip.end,
    });
    return `
      <article class="my-trip-card">
        <figure class="destination-photo my-trip-photo">
          ${photoMarkup({ destination: trip.destination, country: trip.country, destinationId: trip.locationData.destinationId, photo_path: trip.photo_path }, "")}
          <span class="my-trip-status${past ? " is-past" : ""}">${icon(past ? "calendar-check" : "calendar-event")}${translate(language, past ? "past" : "upcoming")}</span>
        </figure>
        <div class="my-trip-main">
          <div class="my-trip-title">
            <h2>${escapeHTML(trip.destination)}</h2>
            ${trip.accommodation ? `<p>${icon("building")} ${escapeHTML(trip.accommodation)}</p>` : ""}
            ${trip.region ? `<p>${icon("geo-alt-fill")} ${escapeHTML(trip.region)}</p>` : ""}
            ${trip.legacyRegion ? `<p>${escapeHTML(translate(language, "previousRegion", { region: trip.legacyRegion }))}</p>` : ""}
          </div>
          <div class="my-trip-details">
            <div class="my-trip-detail my-trip-date">
              <span class="my-trip-detail-icon">${icon("calendar3")}</span>
              <span>${escapeHTML(tripDateRange(trip.start, trip.end))}<small>${translate(language, "days", { count: tripDuration(trip.start, trip.end) })}</small></span>
            </div>
            <span class="my-trip-divider" aria-hidden="true"></span>
            <div class="my-trip-detail">
              <span class="my-trip-detail-icon">${icon("people-fill")}</span>
              <span>${translate(language, "childrenLabel")}: ${escapeHTML(children)}</span>
            </div>
            <div class="my-trip-detail my-trip-languages">
              <span class="my-trip-detail-icon">${icon("globe2")}</span>
              <span>${escapeHTML(trip.languages.map((value) => translateChoice(language, value)).join(", "))}</span>
            </div>
          </div>
          ${tripDetailsMarkup(trip, "own")}
        </div>
        <div class="my-trip-controls">
          <label class="my-trip-visibility">
            <span>${icon("eye")} ${translate(language, "visibleToOthers")}</span>
            <input type="checkbox" data-trip-visibility="${trip.id}" aria-label="${escapeHTML(translate(language, "visibilityFor", { destination: trip.destination }))}"${trip.visible ? " checked" : ""}>
            <span class="my-trip-switch" aria-hidden="true"></span>
          </label>
          <div class="my-trip-actions">
            <button type="button" data-trip-action="edit" data-trip-id="${trip.id}">${icon("pencil")}<span>${translate(language, "edit")}</span></button>
            <a href="/search?${query}" aria-label="${escapeHTML(translate(language, "findFor", { destination: trip.destination }))}">${icon("people")}<span>${translate(language, "searchResults")}</span></a>
            <button type="button" data-trip-action="remove" data-trip-id="${trip.id}">${icon("trash3")}<span>${translate(language, "remove")}</span></button>
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
          <span class="auth-illustration-tag">${icon("heart-fill")} <span data-i18n="shareMoments">Urlaubsmomente teilen</span></span>
          <div class="auth-illustration-copy">
            <span data-i18n="betterTogether">Gemeinsam ist’s schöner</span>
            <p data-i18n="holidayMemory">Die schönste Urlaubserinnerung? Die neuen Freunde, die man unterwegs findet.</p>
          </div>
        </div>
        <div class="auth-form-side">
          <a class="auth-back" href="/">${icon("arrow-left")} <span data-i18n="backHome">Zurück zur Startseite</span></a>
          <div class="auth-form-content">
            <span class="eyebrow" data-i18n="${registering ? "welcomeRegister" : "welcomeBack"}"></span>
            <h1 data-i18n="${registering ? "registerHeading" : "loginHeading"}"></h1>
            <p class="auth-subtitle" data-i18n="${registering ? "registerSubtitle" : "loginSubtitle"}"></p>
            <form id="auth-form">
              ${registering ? `
                <div class="mb-3">
                  <label class="form-label" for="name" data-i18n="yourName">Dein Name</label>
                  <input class="form-control" id="name" name="name" type="text" autocomplete="name" placeholder="z. B. Alex Muster" data-i18n-placeholder="nameExample" maxlength="100" required>
                </div>` : ""}
              <div class="mb-3">
                <label class="form-label" for="email" data-i18n="email">E-Mail-Adresse</label>
                <input class="form-control" id="email" name="email" type="email" autocomplete="email" placeholder="du@beispiel.de" required>
              </div>
              <div class="mb-3">
                <label class="form-label" for="password" data-i18n="password">Passwort</label>
                <input class="form-control" id="password" name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" data-i18n-placeholder="${registering ? "passwordMinimum" : "yourPassword"}"${registering ? ' minlength="8"' : ""} required>
              </div>
              ${registering ? `
                <div class="form-check auth-check">
                  <input class="form-check-input" id="privacy" type="checkbox" required>
                  <label class="form-check-label" for="privacy"><span data-i18n="privacyBefore"></span> <a href="#auth-demo-note" data-i18n="privacyLink"></a> <span data-i18n="privacyAfter"></span></label>
                </div>` : `
                <div class="auth-options">
                  <label class="form-check">
                    <input class="form-check-input" type="checkbox" id="remember" checked>
                    <span class="form-check-label" data-i18n="rememberMe">Angemeldet bleiben</span>
                  </label>
                  <a href="#auth-notice" data-action="reset-password" data-i18n="forgotPassword">Passwort vergessen?</a>
                </div>`}
              <button class="btn btn-primary auth-submit" type="submit"><span data-i18n="${registering ? "createAccount" : "login"}"></span> ${icon("arrow-right")}</button>
              <p class="prototype-message" id="auth-notice" role="status" hidden></p>
            </form>
            <p class="auth-switch"><span data-i18n="${registering ? "haveAccount" : "noAccount"}"></span> <a href="${registering ? "/login" : "/register"}" data-i18n="${registering ? "loginNow" : "registerFree"}"></a></p>
            <p class="auth-demo-note" id="auth-demo-note">${icon("info-circle")} <span data-i18n="authNote"></span></p>
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

function updateAuthNavigation() {
  const nav = document.querySelector("#auth-navigation");
  if (!nav) return;
  nav.innerHTML = currentSession
    ? '<button class="btn btn-primary nav-cta" type="button" data-action="sign-out" data-i18n="logout">Abmelden</button>'
    : '<a class="nav-link" href="/login" data-i18n="login">Anmelden</a><a class="btn btn-primary nav-cta" href="/register" data-i18n="register">Kostenlos starten</a>';
  translateElements(nav, language);
}

function showAuthNotice(message) {
  const notice = document.querySelector("#auth-notice");
  if (!notice) return;
  delete notice.dataset.i18n;
  notice.textContent = message;
  notice.hidden = false;
}

function showAuthKey(key) {
  const notice = document.querySelector("#auth-notice");
  if (!notice) return;
  showTranslatedText(notice, key);
  notice.hidden = false;
}

function authErrorKey(error) {
  return ({
    invalid_credentials: "authInvalid", email_not_confirmed: "authUnconfirmed",
    over_email_send_rate_limit: "authRate", over_request_rate_limit: "authRate",
    weak_password: "authWeak", email_address_invalid: "authEmail", user_already_exists: "authExists",
  })[error?.code] ?? "authFailed";
}

function showTranslatedText(element, key) {
  element.dataset.i18n = key;
  element.textContent = translate(language, key);
  element.lang = language;
}

async function loadPublicFamilies() {
  const client = getSupabase();
  const families = new Map();
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.rpc("search_public_families_newest")
      .order("sort_position", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    for (const family of data) families.set(family.trip_reference, family);
    if (data.length < pageSize) return [...families.values()];
  }
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

function setupLandingSearch(form, { fromQuery = true, trip = false } = {}) {
  const childAgeList = form.querySelector("#child-age-list");
  const destination = form.querySelector("#destination");
  const suggestions = form.querySelector("#destination-suggestions");
  const map = form.querySelector("#destination-map");
  const start = form.elements.namedItem("start");
  const end = form.elements.namedItem("end");
  let values = [];
  let calendarMonth = new Date();
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);

  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const locale = localeForLanguage(language);
    const monthLabel = form.querySelector("[data-calendar-month-label]");
    monthLabel.lang = language;
    monthLabel.textContent = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(calendarMonth);
    const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    form.querySelectorAll(".landing-calendar-weekdays span").forEach((day, index) => {
      day.lang = language;
      day.textContent = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, index + 1));
    });
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
    form.querySelectorAll("[data-child-summary], [data-language-summary], [data-date-summary]").forEach((element) => { element.lang = language; });
    childAgeList.querySelectorAll(".child-age-entry").forEach((entry, index) => {
      const values = { number: index + 1 };
      entry.querySelector(".child-entry-label").textContent = translate(language, "childLabel", values);
      entry.querySelector("input").setAttribute("aria-label", translate(language, "childAgeLabel", values));
      entry.querySelector("select").setAttribute("aria-label", translate(language, "childGenderLabel", values));
      entry.querySelector("button")?.setAttribute("aria-label", translate(language, "removeChildLabel", values));
    });
    const children = [...childAgeList.querySelectorAll(".child-age-entry")].map((entry) => ({
      age: entry.querySelector('input[name="childAge"]').value,
      gender: entry.querySelector('select[name="childGender"]').value,
    })).filter((child) => child.age !== "" || child.gender);
    const languages = [...form.querySelectorAll('input[name="language"]:checked')].map((input) => input.value);
    const ageRange = form.querySelector('select[name="age"]')?.value;
    const ageSummary = children.map((child) => [child.age !== "" ? translate(language, "yearsShort", { age: child.age }) : "", translateChoice(language, child.gender)].filter(Boolean).join(" · ")).join(", ");
    const [minAge, maxAge] = ageRange?.split("-") ?? [];
    form.querySelector("[data-child-summary]").textContent = [ageSummary, ageRange ? translate(language, "ageRange", { min: minAge, max: maxAge }) : ""]
      .filter(Boolean).join(" · ") || translate(language, "anyAges");
    form.querySelector("[data-language-summary]").textContent = languages.length ? languages.map((value) => translateChoice(language, value)).join(", ") : translate(language, "anyLanguages");
    const format = (value) => new Intl.DateTimeFormat(localeForLanguage(language), { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`));
    form.querySelector("[data-date-summary]").textContent = start.value && end.value
      ? `${format(start.value)} – ${format(end.value)}`
      : start.value ? translate(language, "dateFrom", { date: format(start.value) }) : end.value ? translate(language, "dateUntil", { date: format(end.value) }) : translate(language, "selectDates");
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
    entry.innerHTML = childEntry(index, trip);
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
      form.querySelector('[data-action="add-child-age"]').disabled = false;
      form.querySelector('[data-action="add-child-age"]').focus();
      updateSummary();
    }
    const done = event.target.closest('[data-action="close-picker"]');
    if (done) {
      const picker = done.closest("details");
      if (picker.classList.contains("date-picker") && start.value && end.value && end.value < start.value) {
        showTranslatedText(form.querySelector("#landing-date-error"), "dateInvalid");
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
    updateLanguage() {
      renderCalendar();
      updateSummary();
    },
    setDestinations(families) {
      values = [...new Set(families.flatMap((family) => [family.destination, family.region]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
      if (!suggestions.hidden) showSuggestions();
    },
    setTripDestinations(destinations) {
      values = destinations.map((item) => item.label).sort((a, b) => a.localeCompare(b, "de"));
      if (!suggestions.hidden) showSuggestions();
    },
    setTrip(trip) {
      childAgeList.innerHTML = childEntry(1, true);
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
  cleanupPage();
  cleanupPage = () => {};
  updatePageLanguage = () => {};
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
  app.innerHTML = `${header()}${page}${footer()}${["/", "/search", "/trips"].includes(path) ? tripDialogsMarkup() : ""}`;
  updateAuthNavigation();
  translateElements(app, language);
  let resolveDetail = () => null;
  let hasContacted = () => false;
  let markContacted = () => {};
  let detailContactState = () => ({ checking: false, error: false });
  const detailsDialog = document.querySelector("#trip-details-dialog");
  const detailsContent = document.querySelector("#trip-details-content");
  const contactDialog = document.querySelector("#contact-dialog");
  const contactForm = document.querySelector("#contact-form");
  const contactStatus = document.querySelector("#contact-form-status");
  let selectedDetail = null;
  let selectedFamily = null;

  function renderDetails() {
    if (!selectedDetail || !detailsDialog.open) return;
    const { trip, kind } = selectedDetail;
    const personalState = detailContactState();
    const checking = selectedDetail.checking || (kind === "public" && personalState.checking);
    const contactError = selectedDetail.contactError || (kind === "public" && personalState.error);
    const location = [trip.region, trip.destination, trip.country].filter(Boolean).join(", ");
    const children = (trip.children ?? []).map((child) =>
      `${translate(language, "yearCount", { count: child.age })}${child.gender ? ` (${translateChoice(language, child.gender)})` : ""}`).join(", ");
    const languages = (trip.languages ?? []).map((value) => translateChoice(language, value)).join(", ");
    const interests = (trip.interests ?? []).map((value) => translateChoice(language, value)).join(", ");
    const start = trip.start_date ?? trip.start;
    const end = trip.end_date ?? trip.end;
    releaseTripPhotos(detailsContent);
    detailsContent.innerHTML = `
      <div class="trip-dialog-heading">
        <h2 id="trip-details-title">${translate(language, "detailsTitle")}</h2>
        <button type="button" class="trip-dialog-close" data-details-close aria-label="${translate(language, "closeDialog")}">${icon("x-lg")}</button>
      </div>
      <figure class="destination-photo trip-details-photo">${photoMarkup({ ...trip, destinationId: trip.locationData?.destinationId }, "trip-details-image")}</figure>
      <h3 class="trip-details-destination">${escapeHTML(trip.destination)}</h3>
      <dl class="trip-details-facts">
        <div><dt>${translate(language, "destination")}</dt><dd>${escapeHTML(location)}</dd></div>
        ${kind === "own" && trip.legacyRegion ? `<div><dt>${translate(language, "previousRegionLabel")}</dt><dd>${escapeHTML(trip.legacyRegion)}</dd></div>` : ""}
        ${trip.accommodation ? `<div><dt>${translate(language, "accommodation")}</dt><dd>${escapeHTML(trip.accommodation)}</dd></div>` : ""}
        <div><dt>${translate(language, "travelDates")}</dt><dd>${escapeHTML(tripDateRange(start, end))}</dd></div>
        <div><dt>${translate(language, "childrenLabel")}</dt><dd>${escapeHTML(children || translate(language, "noChildren"))}</dd></div>
        <div><dt>${translate(language, "spokenLanguage")}</dt><dd>${escapeHTML(languages || translate(language, "noLanguages"))}</dd></div>
        ${interests ? `<div><dt>${translate(language, "interests")}</dt><dd>${escapeHTML(interests)}</dd></div>` : ""}
        ${kind === "own" ? `<div><dt>${translate(language, "visibleToOthers")}</dt><dd>${translate(language, trip.visible ? "visibilityOn" : "visibilityOff")}</dd></div>` : ""}
      </dl>
      <div class="trip-details-description"><h3>${translate(language, "descriptionLabel")}</h3><p>${escapeHTML(trip.description?.trim() || translate(language, "noDescription"))}</p></div>
      <p class="trip-details-status" role="alert"${contactError ? "" : " hidden"}>${contactError ? translate(language, "personalLoadFailed") : ""}</p>
      ${kind === "own" ? "" : kind === "contacted" || hasContacted(trip.trip_reference)
        ? `<p class="contacted-label" role="status">${translate(language, "contacted")}</p>`
        : `<div class="trip-dialog-actions"><button type="button" class="btn btn-primary" data-details-contact${checking || contactError ? " disabled" : ""}>${icon("chat-dots")} ${translate(language, checking ? "contactChecking" : "contactRequest")}</button></div>`}`;
    hydrateTripPhotos(getSupabase(), detailsContent);
  }

  async function startContact(family, button) {
    button.disabled = true;
    try {
      const { data, error } = await getSupabase().auth.getUser();
      if (error && error.name !== "AuthSessionMissingError") throw error;
      if (!button.isConnected) return;
      if (!data.user) { navigate("/login"); return; }
      selectedFamily = family;
      contactForm.reset();
      contactForm.elements.namedItem("message").value = translate(language, "defaultMessage", {
        dates: tripDateRange(family.start_date, family.end_date),
        destination: family.destination,
      });
      contactStatus.hidden = true;
      if (detailsDialog.open) detailsDialog.close();
      contactDialog.showModal();
      contactForm.elements.namedItem("message").focus();
    } catch (error) {
      console.error("Kontaktformular konnte nicht geöffnet werden:", error);
      const status = detailsDialog.open ? detailsContent.querySelector(".trip-details-status") : document.querySelector("#personal-results-error");
      if (status) { showTranslatedText(status, "contactFailed"); status.hidden = false; }
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  if (detailsDialog) {
    const handleDetailsClick = async (event) => {
      const open = event.target.closest("[data-trip-details]");
      if (open) {
        const trip = resolveDetail(open.dataset.tripDetails, open.dataset.tripKind);
        if (!trip) {
          window.alert(translate(language, "detailsUnavailable"));
          return;
        }
        const detail = { trip, kind: open.dataset.tripKind, checking: path === "/" };
        selectedDetail = detail;
        detailsDialog.showModal();
        renderDetails();
        if (detail.checking) {
          try {
            const { data, error } = await getSupabase().auth.getUser();
            if (error && error.name !== "AuthSessionMissingError") throw error;
            if (data.user) {
              const rows = await fetchPersonalReferences(getSupabase(), "my_contacted_families");
              if (selectedDetail === detail && detailsDialog.open
                && rows.some((row) => row.trip_reference === trip.trip_reference)) markContacted(trip.trip_reference);
            }
          } catch (error) {
            console.error("Kontaktstatus konnte nicht geladen werden:", error);
            detail.contactError = true;
          } finally {
            detail.checking = false;
            if (selectedDetail === detail && detailsDialog.open) renderDetails();
          }
        }
      } else if (event.target.closest("[data-details-close]")) {
        detailsDialog.close();
      } else if (event.target.closest("[data-details-contact]") && selectedDetail) {
        startContact(selectedDetail.trip, event.target.closest("[data-details-contact]"));
      }
    };
    app.querySelector("main").addEventListener("click", handleDetailsClick);
    detailsDialog.addEventListener("click", handleDetailsClick);
    detailsDialog.addEventListener("close", () => {
      releaseTripPhotos(detailsContent);
      detailsContent.innerHTML = "";
      selectedDetail = null;
    });
    contactDialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-contact-close]")) contactDialog.close();
    });
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!selectedFamily || !contactForm.reportValidity()) return;
      const message = contactForm.elements.namedItem("message").value.trim();
      if (!message) {
        showTranslatedText(contactStatus, "enterMessage");
        contactStatus.hidden = false;
        return;
      }
      const submit = contactForm.querySelector('button[type="submit"]');
      submit.disabled = true;
      const tripReference = selectedFamily.trip_reference;
      showTranslatedText(contactStatus, "savingRequest");
      contactStatus.hidden = false;
      try {
        const sent = await requestFamilyContact(getSupabase(), tripReference, message,
          new FormData(contactForm).getAll("interest").map(String));
        if (!contactForm.isConnected) return;
        if (!sent) { contactDialog.close(); navigate("/login"); return; }
        markContacted(tripReference);
        if (contactDialog.open && selectedFamily?.trip_reference === tripReference) contactDialog.close();
      } catch (error) {
        console.error("Kontaktanfrage fehlgeschlagen:", error);
        if (contactForm.isConnected) {
          showTranslatedText(contactStatus, error.code === "23505" ? "contactDuplicate" : error.code === "42501" ? "contactUnavailable" : "contactFailed");
        }
      } finally {
        if (contactForm.isConnected) submit.disabled = false;
      }
    });
  }

  const searchFormElement = document.querySelector("#trip-search-form");
  const searchControls = searchFormElement ? setupLandingSearch(searchFormElement) : null;

  if (path === "/") {
    const grid = document.querySelector(".planned-trips-grid");
    const cta = grid.querySelector(".planned-trips-cta");
    let plannedTrips = null;
    const landingContacted = new Set();
    hasContacted = (id) => landingContacted.has(id);
    markContacted = (id) => { landingContacted.add(id); };
    resolveDetail = (id, kind) => kind === "public" ? plannedTrips?.find((trip) => trip.trip_reference === id) : null;
    let requestId = 0;
    const renderPlannedTrips = () => {
      if (!grid.isConnected || !plannedTrips) return;
      releaseTripPhotos(grid);
      grid.querySelectorAll(".planned-trip-card, .planned-trips-message").forEach((item) => item.remove());
      if (!plannedTrips.length) {
        cta.insertAdjacentHTML("beforebegin", '<p class="planned-trips-message" role="status">Aktuell sind keine bevorstehenden Reisen für die Familiensuche freigegeben.</p>');
        return;
      }
      cta.insertAdjacentHTML("beforebegin", plannedTrips.map((trip) => `
        <article class="planned-trip-card">
          <figure class="destination-photo planned-trip-photo">${photoMarkup(trip, "planned-trip-image")}</figure>
          <div class="planned-trip-content">
            <h3>${escapeHTML(trip.destination)}</h3>
            <p class="planned-trip-date">${icon("calendar3")}<span>${escapeHTML(tripDateRange(trip.start_date, trip.end_date))}</span></p>
            <div class="planned-trip-children">
              ${trip.children.map((child) => `
                <span class="planned-trip-child">
                  ${icon(child.gender === "Mädchen" ? "gender-female" : child.gender === "Junge" ? "gender-male" : "person")}
                  <span>${child.gender ? `${escapeHTML(translateChoice(language, child.gender))} · ` : ""}${escapeHTML(translate(language, "yearsShort", { age: child.age }))}</span>
                </span>`).join("")}
            </div>
            ${tripDetailsMarkup(trip)}
          </div>
        </article>`).join(""));
      hydrateTripPhotos(getSupabase(), grid);
    };
    updatePageLanguage = () => { searchControls?.updateLanguage(); renderPlannedTrips(); };
    const loadTrips = async () => {
      const currentRequest = ++requestId;
      if (detailsDialog.open) detailsDialog.close();
      if (contactDialog.open) contactDialog.close();
      landingContacted.clear();
      try {
        const trips = await fetchPlannedTrips(getSupabase(), localDateString());
        if (!grid.isConnected || currentRequest !== requestId) return;
        plannedTrips = trips;
        renderPlannedTrips();
      } catch (error) {
        if (!grid.isConnected || currentRequest !== requestId) return;
        console.error("Geplante Reisen konnten nicht geladen werden:", error);
        plannedTrips = null;
        grid.querySelectorAll(".planned-trip-card, .planned-trips-message").forEach((item) => item.remove());
        cta.insertAdjacentHTML("beforebegin", '<p class="planned-trips-message" role="alert">Die Reisen konnten nicht geladen werden. Bitte versuche es später erneut.</p>');
      }
    };
    document.addEventListener("landing-auth-changed", loadTrips);
    cleanupPage = () => { document.removeEventListener("landing-auth-changed", loadTrips); releaseTripPhotos(grid); };
    loadTrips();
    loadDestinationCatalog().then(() => {
      if (!grid.isConnected) return;
      searchControls.setTripDestinations(destinationSuggestions(destinationCatalog));
      renderPlannedTrips();
    }).catch((error) => console.error("Reisezielbilder konnten nicht geladen werden:", error));
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
    const results = document.querySelector("#family-results");
    const pagination = document.querySelector("#family-pagination");
    const count = document.querySelector("#results-count");
    const errorMessage = document.querySelector("#family-results-error");
    const personalError = document.querySelector("#personal-results-error");
    const empty = document.querySelector("#empty-results");
    let pageNumber = 1;
    let personalReady = false;
    let personalFailed = false;
    let signedIn = false;
    let favorites = new Set();
    let contacted = new Set();
    let loadedFamilies = null;
    resolveDetail = (id, kind) => kind === "public" ? loadedFamilies?.find((family) => family.trip_reference === id) : null;
    hasContacted = (id) => contacted.has(id);
    detailContactState = () => ({ checking: !personalReady && !personalFailed, error: personalFailed });
    markContacted = (id) => { contacted.add(id); renderFamilies(); };
    const renderFamilies = () => {
      if (!loadedFamilies) return;
      const matches = filterFamilies(loadedFamilies, new URLSearchParams(location.search));
      if (document.querySelector("#sort-results").value === "soonest") {
        matches.sort((first, second) => first.start_date.localeCompare(second.start_date));
      }
      const page = paginate(matches, pageNumber);
      pageNumber = page.current;
      releaseTripPhotos(results);
      results.innerHTML = page.items.map((family) => familyCard(family, favorites, contacted, personalReady)).join("");
      hydrateTripPhotos(getSupabase(), results);
      pagination.innerHTML = paginationMarkup(page.current, page.pages, translate(language, "familyPages"), language);
      delete count.dataset.i18n;
      count.textContent = translate(language, matches.length === 1 ? "resultsOne" : "resultsOther", { count: matches.length });
      empty.classList.toggle("d-none", matches.length > 0);
    };
    updatePageLanguage = () => { searchControls?.updateLanguage(); renderFamilies(); };
    (async () => {
      try {
        const { data, error } = await getSupabase().auth.getUser();
        if (error && error.name !== "AuthSessionMissingError") throw error;
        if (!results.isConnected) return;
        signedIn = Boolean(data.user);
        if (signedIn) {
          const [favoriteRows, contactRows] = await Promise.all([
            fetchPersonalReferences(getSupabase(), "my_family_favorites"),
            fetchPersonalReferences(getSupabase(), "my_contacted_families"),
          ]);
          if (!results.isConnected) return;
          favorites = new Set(favoriteRows.map((row) => row.trip_reference));
          contacted = new Set(contactRows.map((row) => row.trip_reference));
        }
        personalReady = true;
        renderFamilies();
        renderDetails();
      } catch (error) {
        console.error("Persönliche Markierungen konnten nicht geladen werden:", error);
        if (!results.isConnected) return;
        personalFailed = true;
        showTranslatedText(personalError, "personalLoadFailed");
        personalError.hidden = false;
        renderDetails();
      }
    })();
    showTranslatedText(count, "loadingFamilies");
    loadPublicFamilies().then((families) => {
      if (!results.isConnected) return;
      loadedFamilies = families;
      searchControls.setDestinations(families);
      renderFamilies();
    }).catch((error) => {
      if (!results.isConnected) return;
      console.error("Familien konnten nicht geladen werden:", error);
      count.textContent = "";
      delete count.dataset.i18n;
      showTranslatedText(errorMessage, "familiesLoadFailed");
      errorMessage.hidden = false;
    });
    loadDestinationCatalog().then(() => {
      if (results.isConnected) renderFamilies();
    }).catch((error) => console.error("Reisezielbilder konnten nicht geladen werden:", error));
    searchFormElement.addEventListener("family-search-update", () => { pageNumber = 1; renderFamilies(); });
    searchFormElement.addEventListener("reset", (event) => {
      event.preventDefault();
      navigate("/search");
    });
    document.querySelector("#family-results").addEventListener("click", async (event) => {
      const contact = event.target.closest("[data-contact]");
      if (contact) {
        const family = loadedFamilies?.find((item) => item.trip_reference === contact.dataset.contact);
        if (family) startContact(family, contact);
        return;
      }
      const button = event.target.closest("[data-favorite]");
      if (!button) return;
      if (!signedIn) { navigate("/login"); return; }
      button.disabled = true;
      const familyId = button.dataset.favorite;
      const favorite = !favorites.has(familyId);
      try {
        await setFamilyFavorite(getSupabase(), familyId, favorite);
        if (!results.isConnected) return;
        if (favorite) favorites.add(familyId); else favorites.delete(familyId);
        renderFamilies();
      } catch (error) {
        console.error("Favorit konnte nicht gespeichert werden:", error);
        showTranslatedText(personalError, "favoriteFailed");
        personalError.hidden = false;
        if (button.isConnected) button.disabled = false;
      }
    });
    pagination.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (button && !button.disabled) { pageNumber = Number(button.dataset.page); renderFamilies(); }
    });
    document.querySelector("#sort-results").addEventListener("change", () => { pageNumber = 1; renderFamilies(); });
    cleanupPage = () => { releaseTripPhotos(results); };
  }

  if (path === "/trips") {
    const list = document.querySelector("#my-trips-list");
    const tripsPagination = document.querySelector("#trips-pagination");
    const contactedList = document.querySelector("#contacted-list");
    const contactedPagination = document.querySelector("#contacted-pagination");
    const receivedList = document.querySelector("#received-list");
    const receivedPagination = document.querySelector("#received-pagination");
    const dialog = document.querySelector("#trip-dialog");
    const visibilityElement = document.querySelector("#trip-visibility-modal");
    const visibilityModal = new Modal(visibilityElement);
    const visibilityTitle = visibilityElement.querySelector("#trip-visibility-title");
    const visibilityDescription = visibilityElement.querySelector("#trip-visibility-description");
    const visibilityConfirm = visibilityElement.querySelector("[data-visibility-confirm]");
    const form = document.querySelector("#trip-form");
    const page = document.querySelector(".my-trips-page");
    const createButtons = page.querySelectorAll('[data-trip-action="new"]');
    const destinationInput = form.elements.namedItem("destination");
    const startInput = form.elements.namedItem("start");
    const endInput = form.elements.namedItem("end");
    const tripSearch = setupLandingSearch(form, { fromQuery: false, trip: true });
    let myTrips = [];
    let tripsLoaded = false;
    let tripPage = 1;
    let contactPage = 1;
    let contactedFamilies = [];
    resolveDetail = (id, kind) => kind === "own"
      ? myTrips.find((trip) => trip.id === id)
      : kind === "contacted" ? contactedFamilies.find((family) => family.trip_reference === id && family.destination !== null) : null;
    let contactedLoaded = false;
    let receivedContacts = [];
    let receivedLoaded = false;
    let receivedPage = 1;
    let destinations = [];
    let userId = null;
    let pendingVisibility = null;
    createButtons.forEach((button) => { button.disabled = true; });

    visibilityElement.addEventListener("shown.bs.modal", () => {
      visibilityElement.querySelector("[data-visibility-cancel]").focus();
    });
    visibilityElement.addEventListener("hidden.bs.modal", () => {
      const input = pendingVisibility?.input;
      pendingVisibility = null;
      if (input?.isConnected) {
        input.disabled = false;
        input.focus();
      }
    });
    visibilityElement.addEventListener("click", (event) => {
      if (event.target.closest("[data-visibility-cancel]")) visibilityModal.hide();
    });
    cleanupPage = () => {
      visibilityModal.hide();
      visibilityModal.dispose();
      releaseTripPhotos(list);
      releaseTripPhotos(contactedList);
    };

    const showListError = (text) => {
      list.innerHTML = `<p role="alert">${escapeHTML(text)}</p>`;
      tripsPagination.innerHTML = "";
    };
    const renderTrips = () => {
      const page = paginate(myTrips, tripPage);
      tripPage = page.current;
      releaseTripPhotos(list);
      list.innerHTML = renderMyTrips(page.items);
      hydrateTripPhotos(getSupabase(), list);
      tripsPagination.innerHTML = paginationMarkup(page.current, page.pages, translate(language, "tripPages"), language);
    };
    const renderContacted = () => {
      const page = paginate(contactedFamilies, contactPage);
      contactPage = page.current;
      releaseTripPhotos(contactedList);
      contactedList.innerHTML = page.items.length ? page.items.map((family) => {
        const available = family.destination !== null;
        const location = [family.region, family.destination, family.country].filter(Boolean).join(", ");
        const children = (family.children ?? []).map((child) =>
          `${translate(language, "yearCount", { count: child.age })}${child.gender ? ` (${translateChoice(language, child.gender)})` : ""}`).join(", ");
        const contactedDate = new Intl.DateTimeFormat(localeForLanguage(language), {
          day: "numeric", month: "long", year: "numeric",
        }).format(new Date(family.contacted_at));
        return `<article class="contacted-family">
          <figure class="destination-photo contacted-family-photo">${photoMarkup(family, "")}</figure>
          <div class="contacted-family-details">
            <strong>${translate(language, "family")}${available ? ` – ${escapeHTML(family.destination)}` : ` – ${translate(language, "notPublic")}`}</strong>
            ${available ? `
              <p>${icon("geo-alt-fill")} ${escapeHTML(location)}</p>
              <p>${icon("calendar3")} ${escapeHTML(tripDateRange(family.start_date, family.end_date))}</p>
              <p>${icon("people-fill")} ${family.children.length ? `${translate(language, family.children.length === 1 ? "childCountOne" : "childCountOther", { count: family.children.length })}: ${escapeHTML(children)}` : translate(language, "noChildren")}</p>
              <p>${icon("globe2")} ${escapeHTML(family.languages?.map((value) => translateChoice(language, value)).join(", ") || translate(language, "noLanguages"))}</p>` : ""}
            ${available ? tripDetailsMarkup(family, "contacted") : ""}
          </div>
          <span class="contacted-label">${escapeHTML(translate(language, "contactedOn", { date: contactedDate }))}</span>
        </article>`;
      }).join("") : `<p>${translate(language, "noContacts")}</p>`;
      contactedPagination.innerHTML = paginationMarkup(page.current, page.pages, translate(language, "contactedPages"), language);
      hydrateTripPhotos(getSupabase(), contactedList);
    };
    const renderReceived = () => {
      const page = paginate(receivedContacts, receivedPage);
      receivedPage = page.current;
      receivedList.innerHTML = page.items.length ? page.items.map((request) => {
        const trip = myTrips.find((item) => item.id === request.trip_id);
        return `<article class="received-contact">
          <strong>${escapeHTML(translate(language, "requestFor", { trip: trip?.destination ?? translate(language, "yourTrip") }))}</strong>
          <p>${escapeHTML(request.message ?? translate(language, "noRequestMessage"))}</p>
          ${request.interests.length ? `<p>${translate(language, "interests")} ${escapeHTML(request.interests.map((value) => translateChoice(language, value)).join(", "))}</p>` : ""}
        </article>`;
      }).join("") : `<p>${translate(language, "noRequests")}</p>`;
      receivedPagination.innerHTML = paginationMarkup(page.current, page.pages, translate(language, "receivedPages"), language);
    };
    updatePageLanguage = () => {
      tripSearch.updateLanguage();
      if (tripsLoaded) renderTrips();
      if (contactedLoaded) renderContacted();
      if (receivedLoaded) renderReceived();
    };
    async function refreshTrips() {
      const trips = await fetchOwnTrips(getSupabase(), userId);
      if (!list.isConnected) return;
      myTrips = trips;
      tripsLoaded = true;
      renderTrips();
      if (receivedLoaded) {
        receivedContacts = receivedContacts.filter((request) => myTrips.some((trip) => trip.id === request.trip_id));
        renderReceived();
      }
    }
    (async () => {
      try {
        const { data, error } = await getSupabase().auth.getUser();
        if (error && error.name !== "AuthSessionMissingError") throw error;
        if (!list.isConnected) return;
        if (!data.user) {
          list.innerHTML = '<div class="my-trips-empty"><h2 data-i18n="signInRequired"></h2><p data-i18n="privateTrips"></p><a class="btn btn-primary" href="/login" data-i18n="login"></a></div>';
          translateElements(list, language);
          contactedList.closest("section").hidden = true;
          receivedList.closest("section").hidden = true;
          return;
        }
        userId = data.user.id;
        await refreshTrips();
        try {
          contactedFamilies = await fetchPersonalReferences(getSupabase(), "my_contacted_family_details_v2");
          if (!list.isConnected) return;
          contactedLoaded = true;
          renderContacted();
        } catch (error) {
          console.error("Kontaktierte Familien konnten nicht geladen werden:", error);
          if (!list.isConnected) return;
          contactedList.innerHTML = '<p role="alert" data-i18n="contactsLoadFailed"></p>';
          translateElements(contactedList, language);
        }
        try {
          receivedContacts = await fetchReceivedContacts(getSupabase(), userId);
          if (!list.isConnected) return;
          receivedLoaded = true;
          renderReceived();
        } catch (error) {
          console.error("Eingegangene Kontaktanfragen konnten nicht geladen werden:", error);
          if (!list.isConnected) return;
          receivedList.innerHTML = '<p role="alert" data-i18n="receivedLoadFailed"></p>';
          translateElements(receivedList, language);
        }
        try {
          destinations = destinationSuggestions(await loadDestinationCatalog());
          if (!list.isConnected) return;
          tripSearch.setTripDestinations(destinations);
          renderTrips();
          if (contactedLoaded) renderContacted();
        } catch (error) {
          console.error("Reisezielvorschläge konnten nicht geladen werden:", error);
          if (!list.isConnected) return;
          const notice = form.querySelector("#trip-destinations-notice");
          showTranslatedText(notice, "destinationUnavailable");
          notice.hidden = false;
        }
        if (list.isConnected) createButtons.forEach((button) => { button.disabled = false; });
      } catch (error) {
        console.error("Reisen konnten nicht geladen werden:", error);
        if (list.isConnected) showListError(translate(language, "tripsLoadFailed"));
      }
    })();

    page.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-trip-action]");
      if (!button) return;
      const action = button.dataset.tripAction;
      if (action === "close") {
        dialog.close();
        return;
      }
      if (action === "new" || action === "edit") {
        if (!userId) return;
        const trip = action === "edit"
          ? myTrips.find((item) => item.id === button.dataset.tripId)
          : null;
        if (action === "edit" && !trip) return;
        form.reset();
        form.elements.namedItem("id").value = trip?.id ?? "";
        form.elements.namedItem("destination").value = trip?.destination ?? "";
        form.elements.namedItem("accommodation").value = trip?.accommodation ?? "";
        form.elements.namedItem("description").value = trip?.description ?? "";
        form.querySelectorAll('input[name="tripInterest"]').forEach((input) => { input.checked = trip?.interests.includes(input.value) ?? false; });
        form.elements.namedItem("customInterests").value = (trip?.interests ?? []).filter((interest) => !tripInterests.includes(interest)).join(", ");
        form.querySelector("#trip-photo-remove-label").hidden = !trip?.photo_path;
        form.elements.namedItem("start").value = trip?.start ?? "";
        form.elements.namedItem("end").value = trip?.end ?? "";
        tripSearch.setTrip(trip);
        showTranslatedText(document.querySelector("#trip-dialog-title"), trip ? "editTrip" : "newTrip");
        document.querySelector("#trip-form-message").hidden = true;
        destinationInput.setCustomValidity("");
        endInput.setCustomValidity("");
        dialog.showModal();
        destinationInput.focus();
        return;
      }
      if (action === "remove") {
        if (!window.confirm(translate(language, "removeConfirm"))) return;
        const trip = myTrips.find((item) => item.id === button.dataset.tripId);
        button.disabled = true;
        try {
          await removeOwnTrip(getSupabase(), userId, button.dataset.tripId);
          if (trip?.photo_path) {
            try { await removeTripPhoto(getSupabase(), trip.photo_path); }
            catch (error) {
              console.error("Reisebild konnte nicht gelöscht werden:", error);
              window.alert(translate(language, "removePhotoFailed"));
            }
          }
          await refreshTrips();
        } catch (error) {
          console.error("Reise konnte nicht entfernt werden:", error);
          if (list.isConnected) {
            button.disabled = false;
            showListError(translate(language, "removeTripFailed"));
          }
        }
      }
    });

    tripsPagination.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (button && !button.disabled) { tripPage = Number(button.dataset.page); renderTrips(); }
    });
    contactedPagination.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (button && !button.disabled) { contactPage = Number(button.dataset.page); renderContacted(); }
    });
    receivedPagination.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (button && !button.disabled) { receivedPage = Number(button.dataset.page); renderReceived(); }
    });

    async function saveVisibility(trip, visible, input) {
      input.disabled = true;
      try {
        await setOwnTripVisibility(getSupabase(), trip.id, visible);
        trip.visible = visible;
        trip.detailsShared = visible;
        if (list.isConnected) renderTrips();
      } catch (error) {
        console.error("Sichtbarkeit konnte nicht gespeichert werden:", error);
        if (input.isConnected) input.checked = trip.visible;
        if (list.isConnected) window.alert(translate(language, "visibilityFailed"));
      } finally {
        if (input.isConnected) input.disabled = false;
      }
    }

    visibilityConfirm.addEventListener("click", () => {
      if (!pendingVisibility) return;
      const { trip, visible, input } = pendingVisibility;
      visibilityModal.hide();
      saveVisibility(trip, visible, input);
    });

    list.addEventListener("change", (event) => {
      const input = event.target.closest("[data-trip-visibility]");
      if (!input) return;
      const trip = myTrips.find((item) => item.id === input.dataset.tripVisibility);
      if (!trip) return;
      const visible = input.checked;
      input.checked = trip.visible;
      if (visible || (trip.visible && !trip.detailsShared)) {
        pendingVisibility = { trip, visible, input };
        input.disabled = true;
        showTranslatedText(visibilityTitle, visible ? "shareTitle" : "unshareTitle");
        visibilityDescription.innerHTML = visible
          ? `<p data-i18n="shareIntro"></p>
             <ul><li data-i18n="shareDestination"></li><li data-i18n="shareFamily"></li><li data-i18n="shareDetails"></li></ul>
             <p class="trip-visibility-privacy">${icon("shield-check")} <span data-i18n="shareRevoke"></span></p>`
          : `<p data-i18n="unshareIntro"></p><p data-i18n="unshareQuestion"></p>`;
        translateElements(visibilityDescription, language);
        showTranslatedText(visibilityConfirm, visible ? "shareAction" : "unshareTitle");
        visibilityModal.show();
        return;
      }
      saveVisibility(trip, visible, input);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      endInput.setCustomValidity(
        startInput.value && endInput.value && endInput.value < startInput.value
          ? translate(language, "dateInvalid")
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
        showTranslatedText(message, "childrenRequired");
        message.hidden = false;
        form.querySelector(".child-picker").open = true;
        form.querySelector('input[name="childAge"]')?.focus();
        return;
      }
      if (!languages.length) {
        showTranslatedText(message, "languageRequired");
        message.hidden = false;
        form.querySelector(".language-picker").open = true;
        form.querySelector('input[name="language"]').focus();
        return;
      }
      const id = formData.get("id").toString();
      const existingTrip = myTrips.find((trip) => trip.id === id);
      if (id && !existingTrip) {
        showTranslatedText(message, "tripNotFound");
        message.hidden = false;
        return;
      }
      const destination = formData.get("destination").toString().trim();
      const accommodation = formData.get("accommodation").toString().trim();
      const interests = [...new Set([
        ...formData.getAll("tripInterest").map(String),
        ...formData.get("customInterests").toString().split(",").map((value) => value.trim()).filter(Boolean),
      ])];
      if (interests.length > 20 || interests.some((interest) => interest.length > 50 || /[\u0000-\u001f\u007f]/.test(interest))) {
        showTranslatedText(message, "interestsInvalid");
        message.hidden = false;
        form.elements.namedItem("customInterests").focus();
        return;
      }
      if (!destination) {
        showTranslatedText(message, "destinationRequired");
        message.hidden = false;
        return;
      }
      const resolved = existingTrip && destination === existingTrip.destination
        ? { label: destination, destinationId: existingTrip.locationData.destinationId }
        : resolveDestination(destination, destinations);
      const updatedTrip = {
        id: existingTrip?.id,
        existing: existingTrip,
        destination: resolved.label,
        destinationId: resolved.destinationId,
        accommodation,
        description: formData.get("description").toString().trim(),
        interests,
        photo_path: existingTrip?.photo_path ?? null,
        start: formData.get("start").toString(),
        end: formData.get("end").toString(),
        children: children.map((child) => ({ ...child, age: Number(child.age) })),
        languages,
      };

      if (existingTrip?.visible && existingTrip.detailsShared && !window.confirm(translate(language, "publicChangeConfirm"))) return;
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      showTranslatedText(message, "savingTrip");
      message.hidden = false;
      let uploadedPhoto = null;
      let saved = false;
      try {
        const file = form.elements.namedItem("photo").files[0];
        if (file) {
          uploadedPhoto = await uploadTripPhoto(getSupabase(), file);
          updatedTrip.photo_path = uploadedPhoto;
        } else if (formData.has("removePhoto")) {
          updatedTrip.photo_path = null;
        }
        await saveOwnTrip(getSupabase(), userId, updatedTrip);
        saved = true;
        if (existingTrip?.photo_path && existingTrip.photo_path !== updatedTrip.photo_path) {
          try { await removeTripPhoto(getSupabase(), existingTrip.photo_path); }
          catch (error) {
            console.error("Vorheriges Reisebild konnte nicht entfernt werden:", error);
            window.alert(translate(language, "oldPhotoFailed"));
          }
        }
        dialog.close();
        await refreshTrips();
      } catch (error) {
        console.error("Reise konnte nicht gespeichert oder geladen werden:", error);
        if (uploadedPhoto && !saved) {
          try { await removeTripPhoto(getSupabase(), uploadedPhoto); }
          catch (cleanupError) {
            console.error("Hochgeladenes Reisebild konnte nicht bereinigt werden:", cleanupError);
            window.alert(translate(language, "cleanupPhotoFailed"));
          }
        }
        if (dialog.open) {
          delete message.dataset.i18n;
          message.textContent = error instanceof Error && /JPEG|Bild/.test(error.message) && language === "de"
            ? error.message : translate(language, "saveTripFailed");
          message.hidden = false;
        } else if (list.isConnected) {
          showListError(translate(language, "refreshTripFailed"));
        }
      } finally {
        submit.disabled = false;
      }
    });
  }

  document.querySelector("#trip-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const start = form.elements.namedItem("start");
    const end = form.elements.namedItem("end");
    end.setCustomValidity(
      start.value && end.value && end.value < start.value
        ? translate(language, "dateInvalid")
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
    const url = `/search${params.size ? `?${params}` : ""}`;
    if (location.pathname === "/search") {
      history.pushState({}, "", url);
      form.dispatchEvent(new Event("family-search-update"));
    } else {
      navigate(url);
    }
  });

  document.querySelector("#auth-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    const isRegistration = path === "/register";
    const data = new FormData(form);
    const name = isRegistration ? data.get("name").trim() : "";
    if (isRegistration && !name) {
      showAuthKey("enterName");
      return;
    }
    submit.disabled = true;
    showAuthKey(isRegistration ? "creatingAccount" : "loggingIn");
    try {
      const client = getSupabase();
      setAuthPersistence(isRegistration || form.querySelector("#remember").checked);
      const credentials = { email: data.get("email").trim(), password: data.get("password") };
      const result = isRegistration
        ? await register(client, { ...credentials, name, redirectTo: `${location.origin}/login` })
        : await login(client, credentials);
      if (!result.session) {
        if (!isRegistration) throw new Error("Keine Sitzung erhalten.");
        form.reset();
        showAuthKey("registrationNotice");
        return;
      }
      try {
        await ensureProfile(client, result.user);
      } catch (error) {
        console.error("Profil konnte nicht eingerichtet werden:", error);
        showAuthKey("profileFailed");
        return;
      }
      if (form.isConnected) navigate("/search");
    } catch (error) {
      console.error("Authentifizierung fehlgeschlagen:", error);
      if (form.isConnected) showAuthKey(authErrorKey(error));
    } finally {
      if (form.isConnected) submit.disabled = false;
    }
  });

  document.querySelector('[data-action="reset-password"]')?.addEventListener("click", (event) => {
    event.preventDefault();
    const notice = document.querySelector("#auth-notice");
    showTranslatedText(notice, "resetUnavailable");
    notice.hidden = false;
  });

  if (detailsDialog) {
    const updateExistingPage = updatePageLanguage;
    updatePageLanguage = () => { updateExistingPage(); renderDetails(); };
    const cleanupExistingPage = cleanupPage;
    cleanupPage = () => {
      releaseTripPhotos(detailsContent);
      cleanupExistingPage();
    };
  }
}

document.addEventListener("change", (event) => {
  if (event.target.id !== "site-language") return;
  const selected = supportedLanguage(event.target.value);
  if (!selected) return;
  language = selected;
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch (error) {
    console.warn("Die Sprachauswahl konnte nicht gespeichert werden:", error);
  }
  translateElements(app, language);
  updatePageLanguage();
});

document.addEventListener("click", (event) => {
  const signOut = event.target.closest('[data-action="sign-out"]');
  if (signOut) {
    signOut.disabled = true;
    getSupabase().auth.signOut().then(({ error }) => {
      if (error) throw error;
      currentSession = null;
      updateAuthNavigation();
      if (["/login", "/register", "/search", "/trips"].includes(location.pathname)) mountPage();
      if (location.pathname === "/") document.dispatchEvent(new Event("landing-auth-changed"));
    }).catch((error) => {
      console.error("Abmeldung fehlgeschlagen:", error);
      const message = document.querySelector("#auth-navigation-error");
      showTranslatedText(message, "logoutFailed");
      message.hidden = false;
      if (signOut.isConnected) signOut.disabled = false;
    });
    return;
  }
  const searchForm = document.querySelector("#trip-search-form, #trip-form");
  if (searchForm && !event.composedPath().includes(searchForm)) closeLandingPopovers(searchForm);
  const link = event.target.closest('a[href^="/"]');
  if (!link || link.target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (document.querySelector("#trip-details-dialog[open], #contact-dialog[open]")) return;
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

app.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.hasAttribute("data-destination-photo")
    || image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  const fallback = image.dataset.photoFallback;
  delete image.dataset.photoFallback;
  if (fallback && image.src !== new URL(fallback, document.baseURI).href) {
    image.src = fallback;
    delete image.dataset.fallbackApplied;
  } else {
    image.src = destinationPlaceholder;
    image.alt = "Neutrale Platzhaltergrafik";
  }
}, true);
window.addEventListener("popstate", mountPage);
const isSignupCallback = new URLSearchParams(location.hash.slice(1)).get("type") === "signup";
mountPage();
try {
  const client = getSupabase();
  client.auth.onAuthStateChange((_event, session) => {
    const previousUser = currentSession?.user.id;
    currentSession = session;
    updateAuthNavigation();
    if ((location.pathname === "/trips" || location.pathname === "/search") && previousUser !== session?.user.id) {
      setTimeout(() => {
        if (location.pathname === "/trips" || location.pathname === "/search") mountPage();
      }, 0);
    }
    if (location.pathname === "/" && previousUser !== session?.user.id) {
      setTimeout(() => document.dispatchEvent(new Event("landing-auth-changed")), 0);
    }
  });
  client.auth.getSession().then(async ({ data, error }) => {
    if (error) throw error;
    if (!data.session || (location.pathname !== "/login" && !isSignupCallback)) return;
    try {
      await ensureProfile(client, data.session.user);
      if (location.pathname === "/login" || isSignupCallback) navigate("/search");
    } catch (profileError) {
      console.error("Profil konnte nicht eingerichtet werden:", profileError);
      const message = "Du bist angemeldet, aber dein Profil konnte nicht eingerichtet werden. Bitte melde dich erneut an oder wende dich an den Support.";
      if (document.querySelector("#auth-notice")) showAuthNotice(message);
      else {
        const notice = document.querySelector("#auth-navigation-error");
        notice.textContent = message;
        notice.hidden = false;
      }
    }
  }).catch((error) => {
    console.error("Sitzung konnte nicht geladen werden:", error);
    showAuthNotice("Deine Sitzung konnte nicht geladen werden. Bitte versuche es erneut.");
  });
} catch (error) {
  console.error("Supabase konnte nicht initialisiert werden:", error);
  showAuthNotice("Die Anmeldung ist derzeit nicht verfügbar. Bitte versuche es später erneut.");
}
