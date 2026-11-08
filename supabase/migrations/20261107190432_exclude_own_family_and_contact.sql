create or replace function public.search_public_families()
returns table (
  trip_reference uuid, destination text, country text, region text,
  start_date date, end_date date, languages text[], children jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.public_id, coalesce(t.custom_destination, d.name), d.country,
    coalesce(t.custom_region, d.region), t.start_date, t.end_date,
    coalesce(t.trip_languages, p.languages),
    coalesce(
      (select jsonb_agg(jsonb_build_object('age', child -> 'age', 'gender', child -> 'gender') order by position)
       from jsonb_array_elements(t.trip_children_data) with ordinality as entries(child, position)),
      (select jsonb_agg(jsonb_build_object(
        'age', extract(year from t.start_date)::integer - c.birth_year,
        'gender', c.gender
      ) order by c.birth_year, c.id)
       from public.trip_children tc
       join public.children c on c.id = tc.child_id and c.user_id = tc.user_id
       where tc.trip_id = t.id and tc.user_id = t.user_id),
      '[]'::jsonb
    )
  from public.trips t
  join public.trip_search_consent consent on consent.trip_id = t.id and consent.user_id = t.user_id
  left join public.destinations d on d.id = t.destination_id
  join public.profiles p on p.user_id = t.user_id
  where t.is_public and consent.share_family_details
    and t.user_id is distinct from (select auth.uid())
  order by t.public_id;
$$;

create or replace function public.request_contact(trip_reference uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := (select auth.uid());
  recipient uuid;
  selected_trip uuid;
  request_id uuid;
begin
  if requester is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select t.id, t.user_id into selected_trip, recipient
  from public.trips t
  join public.trip_search_consent consent on consent.trip_id = t.id and consent.user_id = t.user_id
  where t.public_id = trip_reference and t.is_public and consent.share_family_details
  for update of t, consent;
  if selected_trip is null or recipient = requester then
    raise exception 'Trip is unavailable for contact' using errcode = '42501';
  end if;
  insert into public.contact_requests (sender_id, recipient_id, trip_id)
  values (requester, recipient, selected_trip)
  returning id into request_id;
  return request_id;
end;
$$;
