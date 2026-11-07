create table public.trip_search_consent (
  trip_id uuid primary key,
  user_id uuid not null,
  share_family_details boolean not null default false,
  foreign key (trip_id, user_id) references public.trips(id, user_id) on delete cascade
);

alter table public.trip_search_consent enable row level security;
revoke all on public.trip_search_consent from public, anon, authenticated;
grant select, insert, update, delete on public.trip_search_consent to authenticated, service_role;

create policy trip_search_consent_select on public.trip_search_consent for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trip_search_consent_insert on public.trip_search_consent for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trip_search_consent_update on public.trip_search_consent for update to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')))
  with check (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy trip_search_consent_delete on public.trip_search_consent for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));

insert into public.trip_search_consent (trip_id, user_id, share_family_details)
select t.id, t.user_id, true
from public.trips t
join auth.users u on u.id = t.user_id
where u.raw_app_meta_data ->> 'demo_seed' = 'holidaybuddies-demo-v1'
  and u.email ~ '^holidaybuddies-demo-v1-[0-9]{3}@example[.]com$';

create function public.search_public_families()
returns table (
  trip_reference uuid,
  destination text,
  country text,
  region text,
  start_date date,
  end_date date,
  languages text[],
  children jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.public_id, d.name, d.country, d.region, t.start_date, t.end_date,
    p.languages,
    coalesce(
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
  join public.destinations d on d.id = t.destination_id
  join public.profiles p on p.user_id = t.user_id
  where t.is_public and consent.share_family_details
  order by t.public_id;
$$;
revoke all on function public.search_public_families() from public, anon, authenticated;
grant execute on function public.search_public_families() to anon, authenticated;
