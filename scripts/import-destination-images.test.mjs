import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  validateConfig, groupDestinations, selectCandidate, searchCommons,
  downloadThumbnail, loadDestinations, runImport, makeWebp,
} from "./import-destination-images.mjs";

const config = {
  SUPABASE_URL: "https://dev123.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "private-key",
  HOLIDAYBUDDIES_DEV_PROJECT_REF: "dev123",
  HOLIDAYBUDDIES_CONFIRM_DEV: "yes",
  WIKIMEDIA_CONTACT_EMAIL: "contact@example.com",
};
const row = (id, extra = {}) => ({
  id, name: "Berlin", country: "Germany", image_path: null, image_source: null,
  image_source_url: null, image_attribution: null, ...extra,
});
const jpeg = Buffer.from([255, 216, 255, 192, 0, 8, 8, 0, 100, 0, 100, 1]);
function page(overrides = {}, metadata = {}) {
  return {
    pageid: 42, title: "File:Berlin Germany.jpg",
    imageinfo: [{
      mime: "image/jpeg", descriptionurl: "https://commons.wikimedia.org/wiki/File:Berlin_Germany.jpg",
      thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/test.jpg/800px-test.jpg",
      thumbwidth: 800, thumbheight: 600,
      extmetadata: {
        Artist: { value: '<a href="/wiki/User:Example">A. Author</a>' },
        LicenseShortName: { value: "CC BY-SA 4.0" },
        LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0/" },
        ImageDescription: { value: "Photo of Berlin, Germany" }, ...metadata,
      }, ...overrides,
    }],
  };
}
const candidate = () => selectCandidate([page()], row("1"));
function fakeFetch(pages = [page()], image = jpeg) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url.startsWith("https://commons.wikimedia.org/w/api.php")) {
      return Response.json({ query: { pages } });
    }
    return new Response(image, { headers: { "content-type": "image/jpeg" } });
  };
  fetcher.calls = calls;
  return fetcher;
}

function fakeClient(initial, options = {}) {
  const rows = initial.map((item) => ({ ...item }));
  const uploads = [];
  const client = {
    rows, uploads,
    storage: { from: (bucket) => ({
      upload: async (path, bytes, uploadOptions) => {
        uploads.push({ bucket, path, bytes, uploadOptions });
        return { error: options.uploadError ?? null };
      },
    }) },
    from(table) {
      assert.equal(table, "destinations");
      let updates;
      const filters = [];
      const query = {
        select() { return query; },
        order(column) { assert.equal(column, "id"); return query; },
        async range(start, end) {
          if (options.loadError) return { error: options.loadError };
          return { data: rows.slice(start, end + 1), error: null };
        },
        update(values) { updates = values; return query; },
        eq(field, value) { filters.push([field, value]); return query; },
        is(field, value) { filters.push([field, value]); return query; },
        then(resolve, reject) {
          if (options.updateError) return Promise.resolve({ error: options.updateError }).then(resolve, reject);
          const target = rows.find((item) => filters.every(([key, value]) => item[key] === value));
          if (target) Object.assign(target, updates);
          return Promise.resolve({ data: target ? [{ id: target.id }] : [], error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return client;
}

test("Entwicklungsprojekt muss explizit bestätigt und exakt adressiert sein", () => {
  assert.deepEqual(validateConfig(config), { url: "https://dev123.supabase.co", key: "private-key",
    userAgent: "HolidayBuddiesImageImporter/1.0 (contact: contact@example.com)" });
  for (const change of [
    { HOLIDAYBUDDIES_CONFIRM_DEV: "no" }, { SUPABASE_SERVICE_ROLE_KEY: "" },
    { HOLIDAYBUDDIES_DEV_PROJECT_REF: "other" }, { SUPABASE_URL: "https://dev123.supabase.co.evil.example" },
    { SUPABASE_URL: "https://user:password@dev123.supabase.co/" },
    { SUPABASE_URL: "http://dev123.supabase.co" }, { SUPABASE_URL: "https://dev123.supabase.co/rest/v1" },
    { SUPABASE_URL: "invalid" },
    { WIKIMEDIA_CONTACT_EMAIL: "" },
    { WIKIMEDIA_CONTACT_EMAIL: "https://user:secret@example.org/contact" },
    { WIKIMEDIA_CONTACT_EMAIL: "contact@example.com\nInjected: value" },
  ]) assert.throws(() => validateConfig({ ...config, ...change }));
});

test("Name und Land werden normalisiert zusammengefasst, verschiedene Länder getrennt", () => {
  const groups = groupDestinations([row("1"), row("2", { name: " BERLIN ", country: "germany" }),
    row("3", { country: "USA" })]);
  assert.deepEqual(groups.map(([, items]) => items.length).sort(), [1, 2]);
  assert.throws(() => groupDestinations([row("1", { country: "" })]));
});

test("Nur genaue, einfache Lizenzen mit Autor, Quellseite, Fotoformat und passender Ortszuordnung", () => {
  assert.match(candidate().attribution, /A\. Author · CC BY-SA 4\.0/);
  for (const [license, url] of [
    ["CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"],
    ["CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/"],
    ["CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"],
    ["CC0", "https://creativecommons.org/publicdomain/zero/1.0/"],
  ]) assert.ok(selectCandidate([page({}, { LicenseShortName: { value: license }, LicenseUrl: { value: url } })], row("1")));
  assert.ok(selectCandidate([page({ thumburl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/test.jpg" },
    { LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0" } })], row("1")));
  const bad = [
    page({}, { LicenseShortName: { value: "CC BY-NC 4.0" } }),
    page({}, { LicenseShortName: { value: "CC BY-SA 4.0 or GFDL" } }),
    page({}, { LicenseUrl: { value: "https://evil.example/" } }),
    page({}, { Artist: { value: "<b></b>" } }),
    page({ mime: "image/svg+xml" }),
    page({ thumbheight: 1281 }),
    page({ thumburl: "https://upload.wikimedia.org.evil.example/wikipedia/commons/a" }),
    page({ descriptionurl: "https://evil.example/wiki/File:Berlin" }),
    page({}, { ImageDescription: { value: "Map of Berlin, Germany" } }),
    { ...page({}, { ImageDescription: { value: "Photo of Berlin, USA" } }), title: "File:Berlin.jpg" },
    { ...page({}, { ImageDescription: { value: "Photo of Berlin Germanyville" } }), title: "File:Berlin.jpg" },
  ];
  for (const item of bad) assert.equal(selectCandidate([item], row("1")), null);
});

test("Commons-Suche ist begrenzt, maskiert Suchoperatoren und behandelt API-Fehler", async () => {
  const fetcher = fakeFetch();
  assert.ok(await searchCommons(fetcher, row("1")));
  const url = new URL(fetcher.calls[0].url);
  assert.equal(url.searchParams.get("gsrlimit"), "30");
  assert.equal(url.searchParams.get("iiurlwidth"), "960");
  assert.equal(fetcher.calls[0].options.redirect, "error");
  await searchCommons(fetcher, row("1", { name: 'Berlin" OR secret' }));
  assert.equal(new URL(fetcher.calls[1].url).searchParams.get("gsrsearch"), '"Berlin OR secret" "Germany"');
  await assert.rejects(() => searchCommons(async () => Response.json({ error: { info: "private-key" } }), row("1")), /API/);
});

test("Download begrenzt Bytes, Typ, Signatur und vertrauenswürdigen Host", async () => {
  assert.deepEqual(await downloadThumbnail(fakeFetch(), candidate()), jpeg);
  await assert.rejects(() => downloadThumbnail(async () => new Response(new Uint8Array(5 * 1024 * 1024 + 1),
    { headers: { "content-type": "image/jpeg" } }), candidate()), /Größenlimit/);
  await assert.rejects(() => downloadThumbnail(async () => new Response(jpeg,
    { headers: { "content-type": "image/jpeg", "content-length": "999999999" } }), candidate()), /Größenlimit/);
  await assert.rejects(() => downloadThumbnail(async () => new Response("html",
    { headers: { "content-type": "image/jpeg" } }), candidate()), /Bildheader/);
  const tooWide = Buffer.from(jpeg);
  tooWide.writeUInt16BE(1281, 9);
  await assert.rejects(() => downloadThumbnail(fakeFetch([page()], tooWide), candidate()), /1280 Pixel/);
  await assert.rejects(() => downloadThumbnail(async () => new Response(jpeg,
    { headers: { "content-type": "text/html" } }), candidate()), /Medientyp/);
  await assert.rejects(() => downloadThumbnail(fakeFetch(), { ...candidate(), url: "https://evil.example/" }), /URL/);
});

test("WebP-Thumbnail wird auf exakt 640 × 400 zugeschnitten", async () => {
  const image = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#54aabb" } }).png().toBuffer();
  const result = await sharp(await makeWebp(image)).metadata();
  assert.equal(result.format, "webp");
  assert.equal(result.width, 640);
  assert.equal(result.height, 400);
  const tiny = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#fff" } }).png().toBuffer();
  await assert.rejects(() => makeWebp(tiny), /zu klein/);
});

test("Alle Destinations werden paginiert gelesen", async () => {
  const client = fakeClient(Array.from({ length: 1001 }, (_, i) => row(String(i))));
  assert.equal((await loadDestinations(client)).length, 1001);
  await assert.rejects(() => loadDestinations(fakeClient([], { loadError: "secret" })), /Schema/);
});

test("Import dedupliziert, schreibt Metadaten und bewahrt vorhandene Bilder beim erneuten Aufruf", async () => {
  const client = fakeClient([row("1"), row("2", { name: " BERLIN ", country: "germany" })]);
  const fetcher = fakeFetch();
  assert.deepEqual(await runImport(client, fetcher, () => {}, undefined, async (bytes) => bytes, searchCommons), { imported: 2, preserved: 0, failed: 0 });
  assert.equal(client.uploads.length, 1);
  assert.equal(client.uploads[0].bucket, "destination-images");
  assert.equal(client.uploads[0].uploadOptions.upsert, false);
  assert.equal(client.rows[0].image_path, client.rows[1].image_path);
  assert.equal(client.rows[0].image_source, "Wikimedia Commons");
  assert.match(client.rows[0].image_source_url, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(client.rows[0].image_attribution, /CC BY-SA 4\.0/);
  assert.deepEqual(await runImport(client, fetcher, () => {}), { imported: 0, preserved: 2, failed: 0 });
  assert.equal(client.uploads.length, 1);
});

test("Vorhandene oder teilweise Bilddaten und betroffene Duplikate bleiben unangetastet", async () => {
  const client = fakeClient([row("1", { image_attribution: "existing" }), row("2")]);
  const fetcher = fakeFetch();
  assert.deepEqual(await runImport(client, fetcher, () => {}), { imported: 0, preserved: 2, failed: 1 });
  assert.equal(fetcher.calls.length, 0);
  assert.equal(client.rows[1].image_path, null);
});

test("Konkurrierend gesetzte Bilddaten werden nicht überschrieben", async () => {
  const client = fakeClient([row("1")]);
  const originalUpload = client.storage.from;
  client.storage.from = (bucket) => {
    const storage = originalUpload(bucket);
    return { async upload(...args) {
      const result = await storage.upload(...args);
      client.rows[0].image_path = "existing.jpg";
      return result;
    } };
  };
  const logs = [];
  assert.deepEqual(await runImport(client, fakeFetch(), (line) => logs.push(line), undefined, async (bytes) => bytes, searchCommons), { imported: 0, preserved: 0, failed: 1 });
  assert.equal(client.rows[0].image_path, "existing.jpg");
  assert.match(logs.join(" "), /Teilupdates/);
});

test("CLI bricht ohne Entwicklungsbestätigung mit Fehlercode und ohne Geheimnisse ab", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./import-destination-images.mjs", import.meta.url))], {
    encoding: "utf8", env: { ...process.env, ...config, HOLIDAYBUDDIES_CONFIRM_DEV: "no" },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /HOLIDAYBUDDIES_CONFIRM_DEV/);
  assert.doesNotMatch(result.stdout + result.stderr, /private-key/);
});

test("Fehlschläge und konkurrierende Updates werden berichtet, Geheimnisse nie ausgegeben", async () => {
  for (const [client, fetcher, expected] of [
    [fakeClient([row("1")]), fakeFetch([]), /Kein Foto/],
    [fakeClient([row("1")], { uploadError: { message: "private-key" } }), fakeFetch(), /Upload fehlgeschlagen/],
    [fakeClient([row("1")], { updateError: { message: "private-key" } }), fakeFetch(), /Teilupdates/],
    [fakeClient([row("1")]), async () => { throw new Error("private-key"); }, /Netzwerkfehler/],
  ]) {
    const logs = [];
    assert.deepEqual(await runImport(client, fetcher, (line) => logs.push(line), undefined, async (bytes) => bytes, searchCommons), { imported: 0, preserved: 0, failed: 1 });
    assert.match(logs.join(" "), expected);
    assert.doesNotMatch(logs.join(" "), /private-key/);
  }
});

test("Nicht manuell überprüfte Reiseziele werden nicht automatisch importiert", async () => {
  const client = fakeClient([row("1")]);
  const fetcher = fakeFetch();
  assert.deepEqual(await runImport(client, fetcher, () => {}), { imported: 0, preserved: 0, failed: 1 });
  assert.equal(fetcher.calls.length, 0);
  assert.equal(client.uploads.length, 0);
});
