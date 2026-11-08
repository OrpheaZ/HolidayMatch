alter table public.contact_requests
  add column message text check (message is null or char_length(btrim(message)) between 1 and 2000),
  add column interests text[] not null default '{}' check (
    cardinality(interests) <= 8 and interests <@ array[
      'Strand', 'Schwimmen', 'Ausflüge', 'Natur', 'Sport', 'Spielen', 'Kultur', 'Essen'
    ]::text[]
  );

create or replace function public.guard_contact_request_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user not in ('postgres', 'service_role') and not (select public.has_role('admin')) then
    if old.recipient_id is distinct from (select auth.uid())
      or new.id is distinct from old.id
      or new.sender_id is distinct from old.sender_id
      or new.recipient_id is distinct from old.recipient_id
      or new.trip_id is distinct from old.trip_id
      or new.created_at is distinct from old.created_at
      or new.message is distinct from old.message
      or new.interests is distinct from old.interests
      or old.status <> 'pending'
      or new.status not in ('accepted', 'rejected') then
      raise exception 'Contact request update is not permitted' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create function public.send_contact_message(p_trip_reference uuid, p_message text, p_interests text[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  requester uuid := (select auth.uid());
  recipient uuid;
  selected_trip uuid;
  request_id uuid;
begin
  if requester is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_message is null or char_length(btrim(p_message)) not between 1 and 2000
    or p_interests is null or cardinality(p_interests) > 8
    or array_position(p_interests, null) is not null
    or not (p_interests <@ array['Strand', 'Schwimmen', 'Ausflüge', 'Natur', 'Sport', 'Spielen', 'Kultur', 'Essen']::text[]) then
    raise exception 'Invalid message or interests' using errcode = '22023';
  end if;
  select t.id, t.user_id into selected_trip, recipient
  from public.trips t
  join public.trip_search_consent consent on consent.trip_id = t.id and consent.user_id = t.user_id
  where t.public_id = p_trip_reference and t.is_public and consent.share_family_details
  for update of t, consent;
  if selected_trip is null or recipient = requester then
    raise exception 'Trip is unavailable for contact' using errcode = '42501';
  end if;
  insert into public.contact_requests (sender_id, recipient_id, trip_id, message, interests)
  values (requester, recipient, selected_trip, btrim(p_message), p_interests) returning id into request_id;
  return request_id;
end;
$$;
revoke all on function public.send_contact_message(uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.send_contact_message(uuid, text, text[]) to authenticated;

create table public.family_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  primary key (user_id, trip_id)
);
alter table public.family_favorites enable row level security;
revoke all on public.family_favorites from public, anon, authenticated;

create function public.set_family_favorite(p_trip_reference uuid, p_favorite boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  requester uuid := (select auth.uid());
  selected_trip uuid;
begin
  if requester is null or p_favorite is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_favorite then
    select t.id into selected_trip from public.trips t
    join public.trip_search_consent consent on consent.trip_id = t.id and consent.user_id = t.user_id
    where t.public_id = p_trip_reference and t.is_public and consent.share_family_details and t.user_id <> requester
    for update of t, consent;
    if selected_trip is null then raise exception 'Trip is unavailable' using errcode = '42501'; end if;
    insert into public.family_favorites(user_id, trip_id) values (requester, selected_trip) on conflict do nothing;
  else
    delete from public.family_favorites f using public.trips t
    where f.user_id = requester and f.trip_id = t.id and t.public_id = p_trip_reference;
  end if;
end;
$$;
revoke all on function public.set_family_favorite(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_family_favorite(uuid, boolean) to authenticated;

create function public.my_family_favorites()
returns table (trip_reference uuid) language sql stable security definer set search_path = '' as $$
  select t.public_id from public.family_favorites f
  join public.trips t on t.id = f.trip_id
  where f.user_id = (select auth.uid())
  order by t.public_id;
$$;
revoke all on function public.my_family_favorites() from public, anon, authenticated;
grant execute on function public.my_family_favorites() to authenticated;

create function public.my_contacted_families()
returns table (trip_reference uuid, destination text, country text, start_date date, end_date date)
language sql stable security definer set search_path = '' as $$
  select t.public_id,
    case when t.is_public and coalesce(c.share_family_details, false) then coalesce(t.custom_destination, d.name) end,
    case when t.is_public and coalesce(c.share_family_details, false) then d.country end,
    case when t.is_public and coalesce(c.share_family_details, false) then t.start_date end,
    case when t.is_public and coalesce(c.share_family_details, false) then t.end_date end
  from public.contact_requests r
  join public.trips t on t.id = r.trip_id
  left join public.trip_search_consent c on c.trip_id = t.id and c.user_id = t.user_id
  left join public.destinations d on d.id = t.destination_id
  where r.sender_id = (select auth.uid())
  order by r.created_at desc, r.id;
$$;
revoke all on function public.my_contacted_families() from public, anon, authenticated;
grant execute on function public.my_contacted_families() to authenticated;
