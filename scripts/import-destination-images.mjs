import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const API = "https://commons.wikimedia.org/w/api.php";
const BUCKET = "destination-images";
const MAX_BYTES = 5 * 1024 * 1024;
const PAGE_SIZE = 500;
const FIELDS = "id,name,country,image_path,image_source,image_source_url,image_attribution";
const LICENSES = new Map([
  ["CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"],
  ["CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/"],
  ["CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/"],
  ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
  ["CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"],
  ["CC BY-SA 2.0", "https://creativecommons.org/licenses/by-sa/2.0/"],
  ["CC0", "https://creativecommons.org/publicdomain/zero/1.0/"],
  ["CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/"],
]);
const SEARCH_TERMS = new Map([
  ["algarve", ["Algarve", "Portugal", "coast"]],
  ["antalya", ["Antalya", "Turkey", "coast"]],
  ["bibione", ["Bibione", "Italy", "beach"]],
  ["costa brava", ["Costa Brava", "Spain", "coast"]],
  ["dalmatien", ["Dalmatia", "Croatia", "coast"]],
  ["fuerteventura", ["Fuerteventura", "Spain", "dunes"]],
  ["gardasee", ["Lake Garda", "Italy", "lake"]],
  ["goldstrand", ["Golden Sands", "Bulgaria", "beach"]],
  ["gran canaria", ["Gran Canaria", "Spain", "coast"]],
  ["istrien", ["Istria", "Croatia", "coast"]],
  ["kos", ["Kos", "Greece", "beach"]],
  ["kreta", ["Crete", "Greece", "beach"]],
  ["lanzarote", ["Lanzarote", "Spain", "coast"]],
  ["mallorca", ["Mallorca", "Spain", "beach"]],
  ["rhodos", ["Rhodes", "Greece", "coast"]],
  ["rimini", ["Rimini", "Italy", "beach"]],
  ["saaremaa", ["Saaremaa", "Estonia", "coast"]],
  ["sardinien", ["Sardinia", "Italy", "beach"]],
  ["sizilien", ["Sicily", "Italy", "coast"]],
  ["sonnenstrand", ["Sunny Beach", "Bulgaria", "beach"]],
  ["teneriffa", ["Tenerife", "Spain", "coast"]],
]);
const COUNTRIES = new Map([
  ["algarve", "portugal"], ["antalya", "türkei"], ["bibione", "italien"],
  ["costa brava", "spanien"], ["dalmatien", "kroatien"], ["fuerteventura", "spanien"],
  ["gardasee", "italien"], ["goldstrand", "bulgarien"], ["gran canaria", "spanien"],
  ["istrien", "kroatien"], ["kos", "griechenland"], ["kreta", "griechenland"],
  ["lanzarote", "spanien"], ["mallorca", "spanien"], ["rhodos", "griechenland"],
  ["rimini", "italien"], ["saaremaa", "estland"], ["sardinien", "italien"],
  ["sizilien", "italien"], ["sonnenstrand", "bulgarien"], ["teneriffa", "spanien"],
]);
const REVIEWED_TITLES = new Map([
  ["algarve", "File:Coast Algarve, Portimão, Portugal, 2015.JPG"],
  ["antalya", "File:Konyaaltı Beach.jpg"],
  ["costa brava", "File:Lloret de Mar - Camí a Cala Banys - Mediterranean Sea Coast of Costa Brava 03.jpg"],
  ["dalmatien", "File:Croatia P8165276raw (3943202883).jpg"],
  ["fuerteventura", "File:Montana Redona - Fuerteventura - 01.jpg"],
  ["gardasee", "File:Lago di Garda - Garda - Via Verona, Esplanade at the Lake - April 2010 01.jpg"],
  ["gran canaria", "File:Gran canaria-797.JPG"],
  ["istrien", "File:2014-12-08 09-30-47 11107.0 Croatia Istarska Mali Vareški Mali Vareški.jpg"],
  ["kos", "File:Kefalos beach. Kastri island and chapel of St. Nicholas. Kos, Greece.jpg"],
  ["kreta", "File:Crete, Malia beach 2019 a.jpg"],
  ["lanzarote", "File:Coast at Los Hervideros - Lanzarote - 01.JPG"],
  ["mallorca", "File:Cala Mesquida beach in Mallorca, Spain (47988460597).jpg"],
  ["rhodos", "File:Rhodes coast near Ladiko. Greece.jpg"],
  ["rimini", "File:Autumn beach - Rimini, Italy - panoramio.jpg"],
  ["saaremaa", "File:Mändjala beach, Saaremaa island.JPG"],
  ["sardinien", "File:Beach at Bari Sardo, Sardinia, Italy.jpg"],
  ["sizilien", "File:Rocky beach in San Lorenzo.jpg"],
  ["sonnenstrand", "File:Bulgaria-Sunny Beach-01.jpg"],
  ["teneriffa", "File:Tenerife Coast R11.jpg"],
]);

function termsFor(destination) {
  const name = normalize(destination.name);
  return COUNTRIES.get(name) === normalize(destination.country) ? SEARCH_TERMS.get(name) : null;
}

export function validateConfig(env) {
  const { SUPABASE_URL: value, SUPABASE_SERVICE_ROLE_KEY: key,
    HOLIDAYBUDDIES_DEV_PROJECT_REF: ref, HOLIDAYBUDDIES_CONFIRM_DEV: confirm,
    WIKIMEDIA_CONTACT_EMAIL: contact } = env;
  if (!value || !key || !ref || confirm !== "yes" || !contact) {
    throw new ImportError("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HOLIDAYBUDDIES_DEV_PROJECT_REF, HOLIDAYBUDDIES_CONFIRM_DEV=yes und WIKIMEDIA_CONTACT_EMAIL sind erforderlich.");
  }
  let url;
  try { url = new URL(value); } catch { throw new ImportError("Ungültige Supabase-URL."); }
  if (!/^[a-z0-9]+$/.test(ref) || url.protocol !== "https:" || url.hostname !== `${ref}.supabase.co`
      || url.port || url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) {
    throw new ImportError("Die URL muss genau zum ausdrücklich bestätigten Entwicklungsprojekt passen.");
  }
  if (contact.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(contact)) {
    throw new ImportError("WIKIMEDIA_CONTACT_EMAIL muss eine gültige Kontakt-E-Mail-Adresse enthalten.");
  }
  return { url: url.origin, key, userAgent: `HolidayBuddiesImageImporter/1.0 (contact: ${contact})` };
}

function normalize(value) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("de");
}

export function groupDestinations(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (typeof row.name !== "string" || !row.name.trim() || typeof row.country !== "string" || !row.country.trim()) {
      throw new ImportError("Ungültiger Destinationsdatensatz.");
    }
    const key = JSON.stringify([normalize(row.name), normalize(row.country)]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "en"));
}

function text(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => {
      const code = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : " ";
    })
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/gi, (_, entity) =>
      ({ amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " })[entity.toLowerCase()])
    .replace(/&[a-z][a-z0-9]+;/gi, " ").replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function trustedUrl(value, host, pathPrefix) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === host && !url.port && !url.username && !url.password
      && !url.hash && url.pathname.startsWith(pathPrefix);
  } catch { return false; }
}

function trustedThumbnail(value) {
  return trustedUrl(value, "upload.wikimedia.org", "/wikipedia/commons/")
    || trustedUrl(value, "thumb.wikimedia.org", "/wikipedia/commons/");
}

function containsTerm(haystack, term) {
  const source = normalize(haystack);
  const needle = normalize(term);
  let index = source.indexOf(needle);
  while (index !== -1) {
    const before = index === 0 ? "" : source[index - 1];
    const after = source[index + needle.length] ?? "";
    if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after)) return true;
    index = source.indexOf(needle, index + 1);
  }
  return false;
}

export function selectCandidate(pages, destination) {
  const [place, country] = termsFor(destination) ?? [destination.name, destination.country];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata;
    if (!meta || !Number.isSafeInteger(page.pageid) || !/^File:/i.test(page.title ?? "")) continue;
    const license = text(meta.LicenseShortName?.value);
    const licenseUrl = meta.LicenseUrl?.value;
    const canonicalLicenseUrl = LICENSES.get(license);
    const author = text(meta.Artist?.value);
    const evidence = text([page.title, meta.ObjectName?.value, meta.ImageDescription?.value,
      meta.Categories?.value].filter(Boolean).join(" "));
    const photoEvidence = text([page.title, meta.ImageDescription?.value, meta.Categories?.value].filter(Boolean).join(" "));
    if (!canonicalLicenseUrl || ![canonicalLicenseUrl, canonicalLicenseUrl.slice(0, -1),
      canonicalLicenseUrl.replace("https:", "http:"), canonicalLicenseUrl.slice(0, -1).replace("https:", "http:")].includes(licenseUrl)
        || !author || author.length > 500
        || !containsTerm(evidence, place) || !containsTerm(evidence, country)
        || !/\b(photographs?|photography|photos?|fotografien?|fotografiert|fotos?|beach|coast|lake|landscape|strand|küste|dunes|panorama)\b/i.test(photoEvidence)
        || /\b(map|karte|painting|drawing|illustration|logo|flag|nudist|naturism)\b/i.test(photoEvidence)) continue;
    if (!trustedUrl(info.descriptionurl, "commons.wikimedia.org", "/wiki/File:")
        || !trustedThumbnail(info.thumburl)
        || !["image/jpeg", "image/png"].includes(info.mime)
        || !Number.isInteger(info.thumbwidth) || !Number.isInteger(info.thumbheight)
        || info.thumbwidth < 640 || info.thumbheight < 400 || info.thumbwidth > 1280 || info.thumbheight > 1280) continue;
    return { url: info.thumburl, mime: info.mime, sourceUrl: info.descriptionurl,
      attribution: `${text(page.title.replace(/^File:/i, ""))} · ${author} · ${license} · ${canonicalLicenseUrl} · zugeschnitten und verkleinert`, license };
  }
  return null;
}

async function request(fetcher, url, options = {}) {
  let response;
  try {
    response = await fetcher(url, { ...options, redirect: "error", signal: AbortSignal.timeout(15000) });
  } catch { throw new ImportError("Netzwerkfehler oder Zeitüberschreitung bei Wikimedia."); }
  if (!response.ok) throw new ImportError(`Wikimedia-HTTP-Fehler ${response.status}.`);
  return response;
}

export async function searchCommons(fetcher, destination, userAgent) {
  // Quotes and search operators from destination data must not alter the query.
  const terms = (termsFor(destination) ?? [destination.name, destination.country])
    .map((s) => s.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim());
  if (terms.some((term) => !term)) return null;
  const reviewedTitle = termsFor(destination) && REVIEWED_TITLES.get(normalize(destination.name));
  if (termsFor(destination) && !reviewedTitle) return null;
  const params = new URLSearchParams({
    action: "query", format: "json", formatversion: "2",
    prop: "imageinfo", iiprop: "url|mime|size|extmetadata", iiurlwidth: "960",
    iiextmetadatafilter: "Artist|LicenseShortName|LicenseUrl|ImageDescription|ObjectName|Categories",
  });
  if (reviewedTitle) params.set("titles", reviewedTitle);
  else {
    params.set("generator", "search");
    params.set("gsrsearch", terms.map((term) => `"${term}"`).join(" "));
    params.set("gsrnamespace", "6");
    params.set("gsrlimit", "30");
  }
  const response = await request(fetcher, `${API}?${params}`, {
    headers: { "User-Agent": userAgent },
  });
  let result;
  try { result = await response.json(); } catch { throw new ImportError("Ungültige Wikimedia-API-Antwort."); }
  if (result.error || result.warnings) throw new ImportError("Wikimedia-API meldet einen Fehler oder eine Warnung.");
  const pages = result.query?.pages ?? [];
  return selectCandidate(reviewedTitle ? pages.filter((page) => page.title === reviewedTitle) : pages, destination);
}

export async function downloadThumbnail(fetcher, candidate, userAgent) {
  if (!trustedThumbnail(candidate.url)) throw new ImportError("Ungültige Thumbnail-URL.");
  const response = await request(fetcher, candidate.url, {
    headers: { "User-Agent": userAgent },
  });
  const length = response.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) throw new ImportError("Thumbnail überschreitet das Größenlimit.");
  if (response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== candidate.mime) {
    throw new ImportError("Unerwarteter Thumbnail-Medientyp.");
  }
  if (!response.body) throw new ImportError("Thumbnail ohne Datenstrom.");
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new ImportError("Thumbnail überschreitet das Größenlimit.");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (size > MAX_BYTES) throw error;
    throw new ImportError("Thumbnail konnte nicht vollständig gelesen werden.");
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks, size);
  const dimensions = imageDimensions(bytes, candidate.mime);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    throw new ImportError("Thumbnail hat keinen gültigen Bildheader.");
  }
  if (dimensions.width > 1280 || dimensions.height > 1280) {
    throw new ImportError("Thumbnail überschreitet das Limit von 1280 Pixeln.");
  }
  return bytes;
}

export async function makeWebp(bytes) {
  const image = sharp(bytes, { failOn: "error", limitInputPixels: 1_638_400 });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width < 640 || metadata.height < 400) {
    throw new ImportError("Bild ist für 640 × 400 Pixel zu klein.");
  }
  return image.rotate().resize(640, 400, { fit: "cover", position: "attention", withoutEnlargement: true })
    .webp({ quality: 80 }).toBuffer();
}

function imageDimensions(bytes, mime) {
  if (mime === "image/png") {
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        || bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (mime !== "image/jpeg" || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  for (let offset = 2; offset + 4 <= bytes.length;) {
    if (bytes[offset++] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda || marker === undefined) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return null;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)
        || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      if (length < 8) return null;
      return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

export async function loadDestinations(client) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client.from("destinations").select(FIELDS).order("id").range(offset, offset + PAGE_SIZE - 1);
    if (error || !Array.isArray(data)) throw new ImportError("Destinations konnten nicht gelesen werden; Schema und Berechtigungen prüfen.");
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

async function searchReviewedCommons(fetcher, destination, userAgent) {
  if (!termsFor(destination) || !REVIEWED_TITLES.has(normalize(destination.name))) return null;
  return searchCommons(fetcher, destination, userAgent);
}

export async function runImport(client, fetcher = fetch, log = console.log, userAgent, convert = makeWebp, find = searchReviewedCommons) {
  const groups = groupDestinations(await loadDestinations(client));
  let imported = 0;
  let preserved = 0;
  let failed = 0;
  for (const [index, [key, rows]] of groups.entries()) {
    const fields = (row) => [row.image_path, row.image_source, row.image_source_url, row.image_attribution];
    if (rows.some((row) => fields(row).some((value) => value !== null))) {
      preserved += rows.length;
      if (rows.some((row) => fields(row).some((value) => typeof value !== "string" || !value.trim()))) {
        failed++;
        log(`Gruppe ${index + 1} unvollständig: vorhandene Bilddaten unverändert; gesamte Gruppe übersprungen.`);
      } else {
        log(`Gruppe ${index + 1}: vorhandene Bilddaten unverändert; gesamte Gruppe übersprungen.`);
      }
      continue;
    }
    try {
      const candidate = await find(fetcher, rows[0], userAgent);
      if (!candidate) throw new ImportError("Kein Foto mit passenden Suchmetadaten und zulässiger Lizenz gefunden.");
      const bytes = await convert(await downloadThumbnail(fetcher, candidate, userAgent));
      const groupHash = createHash("sha256").update(key).digest("hex");
      const contentHash = createHash("sha256").update(bytes).digest("hex");
      const path = `${groupHash}-${contentHash}.webp`;
      const { error: uploadError } = await client.storage.from(BUCKET).upload(path, bytes,
        { contentType: "image/webp", upsert: false });
      if (uploadError) throw new ImportError("Upload fehlgeschlagen (Bucket, Berechtigung oder bereits vorhandene Datei prüfen).");
      for (const row of rows) {
        const { data, error } = await client.from("destinations").update({
          image_path: path, image_source: "Wikimedia Commons", image_source_url: candidate.sourceUrl,
          image_attribution: candidate.attribution,
        }).eq("id", row.id).eq("name", row.name).eq("country", row.country)
          .is("image_path", null).is("image_source", null).is("image_source_url", null).is("image_attribution", null)
          .select("id");
        if (error || !Array.isArray(data) || data.length !== 1) {
          throw new ImportError("Ziel konnte nicht unverändert aktualisiert werden; Upload oder Teilupdates können bestehen bleiben.");
        }
        imported++;
      }
        log(`${rows[0].name}, ${rows[0].country}: Bild zugeordnet.`);
    } catch (error) {
      failed++;
      // Only locally generated messages are safe to print; never print SDK or network errors.
      const safe = error instanceof ImportError ? error.message : "Import fehlgeschlagen; Details nicht ausgegeben.";
      log(`${rows[0].name}, ${rows[0].country}: ${safe}`);
    }
  }
  log(`Ergebnis: ${imported} Ziele aktualisiert, ${preserved} wegen vorhandener Bilddaten übersprungen, ${failed} Gruppen fehlgeschlagen.`);
  return { imported, preserved, failed };
}

class ImportError extends Error {}

async function main() {
  const { url, key, userAgent } = validateConfig(process.env);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const result = await runImport(client, fetch, console.log, userAgent);
  if (result.failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const safe = error instanceof ImportError ? error.message : "Unerwarteter Fehler; Details nicht ausgegeben.";
    console.error(`Import gestoppt: ${safe}`);
    process.exitCode = 1;
  });
}
