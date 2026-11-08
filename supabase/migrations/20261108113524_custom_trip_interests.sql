create function public.valid_trip_interests(values_to_check text[])
returns boolean language sql immutable set search_path = '' as $$
  select cardinality(values_to_check) <= 20
    and not exists (
      select 1 from unnest(values_to_check) as entry(value)
      where value is null or char_length(btrim(value)) not between 1 and 50
        or value ~ '[[:cntrl:]]'
    );
$$;

alter table public.trips drop constraint trips_interests_check;
alter table public.trips add constraint trips_interests_check
  check (public.valid_trip_interests(interests));
