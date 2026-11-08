import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { formatTripDateRange, initialLanguage, localeForLanguage, supportedLanguage, translate, translateChoice } from "./i18n.js";

test("Gespeicherte Sprache hat Vorrang, Browsersprachen und Deutsch sind Fallbacks", () => {
  assert.equal(initialLanguage("bg", ["en-US"]), "bg");
  assert.equal(initialLanguage(null, ["fr-FR", "en-US"]), "en");
  assert.equal(initialLanguage(null, ["fr-FR"]), "de");
  assert.equal(supportedLanguage("BG-bg"), "bg");
  assert.equal(supportedLanguage("fr"), null);
});

test("Datumsbereiche und Vorlagen folgen der ausgewählten Sprache", () => {
  for (const language of ["de", "en", "bg"]) {
    const expected = new Intl.DateTimeFormat(localeForLanguage(language), {
      day: "numeric", month: "long", year: "numeric",
    }).formatRange(new Date("2027-07-12T12:00:00"), new Date("2027-07-22T12:00:00"));
    assert.equal(formatTripDateRange(language, "2027-07-12", "2027-07-22"), expected);
    assert.ok(translate(language, "dateFrom", { date: "123" }).includes("123"));
  }
});

test("Gespeicherte Auswahlwerte werden nur zur Anzeige übersetzt", () => {
  assert.equal(translateChoice("en", "Deutsch"), "German");
  assert.equal(translateChoice("bg", "Mädchen"), "Момиче");
  assert.equal(translateChoice("en", "Sandburgen"), "Sandcastles");
  assert.equal(translateChoice("bg", "Schwimmen"), "Плуване");
  assert.equal(translateChoice("en", "Schnorcheln"), "Schnorcheln");
  assert.equal(translateChoice("en", "Unbekannt"), "Unbekannt");
});

test("Alle drei Sprachen enthalten die übersetzten Navigationstexte", () => {
  for (const key of ["skip", "navigation", "homeLabel", "menu", "home", "search", "trips",
    "login", "register", "logout", "language", "footer", "prototype"]) {
    for (const language of ["de", "en", "bg"]) assert.ok(translate(language, key));
  }
  assert.throws(() => translate("en", "unknown"));
});

test("Statische Schlüssel in Templates und Aufrufen sind in allen Katalogen vorhanden", async () => {
  const source = await readFile(new URL("../main.js", import.meta.url), "utf8");
  const keys = new Set([
    ...[...source.matchAll(/data-i18n(?:-aria-label|-title|-placeholder|-alt)?="([A-Za-z][A-Za-z0-9]*)"/g)].map((match) => match[1]),
    ...[...source.matchAll(/translate\(language,\s*"([A-Za-z][A-Za-z0-9]*)"/g)].map((match) => match[1]),
  ]);
  for (const key of keys) {
    for (const language of ["de", "en", "bg"]) assert.ok(translate(language, key), `${language}: ${key}`);
  }
});
