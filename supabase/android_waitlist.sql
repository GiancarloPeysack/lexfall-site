-- android_waitlist: email capture for the "coming to Android" waitlist.
-- Fed by the public `android-waitlist` edge function (service role insert).
-- Run this once in the Supabase SQL editor (or via `supabase db execute`).

create table if not exists public.android_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  country     text,
  source      text not null default 'web_android',
  created_at  timestamptz not null default now()
);

-- Fast lookups / dedupe by email (the unique constraint already indexes it,
-- this is just explicit intent; a plain index on created_at helps the owner sort).
create index if not exists android_waitlist_created_at_idx
  on public.android_waitlist (created_at desc);

-- Lock the table down. RLS on, and NO policies for anon/authenticated,
-- so the anon key can neither read nor write. The edge function uses the
-- service role key, which bypasses RLS.
alter table public.android_waitlist enable row level security;

-- Explicitly revoke any table grants from the public API roles (belt and braces
-- on top of RLS: no public select, insert, update, or delete).
revoke all on public.android_waitlist from anon, authenticated;
