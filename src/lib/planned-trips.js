export async function fetchPlannedTrips(client, today) {
  const { data, error } = await client.rpc("search_public_families")
    .gte("end_date", today)
    .order("start_date", { ascending: true })
    .order("trip_reference", { ascending: true })
    .limit(4);
  if (error) throw error;
  return data;
}

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
