create function public.search_public_families_newest()
returns table (
  trip_reference uuid, destination text, country text, region text,
  start_date date, end_date date, languages text[], children jsonb,
  description text, interests text[], photo_path text, sort_position bigint
) language sql stable security definer set search_path = '' as $$
  select f.trip_reference, f.destination, f.country, f.region, f.start_date, f.end_date,
    f.languages, f.children, f.description, f.interests, f.photo_path,
    row_number() over (order by t.created_at desc, f.trip_reference)
  from public.search_public_families_details() f
  join public.trips t on t.public_id = f.trip_reference;
$$;
revoke all on function public.search_public_families_newest() from public;
grant execute on function public.search_public_families_newest() to anon, authenticated;
