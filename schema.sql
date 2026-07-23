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
  city text not null default 'Shanghai',
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists posts_published_at_idx
  on public.posts (published_at desc);

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

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Admin writes and private reads must use the Supabase service-role key from
-- server-side code. The service role bypasses RLS, uploads to the public media
-- bucket, and must never reach a browser.
