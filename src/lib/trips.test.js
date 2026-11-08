import test from "node:test";
import assert from "node:assert/strict";
import { fetchOwnTrips, saveOwnTrip, removeOwnTrip, setOwnTripVisibility } from "./trips.js";

function mockClient(results) {
  const calls = [];
  return {
    calls,
    from(table) {
      const query = {
        select(value) { calls.push(["select", table, value]); return query; },
        eq(column, value) { calls.push(["eq", table, column, value]); return query; },
        order(column, options) { calls.push(["order", table, column, options]); return query; },
        range(start, end) { calls.push(["range", table, start, end]); return Promise.resolve(results[table]); },
        maybeSingle() { return Promise.resolve(results[table]); },
        single() { return Promise.resolve(results[table]); },
        insert(value) { calls.push(["insert", table, value]); return query; },
        update(value) { calls.push(["update", table, value]); return query; },
        delete() { calls.push(["delete", table]); return query; },
      };
      return query;
    },
    async rpc(name, args) { calls.push(["rpc", name, args]); return results.rpc; },
  };
}

test("Abfrage beschränkt Reisen explizit auf den Benutzer und unterstützt bestehende Reisedaten", async () => {
  const client = mockClient({
    trips: { data: [{
      id: "trip-1", start_date: "2027-07-12", end_date: "2027-07-22", is_public: true,
      destination_id: "destination-1", custom_destination: null, custom_region: null, legacy_region: null, accommodation: null, trip_languages: null, trip_children_data: null,
      destinations: { name: "Mallorca", region: "Alcúdia", country: "Spanien" },
      trip_children: [{ children: { birth_year: 2022, gender: null } }],
      trip_search_consent: { share_family_details: true },
    }], error: null },
    profiles: { data: { languages: ["Deutsch"] }, error: null },
  });
  const trips = await fetchOwnTrips(client, "user-1");
  assert.deepEqual(trips, [{
    id: "trip-1", destination: "Mallorca", country: "Spanien", region: "Alcúdia", start: "2027-07-12", end: "2027-07-22",
    accommodation: "", description: "", interests: [], photo_path: null, legacyRegion: "", locationData: { destinationId: "destination-1", customDestination: null, customRegion: null },
    children: [{ age: 5, gender: null }], languages: ["Deutsch"], visible: true, detailsShared: true,
  }]);
  assert.ok(client.calls.some((call) => call[0] === "eq" && call[1] === "trips" && call[2] === "user_id" && call[3] === "user-1"));
});

test("Eigene Reisen werden über die API-Grenze hinaus vollständig und stabil geladen", async () => {
  const calls = [];
  const row = {
    id: "trip", start_date: "2027-07-12", end_date: "2027-07-22", is_public: false,
    destination_id: null, custom_destination: "Kreta", custom_region: null,
    destinations: null, trip_children: [], trip_search_consent: null,
  };
  const client = {
    from(table) {
      const query = {
        select() { return this; }, eq() { return this; },
        order(column) { calls.push(column); return this; },
        async range(start) { return { data: start === 0 ? Array(500).fill(row) : [row], error: null }; },
        async maybeSingle() { return { data: null, error: null }; },
      };
      return query;
    },
  };
  assert.equal((await fetchOwnTrips(client, "user")).length, 501);
  assert.deepEqual(calls, ["start_date", "id", "start_date", "id"]);
});

test("Neue Reisen werden privat erstellt; Aktualisieren und Löschen sind auf Eigentümer beschränkt", async () => {
  const client = mockClient({ trips: { data: { id: "trip-1" }, error: null } });
  const trip = { destination: "Burgas", destinationId: null, accommodation: "", start: "2027-05-01", end: "2027-05-31", children: [{ age: 5, gender: "" }], languages: ["Deutsch"] };
  await saveOwnTrip(client, "user-1", trip);
  const inserted = client.calls.find((call) => call[0] === "insert")[2];
  assert.equal(inserted.user_id, "user-1");
  assert.equal(inserted.is_public, false);
  assert.equal(inserted.accommodation, null);
  assert.deepEqual(inserted.trip_children_data, [{ age: 5, gender: null }]);
  await saveOwnTrip(client, "user-1", { ...trip, id: "trip-1" });
  await removeOwnTrip(client, "user-1", "trip-1");
  assert.equal(client.calls.filter((call) => call[0] === "eq" && call[2] === "user_id" && call[3] === "user-1").length, 2);
});

test("Freitext behält nur dann das Land einer Zielreferenz, wenn beides zusammenpasst", async () => {
  const base = {
    start_date: "2027-07-12", end_date: "2027-07-22", is_public: false,
    destination_id: "destination-1", custom_region: null,
    destinations: { name: "Mallorca", country: "Spanien", region: null },
    trip_children: [], trip_search_consent: null,
  };
  const client = mockClient({
    trips: { data: [
      { ...base, id: "1", custom_destination: "mallorca" },
      { ...base, id: "2", custom_destination: "Kreta" },
      { ...base, id: "3", destination_id: null, destinations: null, custom_destination: "Berlin" },
    ], error: null },
    profiles: { data: null, error: null },
  });
  const trips = await fetchOwnTrips(client, "user-1");
  assert.deepEqual(trips.map((trip) => [trip.destination, trip.country]), [
    ["mallorca", "Spanien"], ["Kreta", ""], ["Berlin", ""],
  ]);
});

test("Bearbeitung erhält frühere Ortsangaben und speichert Unterkunft getrennt", async () => {
  const client = mockClient({ trips: { data: { id: "trip-1" }, error: null } });
  const existing = { destination: "Mallorca", region: "Alcúdia", legacyRegion: "",
    locationData: { destinationId: "destination-1", customDestination: null, customRegion: null } };
  const trip = { id: "trip-1", existing, destination: "Mallorca", destinationId: "destination-1",
    accommodation: "Hotel Sonne", start: "2027-07-12", end: "2027-07-22", children: [{ age: 5, gender: null }], languages: ["Deutsch"] };
  await saveOwnTrip(client, "user-1", trip);
  const unchanged = client.calls.find((call) => call[0] === "update")[2];
  assert.equal(unchanged.destination_id, "destination-1");
  assert.equal(unchanged.accommodation, "Hotel Sonne");
  assert.equal(unchanged.legacy_region, null);
  await saveOwnTrip(client, "user-1", { ...trip, destination: "Kreta", destinationId: null, accommodation: "" });
  const changed = client.calls.filter((call) => call[0] === "update")[1][2];
  assert.equal(changed.custom_destination, "Kreta");
  assert.equal(changed.custom_region, null);
  assert.equal(changed.legacy_region, "Alcúdia");
  assert.equal(changed.accommodation, null);
});

test("Beschreibung, Interessen und eigenes Foto werden reisebezogen gespeichert", async () => {
  const client = mockClient({ trips: { data: { id: "trip-1" }, error: null } });
  await saveOwnTrip(client, "user-1", {
    id: "trip-1", destination: "Kreta", destinationId: null, accommodation: "",
    start: "2027-07-12", end: "2027-07-22", children: [], languages: ["Deutsch"],
    description: "Wir suchen Mitspieler.", interests: ["Strand", "Schnorcheln"],
    photo_path: "123e4567-e89b-42d3-a456-426614174000.webp",
  });
  const saved = client.calls.find((call) => call[0] === "update")[2];
  assert.equal(saved.description, "Wir suchen Mitspieler.");
  assert.deepEqual(saved.interests, ["Strand", "Schnorcheln"]);
  assert.equal(saved.photo_path, "123e4567-e89b-42d3-a456-426614174000.webp");
});

test("Sichtbarkeit wird atomar per RPC geändert; Fehler werden weitergegeben", async () => {
  const error = new Error("nicht erlaubt");
  const client = mockClient({ rpc: { data: null, error } });
  await assert.rejects(() => setOwnTripVisibility(client, "trip-1", true), error);
  assert.deepEqual(client.calls[0], ["rpc", "set_trip_visibility", { p_trip_id: "trip-1", p_visible: true }]);
});
