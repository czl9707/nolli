alter table public.architectures
  add column latitude double precision not null default 0,
  add column longitude double precision not null default 0;

update public.architectures
  set latitude = st_y(coordinates::geometry),
      longitude = st_x(coordinates::geometry)
  where coordinates is not null;

drop index if exists public.idx_architectures_coordinates;

alter table public.architectures
  drop column coordinates;

drop extension if exists postgis;

create index idx_architectures_latitude on public.architectures (latitude);
create index idx_architectures_longitude on public.architectures (longitude);

create policy "public read" on public.countries for select to anon using (true);
create policy "public read" on public.cities for select to anon using (true);
create policy "public read" on public.architects for select to anon using (true);
create policy "public read" on public.architectures for select to anon using (true);
create policy "public read" on public.architecture_photos for select to anon using (true);
create policy "public read" on public.architecture_notes for select to anon using (true);
create policy "public read" on public.architecture_links for select to anon using (true);
