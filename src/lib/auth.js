export async function register(client, { name, email, password, redirectTo }) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: name }, emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data;
}

export async function login(client, { email, password }) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function ensureProfile(client, user) {
  const { data: profile, error: readError } = await client
    .from("profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (readError) throw readError;
  if (profile) return;
  const name = user.user_metadata?.display_name;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    throw new Error("Dein Profil konnte nicht eingerichtet werden. Bitte wende dich an den Support.");
  }
  const { error } = await client.from("profiles").upsert(
    { user_id: user.id, display_name: name.trim() },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export function authErrorMessage(error) {
  switch (error?.code) {
    case "invalid_credentials": return "E-Mail-Adresse oder Passwort ist falsch.";
    case "email_not_confirmed": return "Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deiner E-Mail.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit": return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.";
    case "weak_password": return "Das Passwort erfüllt die Sicherheitsanforderungen nicht. Bitte wähle ein stärkeres Passwort.";
    case "email_address_invalid": return "Bitte gib eine gültige E-Mail-Adresse ein.";
    case "user_already_exists": return "Falls bereits ein Konto existiert, melde dich bitte an.";
    default: return "Die Anmeldung oder Registrierung ist fehlgeschlagen. Bitte versuche es erneut.";
  }
}
