import test from "node:test";
import assert from "node:assert/strict";
import { filterFamilies } from "./family-search.js";

const families = [
  { destination: "Mallorca", country: "Spanien", region: "Alcúdia", start_date: "2027-07-10", end_date: "2027-07-20", children: [{ age: 5, gender: "Mädchen" }, { age: 8, gender: "Junge" }], languages: ["Deutsch", "Englisch"] },
  { destination: "Kreta", country: "Griechenland", region: "Chania", start_date: "2027-08-01", end_date: "2027-08-12", children: [{ age: 6, gender: "Junge" }], languages: ["Bulgarisch"] },
];

test("Ziel, überlappender Zeitraum, Alter, Geschlecht und Sprache werden kombiniert", () => {
  const params = new URLSearchParams("destination=alc%C3%BAdia&start=2027-07-19&end=2027-07-25&childAge=6&childGender=M%C3%A4dchen&language=Deutsch");
  assert.deepEqual(filterFamilies(families, params), [families[0]]);
  params.set("childGender", "Junge");
  assert.deepEqual(filterFamilies(families, params), [families[0]]);
  params.set("childAge", "3");
  assert.deepEqual(filterFamilies(families, params), []);
  params.set("childGender", "Mädchen");
  params.set("start", "2027-07-21");
  assert.deepEqual(filterFamilies(families, params), []);
});

test("Mehrere Kinder benötigen unterschiedliche Treffer; optionale Angaben bleiben optional", () => {
  assert.deepEqual(filterFamilies(families, new URLSearchParams("childAge=5&childAge=5")), []);
  assert.deepEqual(filterFamilies(families, new URLSearchParams("childAge=&childGender=Junge&childAge=5&childGender=M%C3%A4dchen")), [families[0]]);
  assert.deepEqual(filterFamilies(families, new URLSearchParams("language=Spanisch")), []);
  assert.deepEqual(filterFamilies(families, new URLSearchParams()), families);
});

test("Ziel und Land bleiben mit oder ohne Komma auffindbar", () => {
  assert.deepEqual(filterFamilies(families, new URLSearchParams("destination=Kreta%2C%20Griechenland")), [families[1]]);
});
