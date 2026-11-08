export async function requestFamilyContact(client, tripReference, message, interests) {
  const { data, error } = await client.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (!data.user) return false;
  const result = await client.rpc("send_contact_message", {
    p_trip_reference: tripReference, p_message: message, p_interests: interests,
  });
  if (result.error) throw result.error;
  return true;
}

export async function fetchPersonalReferences(client, rpc) {
  const rows = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.rpc(rpc).range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

export async function setFamilyFavorite(client, tripReference, favorite) {
  const { error } = await client.rpc("set_family_favorite", {
    p_trip_reference: tripReference, p_favorite: favorite,
  });
  if (error) throw error;
}

export async function fetchReceivedContacts(client, userId) {
  const rows = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from("contact_requests")
      .select("id,trip_id,message,interests,created_at,status")
      .eq("recipient_id", userId).order("created_at", { ascending: false }).order("id")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

export function contactErrorMessage(error) {
  if (error.code === "23505") return "Für diese Reise hast du bereits eine Kontaktanfrage gestellt.";
  if (error.code === "42501") return "Diese Familie ist für eine Kontaktanfrage nicht mehr verfügbar. Bitte aktualisiere die Suche.";
  return "Die Kontaktanfrage konnte nicht gespeichert werden. Bitte versuche es erneut.";
}
