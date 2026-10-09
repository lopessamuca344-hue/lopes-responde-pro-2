-- Execute no SQL Editor do Supabase para habilitar controles do Administrador Master.
create table if not exists public.lopes_admin_controls (
  id text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.lopes_admin_controls enable row level security;
revoke all on public.lopes_admin_controls from anon, authenticated;
