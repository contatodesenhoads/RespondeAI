-- =====================================================================
-- Migração 004: variações da resposta pública, captura de lead,
-- mídia na entrega e remarketing.
-- Rodar uma vez no SQL Editor do Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Automações: novas opções
-- ---------------------------------------------------------------------
alter table public.automacoes add column if not exists resposta_publica_2 text;

alter table public.automacoes add column if not exists captura_ativa boolean not null default false;
alter table public.automacoes add column if not exists captura_tipo text not null default 'email';
alter table public.automacoes drop constraint if exists automacoes_captura_tipo_check;
alter table public.automacoes add constraint automacoes_captura_tipo_check check (captura_tipo in ('email', 'whatsapp'));
alter table public.automacoes add column if not exists captura_mensagem text;

alter table public.automacoes add column if not exists midia_path text;
alter table public.automacoes add column if not exists midia_url text;
alter table public.automacoes add column if not exists midia_tipo text;
alter table public.automacoes add column if not exists midia_nome text;
alter table public.automacoes add column if not exists midia_tamanho bigint;
alter table public.automacoes drop constraint if exists automacoes_conteudo_tipo_check;
alter table public.automacoes add constraint automacoes_conteudo_tipo_check
  check (conteudo_tipo in ('link', 'texto', 'arquivo', 'midia'));

alter table public.automacoes add column if not exists remarketing_ativo boolean not null default false;
alter table public.automacoes add column if not exists remarketing_mensagem text;
alter table public.automacoes add column if not exists remarketing_horas int not null default 2;
alter table public.automacoes drop constraint if exists automacoes_remarketing_horas_check;
alter table public.automacoes add constraint automacoes_remarketing_horas_check check (remarketing_horas between 1 and 23);

-- ---------------------------------------------------------------------
-- Contatos: lead capturado e etapa "aguardando resposta"
-- ---------------------------------------------------------------------
alter table public.contatos add column if not exists email text;
alter table public.contatos add column if not exists whatsapp text;
alter table public.contatos add column if not exists aguardando_automacao_id uuid references public.automacoes (id) on delete set null;
alter table public.contatos add column if not exists aguardando_desde timestamptz;

-- ---------------------------------------------------------------------
-- Eventos: novos tipos
-- ---------------------------------------------------------------------
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check check (tipo in (
  'comentou', 'clicou_botao', 'ja_seguia', 'pediu_seguir', 'seguiu',
  'capturou_lead', 'entregou', 'clicou_link', 'remarketing', 'erro'
));

-- ---------------------------------------------------------------------
-- Envios agendados (remarketing)
-- ---------------------------------------------------------------------
create table if not exists public.envios_agendados (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  automacao_id uuid references public.automacoes (id) on delete cascade,
  contato_id uuid references public.contatos (id) on delete cascade,
  igsid text not null,
  mensagem text not null,
  enviar_em timestamptz not null,
  janela_ate timestamptz not null,       -- limite da janela de 24 h da Meta
  status text not null default 'pendente' check (status in ('pendente', 'enviado', 'expirado', 'cancelado', 'erro')),
  tentativas int not null default 0,
  erro text,
  criado_em timestamptz not null default now(),
  enviado_em timestamptz
);

create index if not exists envios_pendentes_idx on public.envios_agendados (status, enviar_em);

alter table public.envios_agendados enable row level security;
drop policy if exists envios_leitura on public.envios_agendados;
create policy envios_leitura on public.envios_agendados
  for select using (cliente_id = public.meu_cliente_id() or public.sou_admin());

-- ---------------------------------------------------------------------
-- Armazenamento das mídias de entrega
-- Limite por arquivo: 25 MB (imagens: 8 MB, conferido no sistema).
-- Público para o Instagram conseguir buscar o arquivo; o caminho é aleatório.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entregas', 'entregas', true, 26214400,
  array['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/webm',
        'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/x-m4a', 'audio/m4a',
        'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cada cliente só envia e apaga arquivos na própria pasta (pasta = id do cliente)
drop policy if exists entregas_envio on storage.objects;
create policy entregas_envio on storage.objects
  for insert to authenticated
  with check (bucket_id = 'entregas' and (storage.foldername(name))[1] = public.meu_cliente_id()::text);

drop policy if exists entregas_exclusao on storage.objects;
create policy entregas_exclusao on storage.objects
  for delete to authenticated
  using (bucket_id = 'entregas' and (storage.foldername(name))[1] = public.meu_cliente_id()::text);
