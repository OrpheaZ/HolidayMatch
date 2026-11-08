import test from "node:test";
import assert from "node:assert/strict";
import { fetchPlannedTrips, localDateString } from "./planned-trips.js";

test("Lädt höchstens vier laufende oder kommende freigegebene Reisen in stabiler Reihenfolge", async () => {
  const calls = [];
  const rows = [{ destination: "Kreta" }];
  const query = {
    gte(...args) { calls.push(["gte", ...args]); return this; },
    order(...args) { calls.push(["order", ...args]); return this; },
    async limit(...args) { calls.push(["limit", ...args]); return { data: rows, error: null }; },
  };
  const client = { rpc(name) { calls.push(["rpc", name]); return query; } };
  assert.equal(await fetchPlannedTrips(client, "2026-11-08"), rows);
  assert.deepEqual(calls, [
    ["rpc", "search_public_families"],
    ["gte", "end_date", "2026-11-08"],
    ["order", "start_date", { ascending: true }],
    ["order", "trip_reference", { ascending: true }],
    ["limit", 4],
  ]);
});

test("Verbindungsfehler werden weitergegeben", async () => {
  const error = new Error("offline");
  const query = {
    gte() { return this; },
    order() { return this; },
    async limit() { return { data: null, error }; },
  };
  await assert.rejects(() => fetchPlannedTrips({ rpc: () => query }, "2026-11-08"), error);
});

test("Verwendet das lokale Kalenderdatum", () => {
  assert.equal(localDateString(new Date(2026, 0, 3, 0, 15)), "2026-01-03");
});
