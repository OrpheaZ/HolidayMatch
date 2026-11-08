create function public.my_contacted_family_details()
returns table (
  trip_reference uuid, destination text, country text, region text,
  start_date date, end_date date, languages text[], children jsonb,
  contacted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.public_id, f.destination, f.country, f.region,
    f.start_date, f.end_date, f.languages, f.children, r.created_at
  from public.contact_requests r
  join public.trips t on t.id = r.trip_id
  left join public.search_public_families() f on f.trip_reference = t.public_id
  where r.sender_id = (select auth.uid())
  order by r.created_at desc, r.id;
$$;

revoke all on function public.my_contacted_family_details() from public, anon, authenticated;
grant execute on function public.my_contacted_family_details() to authenticated;
