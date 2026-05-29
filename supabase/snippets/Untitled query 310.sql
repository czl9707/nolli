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
