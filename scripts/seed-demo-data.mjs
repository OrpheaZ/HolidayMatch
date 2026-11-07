import { createHash, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

const MARKER = "holidaybuddies-demo-v1";
const FAMILY_COUNT = 200;
const YEAR = 2027;
const FIRST_NAMES = ["Sophie", "Jonas", "Mila", "Leon", "Lena", "Noah", "Elena", "Luca", "Mara", "Emil", "Nora", "Felix", "Emma", "Anton", "Lea", "Paul", "Mia", "Ben", "Anna", "Elias"];
const LAST_NAMES = ["Sonnenfeld", "Wolkenberg", "Wiesental", "Sommerhain", "Meeresau", "Lindenwald", "Morgenstern", "Blumenhain", "Sonnental", "Wellenbach"];
const LANGUAGES = ["Deutsch", "Englisch", "Bulgarisch", "Französisch", "Spanisch", "Türkisch", "Niederländisch", "Italienisch"];
const DESTINATIONS = [
  ["Mallorca", "Spanien", "Alcúdia"], ["Mallorca", "Spanien", "Cala Millor"],
  ["Kreta", "Griechenland", "Chania"], ["Kreta", "Griechenland", "Rethymno"],
  ["Antalya", "Türkei", "Side"], ["Antalya", "Türkei", "Belek"],
  ["Gardasee", "Italien", "Riva del Garda"], ["Gardasee", "Italien", "Lazise"],
  ["Istrien", "Kroatien", "Poreč"], ["Dalmatien", "Kroatien", "Zadar"],
  ["Teneriffa", "Spanien", "Costa Adeje"], ["Gran Canaria", "Spanien", "Maspalomas"],
  ["Fuerteventura", "Spanien", "Corralejo"], ["Lanzarote", "Spanien", "Playa Blanca"],
  ["Rhodos", "Griechenland", "Faliraki"], ["Kos", "Griechenland", "Marmari"],
  ["Algarve", "Portugal", "Albufeira"], ["Costa Brava", "Spanien", "Roses"],
  ["Rimini", "Italien", "Emilia-Romagna"], ["Bibione", "Italien", "Venetien"],
  ["Sardinien", "Italien", "Olbia"], ["Sizilien", "Italien", "Cefalù"],
  ["Goldstrand", "Bulgarien", "Warna"], ["Sonnenstrand", "Bulgarien", "Burgas"],
  ["Saaremaa", "Estland", "Kuressaare"],
];

export function demoId(kind, index) {
  const bytes = createHash("sha256").update(`${MARKER}:${kind}:${index}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function demoEmail(index) {
  return `holidaybuddies-demo-v1-${String(index + 1).padStart(3, "0")}@example.com`;
}

function dateOffset(date, offset) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function generateData(userIds) {
  if (userIds.length !== FAMILY_COUNT || userIds.some((id) => !id)) throw new Error("200 Auth-Benutzer-IDs erforderlich.");
  const destinations = DESTINATIONS.map(([name, country, region], i) => ({
    id: demoId("destination", i), name: `${name} [Demo]`, country, region,
  }));
  const profiles = userIds.map((user_id, i) => ({
    user_id,
    display_name: `Familie ${FIRST_NAMES[i % 20]} ${LAST_NAMES[Math.floor(i / 20)]} [Demo]`,
    languages: [...new Set([LANGUAGES[i % LANGUAGES.length], "Deutsch", ...(i % 3 === 0 ? ["Englisch"] : [])])],
  }));
  const children = [];
  const childrenByUser = [];
  userIds.forEach((user_id, i) => {
    const count = i < 50 ? 3 : i < 100 ? 2 : 1;
    childrenByUser[i] = [];
    for (let j = 0; j < count; j += 1) {
      const child = {
        id: demoId("child", children.length), user_id,
        birth_year: YEAR - 2 - ((i * 3 + j * 4) % 14),
        gender: (i + j) % 5 === 0 ? null : (i + j) % 2 ? "Junge" : "Mädchen",
      };
      children.push(child);
      childrenByUser[i].push(child);
    }
  });
  const trips = Array.from({ length: 300 }, (_, i) => {
    const season = i % 10 < 7 ? `${YEAR}-07-10` : i % 10 === 7 ? `${YEAR}-04-03` : i % 10 === 8 ? `${YEAR}-10-09` : `${YEAR}-12-18`;
    const start_date = dateOffset(season, i % 8);
    return {
      id: demoId("trip", i), public_id: demoId("public-trip", i),
      user_id: userIds[i % FAMILY_COUNT],
      destination_id: destinations[i === 299 ? 24 : i % 24].id,
      start_date, end_date: dateOffset(start_date, 5 + (i % 17)), is_public: i % 5 !== 0,
    };
  });
  // The solitary destination must be publicly visible so that empty matches are testable.
  trips[299].is_public = true;
  const trip_children = trips.flatMap((trip, i) =>
    childrenByUser[i % FAMILY_COUNT].map((child) => ({ trip_id: trip.id, child_id: child.id, user_id: trip.user_id })));
  const contactPairs = trips.filter((trip) => trip.is_public).flatMap((trip) =>
    trips.filter((other) => other.user_id !== trip.user_id
      && other.destination_id === trip.destination_id
      && other.start_date <= trip.end_date && trip.start_date <= other.end_date)
      .filter((other, index, matches) => matches.findIndex((match) => match.user_id === other.user_id) === index)
      .map((other) => ({ trip, sender_id: other.user_id })));
  if (contactPairs.length < 40) throw new Error("Nicht genügend überlappende Reisen für Demo-Kontaktanfragen.");
  const contact_requests = contactPairs.slice(0, 40).map(({ trip, sender_id }, i) => ({
    id: demoId("request", i), trip_id: trip.id, recipient_id: trip.user_id,
    sender_id, status: ["pending", "accepted", "rejected"][i % 3],
  }));
  return { destinations, profiles, children, trips, trip_children, contact_requests };
}

function validateConfig(env) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const ref = env.HOLIDAYBUDDIES_DEV_PROJECT_REF;
  if (!env.SUPABASE_URL || !key || !ref || env.HOLIDAYBUDDIES_CONFIRM_DEV !== "yes") {
    throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HOLIDAYBUDDIES_DEV_PROJECT_REF und HOLIDAYBUDDIES_CONFIRM_DEV=yes sind erforderlich.");
  }
  const url = new URL(env.SUPABASE_URL);
  if (!/^[a-z0-9]+$/.test(ref) || url.protocol !== "https:" || url.hostname !== `${ref}.supabase.co`
      || url.port || url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) {
    throw new Error("Die URL muss genau zum ausdrücklich bestätigten Supabase-Entwicklungsprojekt passen.");
  }
  return { base: url.origin, key };
}

async function request(config, path, { method = "GET", body, headers = {} } = {}) {
  const response = await fetch(`${config.base}${path}`, {
    method,
    headers: {
      apikey: config.key, Authorization: `Bearer ${config.key}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${method} ${path.split("?")[0]} fehlgeschlagen (HTTP ${response.status}). Keine Zugangsdaten ausgegeben.`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function listAll(config, table, columns) {
  const rows = [];
  const order = table === "trip_children" ? "trip_id.asc,child_id.asc"
    : table === "user_roles" ? "user_id.asc,role.asc" : `${columns.split(",")[0]}.asc`;
  for (let offset = 0; ; offset += 500) {
    const page = await request(config, `/rest/v1/${table}?select=${columns}&limit=500&offset=${offset}&order=${order}`);
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

async function listUsers(config) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const result = await request(config, `/auth/v1/admin/users?page=${page}&per_page=200`);
    if (!Array.isArray(result?.users)) throw new Error("Unerwartete Antwort der Auth-Admin-API.");
    users.push(...result.users);
    if (result.users.length < 200) return users;
  }
}

function assertDemoUsers(users) {
  const expected = new Set(Array.from({ length: FAMILY_COUNT }, (_, i) => demoEmail(i)));
  const byEmail = new Map();
  for (const user of users) {
    const email = user.email?.toLowerCase();
    if (!expected.has(email) || user.app_metadata?.demo_seed !== MARKER || byEmail.has(email)) {
      throw new Error("Das Projekt enthält ein fremdes oder nicht eindeutig markiertes Auth-Konto. Seed abgebrochen.");
    }
    byEmail.set(email, user.id);
  }
  return byEmail;
}

const TABLES = {
  destinations: ["id", "name", "country", "region"],
  profiles: ["user_id", "display_name", "languages"],
  children: ["id", "user_id", "birth_year", "gender"],
  trips: ["id", "public_id", "user_id", "destination_id", "start_date", "end_date", "is_public"],
  trip_children: ["trip_id", "child_id", "user_id"],
  contact_requests: ["id", "trip_id", "recipient_id", "sender_id", "status"],
  user_roles: ["user_id", "role"],
};

function rowKey(table, row) {
  return table === "trip_children" ? `${row.trip_id}:${row.child_id}`
    : table === "user_roles" ? `${row.user_id}:${row.role}` : row.id ?? row.user_id;
}

export function assertExistingRows(table, existing, expected) {
  const allowed = new Map(expected.map((row) => [rowKey(table, row), row]));
  for (const row of existing) {
    const match = allowed.get(rowKey(table, row));
    if (!match || TABLES[table].some((column) => JSON.stringify(row[column]) !== JSON.stringify(match[column]))) {
      throw new Error(`Tabelle ${table} enthält fremde oder veränderte Daten. Seed abgebrochen; nichts wird überschrieben.`);
    }
  }
}

async function readTables(config) {
  const result = {};
  for (const [table, columns] of Object.entries(TABLES)) result[table] = await listAll(config, table, columns.join(","));
  return result;
}

function assertExistingDataset(tables, byEmail) {
  // Missing accounts receive placeholder IDs solely for checking existing rows.
  const ids = Array.from({ length: FAMILY_COUNT }, (_, i) => byEmail.get(demoEmail(i)) ?? demoId("missing-user", i));
  const expected = generateData(ids);
  expected.user_roles = [...byEmail.values()].map((user_id) => ({ user_id, role: "user" }));
  for (const table of Object.keys(TABLES)) assertExistingRows(table, tables[table], expected[table]);
}

async function insertRows(config, table, rows) {
  for (let offset = 0; offset < rows.length; offset += 100) {
    await request(config, `/rest/v1/${table}`, {
      method: "POST", body: rows.slice(offset, offset + 100),
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    });
  }
}

async function main() {
  const config = validateConfig(process.env);
  let byEmail = assertDemoUsers(await listUsers(config));
  assertExistingDataset(await readTables(config), byEmail);
  for (let i = 0; i < FAMILY_COUNT; i += 1) {
    const email = demoEmail(i);
    if (byEmail.has(email)) continue;
    const user = await request(config, "/auth/v1/admin/users", {
      method: "POST", body: {
        email, password: randomBytes(32).toString("base64url"), email_confirm: false,
        app_metadata: { demo_seed: MARKER },
      },
    });
    if (!user?.id || user.email?.toLowerCase() !== email || user.app_metadata?.demo_seed !== MARKER) {
      throw new Error("Auth-API lieferte kein eindeutig markiertes Testkonto; Ausführung gestoppt.");
    }
    byEmail.set(email, user.id);
  }
  byEmail = assertDemoUsers(await listUsers(config));
  const tables = await readTables(config);
  assertExistingDataset(tables, byEmail);
  const data = generateData(Array.from({ length: FAMILY_COUNT }, (_, i) => byEmail.get(demoEmail(i))));
  for (const table of ["destinations", "profiles", "children", "trips", "trip_children", "contact_requests"]) {
    await insertRows(config, table, data[table]);
  }
  const actual = await readTables(config);
  assertExistingDataset(actual, byEmail);
  for (const table of Object.keys(data)) {
    if (actual[table].length !== data[table].length) throw new Error(`Unvollständige Daten in ${table}; erneuter Aufruf setzt den Seed fort.`);
  }
  if (actual.user_roles.length !== FAMILY_COUNT) throw new Error("Nicht alle Testkonten haben ausschließlich die user-Rolle.");
  console.log(`Seed erfolgreich: ${byEmail.size} Familien, ${actual.children.length} Kinder, ${actual.destinations.length} Ziele, ${actual.trips.length} Reisen, ${actual.trip_children.length} Zuordnungen, ${actual.contact_requests.length} Kontaktanfragen.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(`Seed gestoppt: ${error.message}`); process.exitCode = 1; });
}
