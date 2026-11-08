alter table public.trips
  add column accommodation text,
  add column legacy_region text,
  add constraint trips_accommodation_length check (
    accommodation is null or char_length(btrim(accommodation)) between 1 and 150
  ),
  add constraint trips_legacy_region_length check (
    legacy_region is null or char_length(btrim(legacy_region)) between 1 and 150
  );
