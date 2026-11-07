import test from "node:test";
import assert from "node:assert/strict";
import { register, login, ensureProfile, authErrorMessage } from "./auth.js";

test("Registrierung übergibt Namen und Bestätigungsziel an Supabase", async () => {
  let payload;
  const client = { auth: { signUp: async (value) => { payload = value; return { data: { session: null }, error: null }; } } };
  const result = await register(client, { name: "Alex", email: "test@example.com", password: "example-password", redirectTo: "http://localhost:5173/login" });
  assert.equal(result.session, null);
  assert.equal(payload.options.data.display_name, "Alex");
  assert.equal(payload.options.emailRedirectTo, "http://localhost:5173/login");
});

test("Anmeldung übergibt Zugangsdaten und meldet Fehler", async () => {
  const error = { code: "invalid_credentials" };
  const client = { auth: { signInWithPassword: async (value) => {
    assert.deepEqual(value, { email: "test@example.com", password: "wrong" });
    return { error };
  } } };
  await assert.rejects(() => login(client, { email: "test@example.com", password: "wrong" }), (result) => result === error);
  assert.match(authErrorMessage(error), /falsch/);
});

function profileClient(profile, readError = null, writeError = null) {
  const writes = [];
  return {
    writes,
    from(table) {
      assert.equal(table, "profiles");
      return {
        select() { return { eq: () => ({ maybeSingle: async () => ({ data: profile, error: readError }) }) }; },
        async upsert(value, options) { writes.push({ value, options }); return { error: writeError }; },
      };
    },
  };
}

test("Fehlendes Profil wird angelegt, vorhandenes nicht überschrieben", async () => {
  const user = { id: "user-1", user_metadata: { display_name: " Alex " } };
  const missing = profileClient(null);
  await ensureProfile(missing, user);
  assert.deepEqual(missing.writes, [{ value: { user_id: "user-1", display_name: "Alex" }, options: { onConflict: "user_id", ignoreDuplicates: true } }]);
  const existing = profileClient({ user_id: "user-1" });
  await ensureProfile(existing, user);
  assert.equal(existing.writes.length, 0);
});

test("Profilfehler und fehlende Namen werden nicht verschwiegen", async () => {
  const user = { id: "user-1", user_metadata: { display_name: "Alex" } };
  const error = new Error("database error");
  await assert.rejects(() => ensureProfile(profileClient(null, error), user), error);
  await assert.rejects(() => ensureProfile(profileClient(null, null, error), user), error);
  await assert.rejects(() => ensureProfile(profileClient(null), { id: "user-1" }), /Profil/);
});
