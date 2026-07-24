-- Supabase schema for Purple Journal.
create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  published_at timestamptz not null default now(),
  mood text not null default 'neutral'
    check (mood in ('sad', 'neutral', 'happy')),
  section text not null default 'writing'
    check (section in ('writing', 'insights', 'work')),
  tags text[] not null default '{}'::text[],
  city text not null default 'Shanghai',
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.posts
  add column if not exists section text not null default 'writing';

alter table public.posts
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.posts
  drop constraint if exists posts_section_check;
alter table public.posts
  add constraint posts_section_check
  check (section in ('writing', 'insights', 'work'));

create index if not exists posts_published_at_idx
  on public.posts (published_at desc);

create index if not exists posts_section_published_at_idx
  on public.posts (section, published_at desc);

create index if not exists posts_tags_idx
  on public.posts using gin (tags);

alter table public.posts enable row level security;

drop policy if exists "Public can read public posts" on public.posts;
create policy "Public can read public posts"
  on public.posts
  for select
  to anon, authenticated
  using (is_private = false);

create table if not exists public.homepage_content (
  id integer primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.homepage_content (id, content)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.homepage_content enable row level security;

drop policy if exists "Public can read homepage content"
  on public.homepage_content;
create policy "Public can read homepage content"
  on public.homepage_content
  for select
  to anon, authenticated
  using (id = 1);

create table if not exists public.work_page_content (
  slug text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.work_page_content enable row level security;

drop policy if exists "Public can read work page content"
  on public.work_page_content;
create policy "Public can read work page content"
  on public.work_page_content
  for select
  to anon, authenticated
  using (true);

create table if not exists public.fitness_sessions (
  id uuid primary key default gen_random_uuid(),
  practiced_on date not null default current_date,
  session_number smallint not null
    check (session_number between 1 and 5),
  rounds_completed smallint not null default 0
    check (rounds_completed between 0 and 10),
  duration_seconds integer not null default 0
    check (duration_seconds >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practiced_on, session_number)
);

create index if not exists fitness_sessions_practiced_on_idx
  on public.fitness_sessions (practiced_on desc);

alter table public.fitness_sessions enable row level security;

-- No public policies are created for fitness_sessions. Only server-side
-- service-role requests can read or update Echo's private practice history.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Admin writes and private reads must use the Supabase service-role key from
-- server-side code. The service role bypasses RLS, uploads to the public media
-- bucket, and must never reach a browser.
