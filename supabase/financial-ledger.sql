-- Lopes Responde Pro: base auditável para participação do Administrador Ajudante.
-- Execute no SQL Editor do Supabase somente depois de revisar o projeto.
-- As tabelas ficam bloqueadas para acesso direto de usuários; operações devem passar pelo servidor.

create table if not exists public.lopes_profit_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  gross_revenue numeric(14,2) not null default 0 check (gross_revenue >= 0),
  processing_fees numeric(14,2) not null default 0 check (processing_fees >= 0),
  refunds_and_chargebacks numeric(14,2) not null default 0 check (refunds_and_chargebacks >= 0),
  taxes numeric(14,2) not null default 0 check (taxes >= 0),
  eligible_operating_costs numeric(14,2) not null default 0 check (eligible_operating_costs >= 0),
  eligible_net_profit numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','reviewed','closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (period_end >= period_start),
  unique (period_start, period_end)
);

create table if not exists public.lopes_assistant_profit_shares (
  id uuid primary key default gen_random_uuid(),
  profit_period_id uuid not null references public.lopes_profit_periods(id),
  assistant_user_id uuid not null,
  share_percent numeric(5,2) not null default 10.00 check (share_percent = 10.00),
  eligible_profit numeric(14,2) not null check (eligible_profit >= 0),
  amount_due numeric(14,2) not null check (amount_due >= 0),
  provider_transfer_reference text,
  payout_status text not null default 'pending'
    check (payout_status in ('pending','processing','paid','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (profit_period_id, assistant_user_id)
);

alter table public.lopes_profit_periods enable row level security;
alter table public.lopes_assistant_profit_shares enable row level security;

revoke all on table public.lopes_profit_periods from public, anon, authenticated;
revoke all on table public.lopes_assistant_profit_shares from public, anon, authenticated;

-- IMPORTANTE:
-- 1) O servidor deve calcular eligible_net_profit = receita - taxas - reembolsos/estornos - impostos - custos elegíveis.
-- 2) A participação deve ser max(eligible_net_profit, 0) * 0.10.
-- 3) A restrição UNIQUE evita criar duas participações para o mesmo ajudante e período.
-- 4) Não há execução de transferência neste SQL. Repasse exige provedor de pagamentos e validação no servidor.
-- 5) Não guardar credenciais bancárias ou segredos do provedor nestas tabelas.

-- Cadastro de candidatos e seleção de no máximo um Ajudante ativo.
create table if not exists public.lopes_admin_assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text not null default '',
  status text not null default 'candidate'
    check (status in ('candidate','active','revoked')),
  permissions text[] not null default '{}',
  evaluation_notes text not null default '',
  selected_by text,
  selected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(permissions) <= 5),
  check (permissions <@ array['support_review','content_moderation','tester_management','user_feedback','basic_analytics']::text[])
);

create unique index if not exists lopes_only_one_active_assistant
  on public.lopes_admin_assistants ((status))
  where status = 'active';

alter table public.lopes_admin_assistants enable row level security;
revoke all on table public.lopes_admin_assistants from public, anon, authenticated;

-- A seleção e alteração de permissões devem ocorrer somente por endpoint de servidor
-- que valide a sessão do Administrador Master. Não conceder acesso direto pelo navegador.
