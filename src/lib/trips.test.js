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
        order(column, options) { calls.push(["order", table, column, options]); return Promise.resolve(results[table]); },
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
      custom_destination: null, custom_region: null, trip_languages: null, trip_children_data: null,
      destinations: { name: "Mallorca", region: "Alcúdia" },
      trip_children: [{ children: { birth_year: 2022, gender: null } }],
      trip_search_consent: { share_family_details: true },
    }], error: null },
    profiles: { data: { languages: ["Deutsch"] }, error: null },
  });
  const trips = await fetchOwnTrips(client, "user-1");
  assert.deepEqual(trips, [{
    id: "trip-1", destination: "Mallorca", region: "Alcúdia", start: "2027-07-12", end: "2027-07-22",
    children: [{ age: 5, gender: null }], languages: ["Deutsch"], visible: true, detailsShared: true,
  }]);
  assert.ok(client.calls.some((call) => call[0] === "eq" && call[1] === "trips" && call[2] === "user_id" && call[3] === "user-1"));
});

test("Neue Reisen werden privat erstellt; Aktualisieren und Löschen sind auf Eigentümer beschränkt", async () => {
  const client = mockClient({ trips: { data: { id: "trip-1" }, error: null } });
  const trip = { destination: "Burgas", region: "Burgas", start: "2027-05-01", end: "2027-05-31", children: [{ age: 5, gender: "" }], languages: ["Deutsch"] };
  await saveOwnTrip(client, "user-1", trip);
  const inserted = client.calls.find((call) => call[0] === "insert")[2];
  assert.equal(inserted.user_id, "user-1");
  assert.equal(inserted.is_public, false);
  assert.deepEqual(inserted.trip_children_data, [{ age: 5, gender: null }]);
  await saveOwnTrip(client, "user-1", { ...trip, id: "trip-1" });
  await removeOwnTrip(client, "user-1", "trip-1");
  assert.equal(client.calls.filter((call) => call[0] === "eq" && call[2] === "user_id" && call[3] === "user-1").length, 2);
});

test("Sichtbarkeit wird atomar per RPC geändert; Fehler werden weitergegeben", async () => {
  const error = new Error("nicht erlaubt");
  const client = mockClient({ rpc: { data: null, error } });
  await assert.rejects(() => setOwnTripVisibility(client, "trip-1", true), error);
  assert.deepEqual(client.calls[0], ["rpc", "set_trip_visibility", { p_trip_id: "trip-1", p_visible: true }]);
});
