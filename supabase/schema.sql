-- =====================================================================
-- Responde AI — estrutura do banco de dados (Supabase / Postgres)
-- Rodar uma única vez no SQL Editor do Supabase.
-- Cada cliente só enxerga os próprios dados (Row Level Security).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Clientes (empresas que usam o sistema)
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  plano text not null default 'agencia',
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'cancelado')),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Perfis (um por usuário do login; liga o usuário ao cliente)
-- ---------------------------------------------------------------------
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nome text,
  papel text not null default 'cliente' check (papel in ('admin', 'cliente')),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Conta do Instagram conectada (uma por cliente)
-- O token fica criptografado e NUNCA é lido pelo navegador.
-- ---------------------------------------------------------------------
create table if not exists public.contas_instagram (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references public.clientes (id) on delete cascade,
  ig_user_id text not null unique,
  username text,
  token_criptografado text,
  token_expira_em timestamptz,
  status text not null default 'conectada' check (status in ('conectada', 'desconectada', 'erro')),
  conectado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Automações
-- ---------------------------------------------------------------------
create table if not exists public.automacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nome text not null,
  gatilho text not null default 'comentario' check (gatilho in ('comentario', 'direct')),
  post_id text,                -- nulo = qualquer post
  post_legenda text,
  post_miniatura text,
  palavra_chave text not null,
  resposta_publica text,
  mensagem_dm text not null,
  botao_dm text not null default 'Quero receber',
  exige_seguir boolean not null default true,
  mensagem_seguir text,
  botao_seguir text not null default 'Já segui',
  conteudo_tipo text not null default 'link' check (conteudo_tipo in ('link', 'texto', 'arquivo')),
  mensagem_entrega text not null,
  conteudo_url text,
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'rascunho')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists automacoes_cliente_idx on public.automacoes (cliente_id, status);

-- ---------------------------------------------------------------------
-- Contatos (pessoas que interagiram)
-- ---------------------------------------------------------------------
create table if not exists public.contatos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  igsid text not null,         -- ID da pessoa no Instagram (escopo da conta)
  username text,
  segue boolean,
  ultima_interacao timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  unique (cliente_id, igsid)
);

-- ---------------------------------------------------------------------
-- Eventos (cada passo do funil, base do dashboard)
-- ---------------------------------------------------------------------
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  automacao_id uuid references public.automacoes (id) on delete set null,
  contato_id uuid references public.contatos (id) on delete set null,
  tipo text not null check (tipo in (
    'comentou', 'clicou_botao', 'ja_seguia', 'pediu_seguir',
    'seguiu', 'entregou', 'clicou_link', 'erro'
  )),
  detalhe jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists eventos_cliente_data_idx on public.eventos (cliente_id, criado_em desc);
create index if not exists eventos_automacao_idx on public.eventos (automacao_id, tipo);

-- ---------------------------------------------------------------------
-- Funções de apoio às regras de acesso
-- ---------------------------------------------------------------------
create or replace function public.meu_cliente_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cliente_id from public.perfis where id = auth.uid()
$$;

create or replace function public.sou_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin')
$$;

-- Resumo dos eventos por automação e tipo (base do Início e do Dashboard).
-- "security invoker": respeita as regras de acesso de quem consulta.
create or replace function public.resumo_eventos(desde timestamptz, ate timestamptz default now())
returns table (automacao_id uuid, tipo text, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select e.automacao_id, e.tipo, count(*)::bigint
  from public.eventos e
  where e.criado_em >= desde and e.criado_em < ate
  group by e.automacao_id, e.tipo
$$;

-- ---------------------------------------------------------------------
-- Novo usuário criado no login → cria o cliente e o perfil automaticamente
-- ---------------------------------------------------------------------
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_cliente uuid;
begin
  insert into public.clientes (nome)
  values (coalesce(new.raw_user_meta_data ->> 'empresa', new.email))
  returning id into novo_cliente;

  insert into public.perfis (id, cliente_id, nome)
  values (new.id, novo_cliente, new.raw_user_meta_data ->> 'nome');

  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- ---------------------------------------------------------------------
-- Regras de acesso (RLS)
-- ---------------------------------------------------------------------
alter table public.clientes enable row level security;
alter table public.perfis enable row level security;
alter table public.contas_instagram enable row level security;
alter table public.automacoes enable row level security;
alter table public.contatos enable row level security;
alter table public.eventos enable row level security;

-- Clientes: cada um vê o seu; a agência (admin) vê todos
drop policy if exists clientes_leitura on public.clientes;
create policy clientes_leitura on public.clientes
  for select using (id = public.meu_cliente_id() or public.sou_admin());

-- Perfis: cada um vê o próprio
drop policy if exists perfis_leitura on public.perfis;
create policy perfis_leitura on public.perfis
  for select using (id = auth.uid() or public.sou_admin());

-- Conta do Instagram: só leitura pelo painel (escrita só pelo servidor)
drop policy if exists contas_leitura on public.contas_instagram;
create policy contas_leitura on public.contas_instagram
  for select using (cliente_id = public.meu_cliente_id() or public.sou_admin());

-- O navegador não pode ler a coluna do token, nem com acesso à linha
revoke select on public.contas_instagram from anon, authenticated;
grant select (id, cliente_id, ig_user_id, username, token_expira_em, status, conectado_em, atualizado_em)
  on public.contas_instagram to authenticated;

-- Automações: o cliente cria, edita e apaga as próprias
drop policy if exists automacoes_todas on public.automacoes;
create policy automacoes_todas on public.automacoes
  for all
  using (cliente_id = public.meu_cliente_id() or public.sou_admin())
  with check (cliente_id = public.meu_cliente_id() or public.sou_admin());

-- Contatos e eventos: só leitura pelo painel (escrita só pelo servidor)
drop policy if exists contatos_leitura on public.contatos;
create policy contatos_leitura on public.contatos
  for select using (cliente_id = public.meu_cliente_id() or public.sou_admin());

drop policy if exists eventos_leitura on public.eventos;
create policy eventos_leitura on public.eventos
  for select using (cliente_id = public.meu_cliente_id() or public.sou_admin());
