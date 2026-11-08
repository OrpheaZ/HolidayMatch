alter table public.trips
  add column description text check (description is null or char_length(description) <= 1200),
  add column interests text[] not null default '{}' check (
    cardinality(interests) <= 20
    and array_position(interests, null) is null
    and interests <@ array['Strand', 'Schwimmen', 'Spielplatz', 'Sandburgen', 'Wassersport',
      'Wandern', 'Natur', 'Tiere', 'Fahrradfahren', 'Ausflüge', 'Kultur', 'Essen',
      'Brettspiele', 'Basteln', 'Freizeitpark', 'Sport', 'Entspannung', 'Camping']::text[]
  ),
  add column photo_path text unique check (
    photo_path is null or photo_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-images', 'trip-images', false, 5242880, array['image/jpeg','image/png','image/webp']);

create function public.trip_photo_readable(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trips t
    left join public.trip_search_consent c on c.trip_id = t.id and c.user_id = t.user_id
    where t.photo_path = p_path and
      (t.user_id = (select auth.uid()) or (t.is_public and coalesce(c.share_family_details, false)))
  );
$$;
revoke all on function public.trip_photo_readable(text) from public;
grant execute on function public.trip_photo_readable(text) to anon, authenticated;

create function public.validate_trip_photo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.photo_path is not null and (tg_op = 'INSERT' or new.photo_path is distinct from old.photo_path or new.user_id is distinct from old.user_id)
    and not exists (
      select 1 from storage.objects o where o.bucket_id = 'trip-images'
        and o.name = new.photo_path and o.owner_id = new.user_id::text
    ) then
    raise exception 'Trip photo is not owned by trip owner' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_trip_photo() from public, anon, authenticated;
create trigger validate_trip_photo before insert or update of photo_path, user_id on public.trips
for each row execute function public.validate_trip_photo();

create policy trip_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-images' and owner_id = (select auth.uid())::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$');
create policy trip_images_select on storage.objects for select to anon, authenticated
  using (bucket_id = 'trip-images' and (owner_id = (select auth.uid())::text or public.trip_photo_readable(name)));
create policy trip_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'trip-images' and owner_id = (select auth.uid())::text
    and not exists (select 1 from public.trips t where t.photo_path = storage.objects.name));

create function public.search_public_families_details()
returns table (
  trip_reference uuid, destination text, country text, region text,
  start_date date, end_date date, languages text[], children jsonb,
  description text, interests text[], photo_path text
) language sql stable security definer set search_path = '' as $$
  select f.trip_reference, f.destination, f.country, f.region, f.start_date, f.end_date,
    f.languages, f.children, t.description, t.interests, t.photo_path
  from public.search_public_families() f
  join public.trips t on t.public_id = f.trip_reference
  order by f.trip_reference;
$$;
revoke all on function public.search_public_families_details() from public;
grant execute on function public.search_public_families_details() to anon, authenticated;

create function public.my_contacted_family_details_v2()
returns table (
  trip_reference uuid, destination text, country text, region text,
  start_date date, end_date date, languages text[], children jsonb,
  contacted_at timestamptz, description text, interests text[], photo_path text
) language sql stable security definer set search_path = '' as $$
  select c.trip_reference, c.destination, c.country, c.region, c.start_date, c.end_date,
    c.languages, c.children, c.contacted_at, f.description, f.interests, f.photo_path
  from public.my_contacted_family_details() c
  left join public.search_public_families_details() f on f.trip_reference = c.trip_reference
  order by c.contacted_at desc, c.trip_reference;
$$;
revoke all on function public.my_contacted_family_details_v2() from public, anon, authenticated;
grant execute on function public.my_contacted_family_details_v2() to authenticated;
