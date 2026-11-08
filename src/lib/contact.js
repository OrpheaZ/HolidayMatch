export async function requestFamilyContact(client, tripReference) {
  const { data, error } = await client.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (!data.user) return false;
  const result = await client.rpc("request_contact", { trip_reference: tripReference });
  if (result.error) throw result.error;
  return true;
}

export function contactErrorMessage(error) {
  if (error.code === "23505") return "Für diese Reise hast du bereits eine Kontaktanfrage gestellt.";
  if (error.code === "42501") return "Diese Familie ist für eine Kontaktanfrage nicht mehr verfügbar. Bitte aktualisiere die Suche.";
  return "Die Kontaktanfrage konnte nicht gespeichert werden. Bitte versuche es erneut.";
}
