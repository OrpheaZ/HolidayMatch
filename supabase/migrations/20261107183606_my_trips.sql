create function public.valid_trip_children(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(value) <> 'array' then false
    when jsonb_array_length(value) not between 1 and 6 then false
    else not exists (
      select 1 from jsonb_array_elements(value) child
      where jsonb_typeof(child) <> 'object'
        or jsonb_typeof(child -> 'age') is distinct from 'number'
        or not ((child ->> 'age') ~ '^(0|[1-9]|1[0-8])$')
        or (child -> 'gender' <> 'null'::jsonb
            and (jsonb_typeof(child -> 'gender') is distinct from 'string'
                 or child ->> 'gender' not in ('Junge', 'Mädchen')))
        or not (child ? 'gender')
    ) end;
$$;

alter table public.trips alter column destination_id drop not null;
alter table public.trips
  add column custom_destination text,
  add column custom_region text,
  add column trip_languages text[],
  add column trip_children_data jsonb,
  add constraint trips_destination_required check (
    destination_id is not null or
    (custom_destination is not null and char_length(btrim(custom_destination)) between 1 and 150)
  ),
  add constraint trips_custom_destination_length check (
    custom_destination is null or char_length(btrim(custom_destination)) between 1 and 150
  ),
  add constraint trips_custom_region_length check (
    custom_region is null or char_length(btrim(custom_region)) between 1 and 150
  ),
  add constraint trips_languages_valid check (
    trip_languages is null or (cardinality(trip_languages) between 1 and 16
      and array_position(trip_languages, null) is null and array_position(trip_languages, '') is null)
  ),
  add constraint trips_children_valid check (
    trip_children_data is null or public.valid_trip_children(trip_children_data)
  );

create function public.set_trip_visibility(p_trip_id uuid, p_visible boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := (select auth.uid());
begin
  if owner_id is null or p_visible is null then
    raise exception 'Authentication and visibility are required' using errcode = '42501';
  end if;
  update public.trips set is_public = p_visible
  where id = p_trip_id and user_id = owner_id;
  if not found then
    raise exception 'Trip not found or not owned by user' using errcode = '42501';
  end if;
  insert into public.trip_search_consent (trip_id, user_id, share_family_details)
  values (p_trip_id, owner_id, p_visible)
  on conflict (trip_id) do update set share_family_details = excluded.share_family_details
  where public.trip_search_consent.user_id = owner_id;
end;
$$;
revoke all on function public.set_trip_visibility(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_trip_visibility(uuid, boolean) to authenticated;

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
    coalesce(t.trip_children_data,
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
  order by t.public_id;
$$;
