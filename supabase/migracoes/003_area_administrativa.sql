-- =====================================================================
-- Migração 003: área administrativa, planos e bloqueio de contas
-- Rodar uma vez no SQL Editor do Supabase.
-- ANTES DE RODAR: troque SEU_EMAIL_AQUI (última linha) pelo e-mail com
-- que você entra no Responde AI. É ele que vira administrador.
-- =====================================================================

-- Planos: essencial, completo e cortesia (agência e clientes piloto)
update public.clientes set plano = 'cortesia' where plano not in ('essencial', 'completo', 'cortesia');
alter table public.clientes alter column plano set default 'essencial';
alter table public.clientes drop constraint if exists clientes_plano_check;
alter table public.clientes add constraint clientes_plano_check check (plano in ('essencial', 'completo', 'cortesia'));

-- Campos de gestão do cliente
alter table public.clientes add column if not exists observacoes text;
alter table public.clientes add column if not exists status_motivo text;
alter table public.clientes add column if not exists atualizado_em timestamptz not null default now();

-- E-mail no perfil (para a lista de clientes do administrador)
alter table public.perfis add column if not exists email text;
update public.perfis p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- Novo usuário: cria cliente (com o plano escolhido) e perfil (com e-mail)
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_cliente uuid;
  plano_escolhido text := coalesce(new.raw_user_meta_data ->> 'plano', 'essencial');
begin
  if plano_escolhido not in ('essencial', 'completo', 'cortesia') then
    plano_escolhido := 'essencial';
  end if;

  insert into public.clientes (nome, plano)
  values (coalesce(new.raw_user_meta_data ->> 'empresa', new.email), plano_escolhido)
  returning id into novo_cliente;

  insert into public.perfis (id, cliente_id, nome, email)
  values (new.id, novo_cliente, new.raw_user_meta_data ->> 'nome', new.email);

  return new;
end;
$$;

-- Resumo de atividade por cliente (uso exclusivo do servidor, na área administrativa)
create or replace function public.admin_resumo_clientes(desde timestamptz)
returns table (cliente_id uuid, comentarios bigint, entregas bigint, seguidores bigint, ultima_atividade timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.cliente_id,
    count(*) filter (where e.tipo = 'comentou'),
    count(*) filter (where e.tipo = 'entregou'),
    count(*) filter (where e.tipo = 'seguiu'),
    max(e.criado_em)
  from public.eventos e
  where e.criado_em >= desde
  group by e.cliente_id
$$;

revoke execute on function public.admin_resumo_clientes(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_resumo_clientes(timestamptz) to service_role;

-- Torna você administrador (troque pelo seu e-mail de login)
update public.perfis set papel = 'admin' where lower(email) = lower('SEU_EMAIL_AQUI');
