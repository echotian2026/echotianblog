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

-- Admin writes and private reads must use the Supabase service-role key from
-- server-side code. The service role bypasses RLS and must never reach a browser.
