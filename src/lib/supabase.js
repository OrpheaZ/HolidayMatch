import { createClient } from "@supabase/supabase-js";

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase ist nicht konfiguriert. URL und Publishable Key fehlen.");
  }
  return createClient(url, key);
}
