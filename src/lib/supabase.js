import { createClient } from "@supabase/supabase-js";

let client;
let persistSession = true;

const authStorage = {
  getItem(key) {
    const temporary = sessionStorage.getItem(key);
    if (temporary !== null) {
      persistSession = false;
      return temporary;
    }
    const persistent = localStorage.getItem(key);
    if (persistent !== null) persistSession = true;
    return persistent;
  },
  setItem(key, value) {
    const target = persistSession ? localStorage : sessionStorage;
    const other = persistSession ? sessionStorage : localStorage;
    target.setItem(key, value);
    other.removeItem(key);
  },
  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function setAuthPersistence(remember) {
  persistSession = remember;
}

export function getSupabase() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase ist nicht konfiguriert. URL und Publishable Key fehlen.");
  }
  client = createClient(url, key, { auth: { storage: authStorage } });
  return client;
}
