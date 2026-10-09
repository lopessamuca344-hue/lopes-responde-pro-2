create extension if not exists pgcrypto;

create table if not exists public.trial_access_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null unique,
  plans text[] not null default array['social','pro','executiva','master'],
  expires_at timestamptz not null,
  revoked boolean not null default false,
  redeemed_by uuid unique,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trial_access_codes_email_idx on public.trial_access_codes (lower(email));
create index if not exists trial_access_codes_expiry_idx on public.trial_access_codes (expires_at);

alter table public.trial_access_codes enable row level security;
revoke all on public.trial_access_codes from anon, authenticated;
