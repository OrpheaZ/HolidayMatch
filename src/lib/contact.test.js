import test from "node:test";
import assert from "node:assert/strict";
import { requestFamilyContact, contactErrorMessage, fetchPersonalReferences, setFamilyFavorite, fetchReceivedContacts } from "./contact.js";

test("Angemeldete Benutzer stellen Kontaktanfragen über die öffentliche Referenz", async () => {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "user" } }, error: null }) },
    rpc: async (...args) => { calls.push(args); return { data: "request", error: null }; },
  };
  assert.equal(await requestFamilyContact(client, "public-trip", "Hallo!", ["Strand"]), true);
  assert.deepEqual(calls, [["send_contact_message", { p_trip_reference: "public-trip", p_message: "Hallo!", p_interests: ["Strand"] }]]);
});

test("Nicht angemeldete Benutzer werden ohne Kontaktanfrage zur Anmeldung geführt", async () => {
  const client = {
    auth: { getUser: async () => ({ data: { user: null }, error: { name: "AuthSessionMissingError" } }) },
    rpc: () => { throw new Error("RPC darf nicht aufgerufen werden"); },
  };
  assert.equal(await requestFamilyContact(client, "public-trip"), false);
});

test("Authentifizierungs- und RPC-Fehler werden nicht verschwiegen", async () => {
  const error = { code: "23505" };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "user" } }, error: null }) },
    rpc: async () => ({ error }),
  };
  await assert.rejects(() => requestFamilyContact(client, "public-trip"), (value) => value === error);
  assert.match(contactErrorMessage(error), /bereits/);
  assert.match(contactErrorMessage({ code: "42501" }), /nicht mehr verfügbar/);
  client.auth.getUser = async () => ({ data: { user: null }, error: new Error("offline") });
  await assert.rejects(() => requestFamilyContact(client, "public-trip"), /offline/);
});

test("Persönliche Referenzen werden seitenweise geladen und Fehler gemeldet", async () => {
  const calls = [];
  const client = { rpc(name) { return { range: async (start, end) => {
    calls.push([name, start, end]);
    return { data: start === 0 ? Array.from({ length: 500 }, (_, i) => ({ trip_reference: String(i) })) : [{ trip_reference: "500" }], error: null };
  } }; } };
  assert.equal((await fetchPersonalReferences(client, "my_family_favorites")).length, 501);
  assert.deepEqual(calls, [["my_family_favorites", 0, 499], ["my_family_favorites", 500, 999]]);
  const error = new Error("offline");
  await assert.rejects(() => fetchPersonalReferences({ rpc: () => ({ range: async () => ({ error }) }) }, "my_contacted_families"), error);
});

test("Favoriten und eingegangene Nachrichten werden nur für den aktuellen Nutzer angefragt", async () => {
  const calls = [];
  const query = {
    select(value) { calls.push(["select", value]); return this; },
    eq(field, value) { calls.push(["eq", field, value]); return this; },
    order(field) { calls.push(["order", field]); return this; },
    range: async () => ({ data: [], error: null }),
  };
  const client = {
    from(table) { calls.push(["from", table]); return query; },
    rpc: async (name, args) => { calls.push([name, args]); return { error: null }; },
  };
  await setFamilyFavorite(client, "trip", true);
  assert.deepEqual(calls[0], ["set_family_favorite", { p_trip_reference: "trip", p_favorite: true }]);
  assert.deepEqual(await fetchReceivedContacts(client, "user"), []);
  assert.ok(calls.some((call) => call[0] === "eq" && call[1] === "recipient_id" && call[2] === "user"));
});
