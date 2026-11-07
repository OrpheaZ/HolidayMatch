create type public.app_role as enum ('user', 'admin');
create type public.contact_request_status as enum ('pending', 'accepted', 'rejected');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  languages text[] not null default '{}' check (
    cardinality(languages) <= 16
    and array_position(languages, null) is null
    and array_position(languages, '') is null
  ),
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_year integer not null check (birth_year between 1900 and extract(year from current_date)::integer),
  gender text check (gender in ('Junge', 'Mädchen')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 150),
  country text not null check (char_length(btrim(country)) between 1 and 100),
  region text check (region is null or char_length(btrim(region)) between 1 and 150)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  unique (id, user_id)
);

create table public.trip_children (
  trip_id uuid not null,
  child_id uuid not null,
  user_id uuid not null,
  primary key (trip_id, child_id),
  foreign key (trip_id, user_id) references public.trips(id, user_id) on delete cascade,
  foreign key (child_id, user_id) references public.children(id, user_id) on delete cascade
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null,
  status public.contact_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  foreign key (trip_id, recipient_id) references public.trips(id, user_id) on delete cascade,
  unique (sender_id, trip_id)
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

create index profiles_languages_gin_idx on public.profiles using gin (languages);
create index children_user_birth_year_idx on public.children (user_id, birth_year);
create index children_birth_year_idx on public.children (birth_year);
create index trips_user_idx on public.trips (user_id);
create index trips_matching_idx on public.trips (destination_id, start_date, end_date) where is_public;
create index trip_children_child_idx on public.trip_children (child_id, user_id);
create index contact_requests_recipient_idx on public.contact_requests (recipient_id, status);
create index contact_requests_trip_idx on public.contact_requests (trip_id, recipient_id);

create function public.has_role(requested_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = requested_role
  );
$$;
revoke all on function public.has_role(public.app_role) from public, anon, authenticated;
grant execute on function public.has_role(public.app_role) to authenticated, service_role;

create function public.assign_default_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;
revoke all on function public.assign_default_role() from public, anon, authenticated;

create trigger holidaybuddies_assign_default_role
after insert on auth.users
for each row execute function public.assign_default_role();

insert into public.user_roles (user_id, role)
select id, 'user'::public.app_role from auth.users
on conflict (user_id, role) do nothing;

create function public.guard_contact_request_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role') and not (select public.has_role('admin')) then
    if old.recipient_id is distinct from (select auth.uid())
      or new.id is distinct from old.id
      or new.sender_id is distinct from old.sender_id
      or new.recipient_id is distinct from old.recipient_id
      or new.trip_id is distinct from old.trip_id
      or new.created_at is distinct from old.created_at
      or old.status <> 'pending'
      or new.status not in ('accepted', 'rejected') then
      raise exception 'Contact request update is not permitted' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_contact_request_update() from public, anon, authenticated;
create trigger guard_contact_request_update
before update on public.contact_requests
for each row execute function public.guard_contact_request_update();

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.destinations enable row level security;
alter table public.trips enable row level security;
alter table public.trip_children enable row level security;
alter table public.contact_requests enable row level security;
alter table public.user_roles enable row level security;

revoke all on public.profiles, public.children, public.destinations, public.trips,
  public.trip_children, public.contact_requests, public.user_roles from public, anon, authenticated;
grant select on public.destinations to anon;
grant select, insert, update, delete on public.profiles, public.children, public.destinations,
  public.trips, public.trip_children, public.contact_requests, public.user_roles to authenticated, service_role;

create policy profiles_select on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy profiles_update on public.profiles for update to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy profiles_delete on public.profiles for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));

create policy children_select on public.children for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy children_insert on public.children for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy children_update on public.children for update to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy children_delete on public.children for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));

create policy destinations_read on public.destinations for select to anon, authenticated
  using (true);
create policy destinations_admin_insert on public.destinations for insert to authenticated
  with check ((select public.has_role('admin')));
create policy destinations_admin_update on public.destinations for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy destinations_admin_delete on public.destinations for delete to authenticated
  using ((select public.has_role('admin')));

create policy trips_select on public.trips for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trips_insert on public.trips for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trips_update on public.trips for update to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trips_delete on public.trips for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));

create policy trip_children_select on public.trip_children for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trip_children_insert on public.trip_children for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trip_children_update on public.trip_children for update to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trip_children_delete on public.trip_children for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));

create policy contact_requests_select on public.contact_requests for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()) or (select public.has_role('admin')));
create policy contact_requests_insert on public.contact_requests for insert to authenticated
  with check ((select public.has_role('admin')));
create policy contact_requests_update on public.contact_requests for update to authenticated
  using (recipient_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (recipient_id = (select auth.uid()) or (select public.has_role('admin')));
create policy contact_requests_delete on public.contact_requests for delete to authenticated
  using ((sender_id = (select auth.uid()) and status = 'pending')
    or recipient_id = (select auth.uid()) or (select public.has_role('admin')));

create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy user_roles_insert on public.user_roles for insert to authenticated
  with check (user_id <> (select auth.uid()) and (select public.has_role('admin')));
create policy user_roles_update on public.user_roles for update to authenticated
  using (user_id <> (select auth.uid()) and (select public.has_role('admin')))
  with check (user_id <> (select auth.uid()) and (select public.has_role('admin')));
create policy user_roles_delete on public.user_roles for delete to authenticated
  using (user_id <> (select auth.uid()) and (select public.has_role('admin')));

create function public.list_public_trips()
returns table (trip_reference uuid, destination text, country text, region text, start_date date, end_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select t.public_id, d.name, d.country, d.region, t.start_date, t.end_date
  from public.trips t
  join public.destinations d on d.id = t.destination_id
  where t.is_public;
$$;
revoke all on function public.list_public_trips() from public, anon, authenticated;
grant execute on function public.list_public_trips() to anon, authenticated, service_role;

create function public.request_contact(trip_reference uuid)
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
  where t.public_id = trip_reference and t.is_public
  for update;
  if selected_trip is null or recipient = requester then
    raise exception 'Trip is unavailable for contact' using errcode = '42501';
  end if;
  insert into public.contact_requests (sender_id, recipient_id, trip_id)
  values (requester, recipient, selected_trip)
  returning id into request_id;
  return request_id;
end;
$$;
revoke all on function public.request_contact(uuid) from public, anon, authenticated;
grant execute on function public.request_contact(uuid) to authenticated, service_role;
