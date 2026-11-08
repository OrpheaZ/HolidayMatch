function normalize(value) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").toLocaleLowerCase("de");
}

export async function fetchDestinationCatalog(client) {
  const rows = [];
  const pageSize = 500;
  let columns = "id,name,country,region,image_path,image_source,image_source_url,image_attribution";
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from("destinations")
      .select(columns).order("id").range(offset, offset + pageSize - 1);
    if (error && offset === 0 && columns.includes("image_path")
      && error.code === "42703" && /image_(path|source|source_url|attribution)/i.test(error.message ?? "")) {
      columns = "id,name,country,region";
      offset -= pageSize;
      continue;
    }
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export function destinationSuggestions(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = normalize(row.name);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.values()].flatMap((group) => {
    const countries = new Set(group.map((row) => normalize(row.country)));
    if (countries.size === 1) {
      return [{
        label: group[0].name,
        aliases: [`${group[0].name}, ${group[0].country}`],
        destinationId: group.length === 1 && !group[0].region ? group[0].id : null,
      }];
    }
    return group.map((row) => ({
      label: `${row.name}, ${row.country}`,
      aliases: [],
      destinationId: group.filter((item) => normalize(item.country) === normalize(row.country)).length === 1 && !row.region ? row.id : null,
    })).filter((item, index, entries) => entries.findIndex((other) => normalize(other.label) === normalize(item.label)) === index);
  }).sort((a, b) => a.label.localeCompare(b.label, "de"));
}

export async function fetchDestinations(client) {
  return destinationSuggestions(await fetchDestinationCatalog(client));
}

export function destinationPhoto(client, rows, { destination, country, destinationId } = {}) {
  const name = normalize(destination ?? "");
  if (!name) return null;
  const reference = destinationId && rows.find((row) => row.id === destinationId);
  const referenceMatches = reference && [reference.name, `${reference.name}, ${reference.country}`]
    .some((value) => normalize(value) === name);
  const matches = rows.filter((row) => {
    const rowName = normalize(row.name);
    const rowCountry = normalize(row.country);
    return (name === rowName || name === normalize(`${row.name}, ${row.country}`))
      && (!country || rowCountry === normalize(country))
      && (!referenceMatches || (rowName === normalize(reference.name) && rowCountry === normalize(reference.country)));
  });
  const keys = new Set(matches.map((row) => `${normalize(row.name)}\u0000${normalize(row.country)}`));
  if (keys.size !== 1) return null;

  const photos = matches.filter((row) => row.image_path);
  const signatures = new Set(photos.map((row) => JSON.stringify([
    row.image_path, row.image_source, row.image_source_url, row.image_attribution,
  ])));
  if (signatures.size !== 1) return null;
  const photo = photos[0];
  if (typeof photo.image_path !== "string" || !photo.image_path.startsWith("generated/")
    || photo.image_path.split("/").some((part) => !part || part === "." || part === "..")
    || /[\\%?#\u0000-\u001f]/.test(photo.image_path)
    || photo.image_source !== "AI generated"
    || photo.image_source_url !== null || photo.image_attribution !== null) return null;
  const { data } = client.storage.from("destination-images").getPublicUrl(photo.image_path);
  let image;
  try {
    image = new URL(data.publicUrl);
    if (!["https:", "http:"].includes(image.protocol) || image.username || image.password) return null;
  } catch {
    return null;
  }
  return { url: image.href };
}

export function destinationPhotoMarkup(photo, destination, placeholder, imageClass) {
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  return `<img class="${escape(imageClass)}" src="${escape(photo?.url ?? placeholder)}" alt="${escape(photo ? `Reiseziel ${destination}` : "Neutrale Platzhaltergrafik")}" loading="lazy" decoding="async" data-destination-photo>`;
}

export function resolveDestination(input, destinations) {
  const match = destinations.find((destination) =>
    [destination.label, ...destination.aliases].some((value) => normalize(value) === normalize(input)));
  return match ?? { label: input.trim().replace(/\s+/g, " "), destinationId: null };
}
