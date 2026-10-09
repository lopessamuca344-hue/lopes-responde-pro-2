-- Execute no SQL Editor do Supabase para habilitar os códigos de acesso de teste.
-- A API usa a chave service role somente no servidor; não conceda acesso direto aos usuários.
create table if not exists public.trial_access_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null unique,
  plans text[] not null default array['social','pro','executiva','master']::text[],
  expires_at timestamptz not null,
  revoked boolean not null default false,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trial_access_codes_email_idx
  on public.trial_access_codes (lower(email));

create index if not exists trial_access_codes_redeemed_by_idx
  on public.trial_access_codes (redeemed_by);

alter table public.trial_access_codes enable row level security;
revoke all on public.trial_access_codes from anon, authenticated;
