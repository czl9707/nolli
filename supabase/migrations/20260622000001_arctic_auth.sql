-- app-level user identity (portable; no auth.* dependency)
create table public.users (
  id           integer primary key generated always as identity,
  email        text not null,
  display_name text,
  avatar_url   text,
  role         text not null default 'user'
                 check (role in ('user','moderator','admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.user_accounts (
  id           integer primary key generated always as identity,
  user_id      integer not null references public.users(id) on delete cascade,
  provider     text not null check (provider in ('google')),
  provider_sub text not null,
  created_at   timestamptz not null default now(),
  unique (provider, provider_sub)
);
create index idx_user_accounts_user_id on public.user_accounts(user_id);

create table public.sessions (
  id          integer primary key generated always as identity,
  user_id     integer not null references public.users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_expires_at on public.sessions(expires_at);

create table public.favorites (
  user_id         integer not null references public.users(id) on delete cascade,
  architecture_id integer not null references public.architectures(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, architecture_id)
);
create index idx_favorites_architecture_id on public.favorites(architecture_id);

-- defense-in-depth: worker-only access (service role bypasses RLS)
alter table public.users          enable row level security;
alter table public.user_accounts  enable row level security;
alter table public.sessions       enable row level security;
alter table public.favorites      enable row level security;
-- intentionally no policies → direct anon/authenticated access returns nothing
