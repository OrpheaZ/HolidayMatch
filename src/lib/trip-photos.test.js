import test from "node:test";
import assert from "node:assert/strict";
import { removeTripPhoto, uploadTripPhoto, hydrateTripPhotos, releaseTripPhotos } from "./trip-photos.js";

test("Ungültige Bildformate und übergroße Dateien werden vor dem Upload abgelehnt", async () => {
  const client = { storage: { from: () => { throw new Error("Kein Upload erwartet"); } } };
  await assert.rejects(() => uploadTripPhoto(client, { type: "image/svg+xml", size: 12 }), /JPEG/);
  await assert.rejects(() => uploadTripPhoto(client, { type: "image/png", size: 5 * 1024 * 1024 + 1 }), /5 MB/);
  await assert.rejects(() => uploadTripPhoto(client, { type: "image/png", size: 0 }), /JPEG/);
});

test("Eigene Fotos werden verkleinert, in WebP umgewandelt und ohne Überschreiben hochgeladen", async () => {
  const previousBitmap = globalThis.createImageBitmap;
  const previousDocument = globalThis.document;
  let closed = false;
  const canvas = {
    getContext: () => ({ drawImage() {} }),
    toBlob: (callback, type) => callback(new Blob(["bild"], { type })),
  };
  globalThis.createImageBitmap = async () => ({ width: 3200, height: 1600, close() { closed = true; } });
  globalThis.document = { createElement: () => canvas };
  try {
    const client = { storage: { from: (bucket) => {
      assert.equal(bucket, "trip-images");
      return { upload: async (path, blob, options) => {
        assert.match(path, /^[0-9a-f-]+\.webp$/);
        assert.equal(blob.type, "image/webp");
        assert.deepEqual(options, { contentType: "image/webp", upsert: false });
        return { error: null };
      } };
    } } };
    assert.match(await uploadTripPhoto(client, { type: "image/jpeg", size: 100 }), /\.webp$/);
    assert.equal(canvas.width, 1600);
    assert.equal(canvas.height, 800);
    assert.equal(closed, true);
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});

test("Entfernt nur den angegebenen eigenen Bildpfad und meldet verweigertes Löschen", async () => {
  const path = "123e4567-e89b-42d3-a456-426614174000.webp";
  let removed;
  const client = { storage: { from: (bucket) => {
    assert.equal(bucket, "trip-images");
    return { remove: async (paths) => { removed = paths; return { data: [{ name: path }], error: null }; } };
  } } };
  await removeTripPhoto(client, path);
  assert.deepEqual(removed, [path]);
  await assert.rejects(() => removeTripPhoto(client, "../bild.webp"), /Bildpfad/);
  client.storage.from = () => ({ remove: async () => ({ data: [], error: null }) });
  await assert.rejects(() => removeTripPhoto(client, path), /nicht entfernt/);
});

test("Reisefotos werden geladen, markiert und Objekt-URLs freigegeben", async () => {
  const path = "123e4567-e89b-42d3-a456-426614174000.webp";
  const image = { dataset: { tripPhotoPath: path, fallbackApplied: "true" }, isConnected: true };
  const container = { querySelectorAll: () => [image] };
  const client = { storage: { from: () => ({ download: async (name) => {
    assert.equal(name, path);
    return { data: new Blob(["bild"], { type: "image/webp" }), error: null };
  } }) } };
  await hydrateTripPhotos(client, container);
  assert.match(image.src, /^blob:/);
  assert.equal(image.alt, "Reisefoto");
  assert.equal(image.dataset.fallbackApplied, undefined);
  releaseTripPhotos(container);
});
