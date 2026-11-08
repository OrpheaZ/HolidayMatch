import test from "node:test";
import assert from "node:assert/strict";
import { fetchDestinationCatalog, fetchDestinations, destinationPhoto, destinationPhotoMarkup, resolveDestination } from "./destinations.js";

test("Zielvorschläge fassen gleiche Reiseziele zusammen, ohne willkürlich eine Region zu verknüpfen", async () => {
  const rows = [
    { id: "1", name: "Kreta", country: "Griechenland", region: "Chania" },
    { id: "2", name: "Kreta", country: "Griechenland", region: "Rethymno" },
    { id: "3", name: "Berlin", country: "Deutschland", region: null },
    { id: "4", name: "Santiago", country: "Chile", region: null },
    { id: "5", name: "Santiago", country: "Spanien", region: null },
  ];
  const client = { from: () => ({ select: () => ({ order: () => ({ range: async () => ({ data: rows, error: null }) }) }) }) };
  const destinations = await fetchDestinations(client);
  assert.deepEqual(destinations.map((item) => item.label), ["Berlin", "Kreta", "Santiago, Chile", "Santiago, Spanien"]);
  assert.equal(destinations.filter((item) => item.label === "Kreta").length, 1);
  assert.deepEqual(resolveDestination("  KRETA,Griechenland ", destinations), { label: "Kreta", aliases: ["Kreta, Griechenland"], destinationId: null });
  assert.deepEqual(resolveDestination("berlin", destinations), { label: "Berlin", aliases: ["Berlin, Deutschland"], destinationId: "3" });
  assert.deepEqual(resolveDestination("Santiago, Spanien", destinations), { label: "Santiago, Spanien", aliases: [], destinationId: "5" });
  assert.deepEqual(resolveDestination("Freies  Ziel", destinations), { label: "Freies Ziel", destinationId: null });
});

test("Fehler beim Laden der Zielvorschläge werden weitergegeben", async () => {
  const error = new Error("Keine Verbindung");
  const client = { from: () => ({ select: () => ({ order: () => ({ range: async () => ({ data: null, error }) }) }) }) };
  await assert.rejects(() => fetchDestinations(client), error);
});

test("Der öffentliche Katalog wird vollständig und stabil paginiert geladen", async () => {
  const rows = Array.from({ length: 1001 }, (_, index) => ({ id: index, name: `Ziel ${index}`, country: "Land" }));
  const ranges = [];
  let columns;
  const client = { from: (table) => {
    assert.equal(table, "destinations");
    return { select: (value) => {
      columns = value;
      return { order: (key) => {
        assert.equal(key, "id");
        return { range: async (start, end) => {
          ranges.push([start, end]);
          return { data: rows.slice(start, end + 1), error: null };
        } };
      } };
    } };
  } };
  assert.deepEqual(await fetchDestinationCatalog(client), rows);
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
  for (const column of ["image_path", "image_source", "image_source_url", "image_attribution"]) assert.ok(columns.includes(column));
});

test("Vor der Schema-Erweiterung bleiben Zielvorschläge ohne Bilder verfügbar", async () => {
  const selections = [];
  const client = { from: () => ({ select: (columns) => {
    selections.push(columns);
    return { order: () => ({ range: async () => columns.includes("image_path")
      ? { data: null, error: { code: "42703", message: "column destinations.image_path does not exist" } }
      : { data: [{ id: "1", name: "Berlin", country: "Deutschland", region: null }], error: null } }) };
  } }) };
  const suggestions = await fetchDestinations(client);
  assert.equal(suggestions[0].label, "Berlin");
  assert.equal(selections.length, 2);
  assert.equal(selections[1], "id,name,country,region");
});

const storageClient = { storage: { from: (bucket) => {
  assert.equal(bucket, "destination-images");
  return { getPublicUrl: (path) => ({ data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/destination-images/${path}` } }) };
} } };
const photoRow = {
  id: "1", name: "Kreta", country: "Griechenland", region: null,
  image_path: "generated/kreta.webp", image_source: "AI generated",
  image_source_url: null, image_attribution: null,
};

test("Fotos werden exakt nach normalisiertem Ziel und Land für Referenzen und Freitext zugeordnet", () => {
  const rows = [photoRow, { ...photoRow, id: "2", region: "Chania" }];
  const expected = destinationPhoto(storageClient, rows, { destination: " kreta ", country: " GRIECHENLAND " });
  assert.equal(expected.url, "https://example.supabase.co/storage/v1/object/public/destination-images/generated/kreta.webp");
  assert.deepEqual(destinationPhoto(storageClient, rows, { destination: "KRETA,Griechenland" }), expected);
  assert.deepEqual(destinationPhoto(storageClient, rows, { destination: "Kreta", destinationId: "2" }), expected);
  assert.equal(destinationPhoto(storageClient, rows, { destination: "Westkreta" }), null);
  assert.equal(destinationPhoto(storageClient, rows, { destination: "Kreta", country: "Spanien" }), null);
  assert.deepEqual(destinationPhoto(storageClient, rows, { destination: "Kreta", destinationId: "obsolete" }), expected);
});

test("Mehrdeutige Länder oder widersprüchliche Fotos erhalten kein Bild", () => {
  const otherCountry = { ...photoRow, id: "3", country: "Spanien", image_path: "generated/anderes.webp" };
  const rows = [photoRow, otherCountry];
  assert.equal(destinationPhoto(storageClient, rows, { destination: "Kreta" }), null);
  assert.ok(destinationPhoto(storageClient, rows, { destination: "Kreta", country: "Spanien" }).url.endsWith("anderes.webp"));
  assert.ok(destinationPhoto(storageClient, rows, { destination: "Kreta", destinationId: "1" }).url.endsWith("kreta.webp"));
  assert.equal(destinationPhoto(storageClient, [photoRow, { ...photoRow, id: "4", image_path: "generated/anderes.webp" }], { destination: "Kreta" }), null);
  assert.equal(destinationPhoto(storageClient, [photoRow, { ...photoRow, id: "4", image_attribution: "Andere Lizenz" }], { destination: "Kreta" }), null);
});

test("Unsichere oder unvollständige Foto-Metadaten werden nicht dargestellt", () => {
  for (const change of [
    { image_source_url: "javascript:alert(1)" },
    { image_source_url: "https://commons.wikimedia.org.evil.example/wiki/File:Foo" },
    { image_source_url: "https://evil.example@commons.wikimedia.org/wiki/File:Foo" },
    { image_source_url: "http://commons.wikimedia.org/wiki/File:Foo" },
    { image_path: "../evil.jpg" }, { image_path: "%2e%2e/evil.jpg" }, { image_path: "foo.jpg?x=1" },
    { image_attribution: "CC BY" }, { image_source: null },
    { image_source: "Wikimedia Commons", image_source_url: "https://commons.wikimedia.org/wiki/File:X.jpg", image_attribution: "CC BY" },
  ]) {
    assert.equal(destinationPhoto(storageClient, [{ ...photoRow, ...change }], { destination: "Kreta" }), null, JSON.stringify(change));
  }
});

test("Generierte Bilder zeigen keine Bilddetails; Ziel wird maskiert", () => {
  const photo = destinationPhoto(storageClient, [photoRow], { destination: "Kreta" });
  const html = destinationPhotoMarkup(photo, 'Kreta" onerror="alert(1)', "/placeholder.svg", "test");
  assert.ok(html.includes("Kreta&quot; onerror=&quot;alert(1)"));
  assert.ok(!html.includes("<button"));
  assert.ok(!html.includes("<figcaption"));
  assert.ok(!destinationPhotoMarkup(null, "Kreta", "/placeholder.svg", "test").includes("figcaption"));
});
