create table public.countries (
  id integer primary key generated always as identity,
  code text unique not null,
  name text not null
);

create table public.cities (
  id integer primary key generated always as identity,
  name text not null,
  country_id integer not null references public.countries (id) on delete cascade,
  unique (name, country_id)
);

create table public.architects (
  id integer primary key generated always as identity,
  country_id integer not null references public.countries (id) on delete cascade,
  name text unique not null
);

create extension if not exists postgis;

create table public.architectures (
  id integer primary key generated always as identity,
  slug text unique not null,
  name text not null,
  architect_id integer not null references public.architects (id) on delete restrict,
  year integer not null,
  address text not null,
  city_id integer not null references public.cities (id) on delete restrict,
  coordinates geography(POINT, 4326) not null,
  google_maps_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_architectures_coordinates on public.architectures using gist (coordinates);
create index idx_architectures_year on public.architectures (year);
create index idx_architectures_architect_id on public.architectures (architect_id);
create index idx_architectures_city_id on public.architectures (city_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.architectures
  for each row
  execute function public.handle_updated_at();


create table public.architecture_photos (
  id integer primary key generated always as identity,
  architecture_id integer not null references public.architectures (id) on delete cascade,
  image text not null,
  is_cover boolean not null default false,
  caption text,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.architecture_photos
  for each row
  execute function public.handle_updated_at();

create table public.architecture_notes (
  id integer primary key generated always as identity,
  architecture_id integer not null references public.architectures (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.architecture_notes
  for each row
  execute function public.handle_updated_at();

create table public.architecture_links (
  id integer primary key generated always as identity,
  architecture_id integer not null references public.architectures (id) on delete cascade,
  type text not null,
  url text not null,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.architecture_links
  for each row
  execute function public.handle_updated_at();


ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_links ENABLE ROW LEVEL SECURITY;
