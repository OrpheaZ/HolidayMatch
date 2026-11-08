const bucket = "trip-images";
const maxBytes = 5 * 1024 * 1024;
const pathPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export async function uploadTripPhoto(client, file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > maxBytes || !file.size) {
    throw new Error("Bitte wähle ein JPEG-, PNG- oder WebP-Bild mit maximal 5 MB.");
  }
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Das Bild konnte nicht verarbeitet werden.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.type !== "image/webp" || blob.size > maxBytes) throw new Error("Das Bild konnte nicht als WebP gespeichert werden.");
    const path = `${crypto.randomUUID()}.webp`;
    const { error } = await client.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) throw error;
    return path;
  } finally {
    image.close();
  }
}

export async function removeTripPhoto(client, path) {
  if (!pathPattern.test(path)) throw new Error("Ungültiger Bildpfad.");
  const { data, error } = await client.storage.from(bucket).remove([path]);
  if (error) throw error;
  if (!data?.some((item) => item.name === path)) throw new Error("Das Reisebild konnte nicht entfernt werden.");
}

export async function hydrateTripPhotos(client, container) {
  const images = [...container.querySelectorAll("img[data-trip-photo-path]")];
  await Promise.all(images.map(async (image) => {
    try {
      const path = image.dataset.tripPhotoPath;
      if (!pathPattern.test(path)) throw new Error("Ungültiger Reisebildpfad.");
      const { data, error } = await client.storage.from(bucket).download(path);
      if (error) throw error;
      if (!image.isConnected) return;
      const url = URL.createObjectURL(data);
      image.dataset.tripObjectUrl = url;
      delete image.dataset.fallbackApplied;
      image.alt = "Reisefoto";
      image.src = url;
    } catch (error) {
      console.error("Reisebild konnte nicht geladen werden:", error);
    }
  }));
}

export function releaseTripPhotos(container) {
  container.querySelectorAll("img[data-trip-object-url]").forEach((image) => URL.revokeObjectURL(image.dataset.tripObjectUrl));
}
