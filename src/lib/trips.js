function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function fetchOwnTrips(client, userId) {
  const [tripResult, profileResult] = await Promise.all([
    client.from("trips").select(
      "id,user_id,start_date,end_date,is_public,destination_id,custom_destination,custom_region,legacy_region,accommodation,trip_languages,trip_children_data,destinations(name,region,country),trip_children(children(birth_year,gender)),trip_search_consent(share_family_details)"
    ).eq("user_id", userId).order("start_date", { ascending: true }),
    client.from("profiles").select("languages").eq("user_id", userId).maybeSingle(),
  ]);
  const trips = unwrap(tripResult);
  const profile = unwrap(profileResult);
  return trips.map((trip) => ({
    id: trip.id,
    destination: trip.custom_destination ?? trip.destinations?.name ?? "",
    country: !trip.custom_destination || [
      trip.destinations?.name,
      `${trip.destinations?.name}, ${trip.destinations?.country}`,
    ].some((value) => value?.trim().toLocaleLowerCase("de") === trip.custom_destination.trim().toLocaleLowerCase("de"))
      ? trip.destinations?.country ?? "" : "",
    region: trip.custom_region ?? trip.destinations?.region ?? "",
    accommodation: trip.accommodation ?? "",
    legacyRegion: trip.legacy_region ?? "",
    locationData: {
      destinationId: trip.destination_id,
      customDestination: trip.custom_destination,
      customRegion: trip.custom_region,
    },
    start: trip.start_date,
    end: trip.end_date,
    children: trip.trip_children_data ?? trip.trip_children.map(({ children }) => ({
      age: Number(trip.start_date.slice(0, 4)) - children.birth_year,
      gender: children.gender,
    })),
    languages: trip.trip_languages ?? profile?.languages ?? [],
    visible: trip.is_public,
    detailsShared: Boolean(trip.trip_search_consent?.share_family_details),
  }));
}

export async function saveOwnTrip(client, userId, trip) {
  const unchanged = trip.existing && trip.destination === trip.existing.destination;
  const location = unchanged
    ? {
        destination_id: trip.existing.locationData.destinationId,
        custom_destination: trip.existing.locationData.customDestination,
        custom_region: trip.existing.locationData.customRegion,
        legacy_region: trip.existing.legacyRegion || null,
      }
    : {
        destination_id: trip.destinationId,
        custom_destination: trip.destination,
        custom_region: null,
        legacy_region: trip.existing?.legacyRegion || trip.existing?.region || null,
      };
  const values = {
    ...location,
    accommodation: trip.accommodation || null,
    trip_languages: trip.languages,
    trip_children_data: trip.children.map(({ age, gender }) => ({ age, gender: gender || null })),
    start_date: trip.start,
    end_date: trip.end,
  };
  const query = trip.id
    ? client.from("trips").update(values).eq("id", trip.id).eq("user_id", userId)
    : client.from("trips").insert({ ...values, user_id: userId, is_public: false });
  const data = unwrap(await query.select("id").single());
  return data.id;
}

export async function removeOwnTrip(client, userId, tripId) {
  unwrap(await client.from("trips").delete().eq("id", tripId).eq("user_id", userId).select("id").single());
}

export async function setOwnTripVisibility(client, tripId, visible) {
  unwrap(await client.rpc("set_trip_visibility", { p_trip_id: tripId, p_visible: visible }));
}
