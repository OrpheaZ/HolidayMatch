import test from "node:test";
import assert from "node:assert/strict";
import { requestFamilyContact, contactErrorMessage } from "./contact.js";

test("Angemeldete Benutzer stellen Kontaktanfragen über die öffentliche Referenz", async () => {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "user" } }, error: null }) },
    rpc: async (...args) => { calls.push(args); return { data: "request", error: null }; },
  };
  assert.equal(await requestFamilyContact(client, "public-trip"), true);
  assert.deepEqual(calls, [["request_contact", { trip_reference: "public-trip" }]]);
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
