create type public.submission_status as enum ('pending', 'approved', 'rejected');

create table public.submissions (
  id           integer primary key generated always as identity,
  architecture_id integer references public.architectures (id) on delete set null,
  submitter_id integer not null references public.users (id) on delete cascade,
  status       public.submission_status not null default 'pending',
  payload      jsonb not null,
  base_version_timestamp timestamptz,
  moderator_id integer references public.users (id),
  moderator_note text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

create index idx_submissions_status_created_at
  on public.submissions (status, created_at);
create index idx_submissions_submitter_created_at
  on public.submissions (submitter_id, created_at);

alter table public.submissions enable row level security;
