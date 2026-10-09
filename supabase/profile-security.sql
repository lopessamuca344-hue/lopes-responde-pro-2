-- Lopes Responde Pro: hardening idempotente da tabela de perfis.
-- Execute no SQL Editor do Supabase. Não concede privilégios de administrador via perfil.

begin;

create table if not exists public.perfil_usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  tipo_acesso text not null default 'usuario',
  criado_em timestamptz not null default now()
);

alter table public.perfil_usuario enable row level security;

-- Remover políticas existentes desta tabela para evitar regras permissivas antigas
-- que possam se combinar com as políticas novas. Não altera outras tabelas.
do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'perfil_usuario'
  loop
    execute format('drop policy if exists %I on public.perfil_usuario', p.policyname);
  end loop;
end
$$;

-- Fechar permissões diretas e conceder somente o necessário a usuários autenticados.
revoke all on table public.perfil_usuario from public, anon, authenticated;
grant select, insert, update on table public.perfil_usuario to authenticated;

-- Cada usuário só pode ler seu próprio perfil.
create policy "perfil_usuario_select_proprio"
on public.perfil_usuario
for select
to authenticated
using (auth.uid() = id);

-- Usuários podem criar somente o próprio perfil e nunca se declarar administradores.
create policy "perfil_usuario_insert_proprio"
on public.perfil_usuario
for insert
to authenticated
with check (auth.uid() = id and tipo_acesso = 'usuario');

-- Usuários podem alterar os próprios dados, mas não podem mudar o tipo de acesso.
create policy "perfil_usuario_update_proprio"
on public.perfil_usuario
for update
to authenticated
using (auth.uid() = id and tipo_acesso = 'usuario')
with check (auth.uid() = id and tipo_acesso = 'usuario');

commit;
