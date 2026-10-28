-- =====================================================================
-- Migração 006: captura pede e-mail E WhatsApp (os dois obrigatórios)
-- Rodar uma vez no SQL Editor do Supabase.
-- =====================================================================

alter table public.automacoes add column if not exists captura_mensagem_whatsapp text;

alter table public.automacoes drop constraint if exists automacoes_captura_tipo_check;
alter table public.automacoes add constraint automacoes_captura_tipo_check
  check (captura_tipo in ('email', 'whatsapp', 'ambos'));
alter table public.automacoes alter column captura_tipo set default 'ambos';

-- Automações que já pediam contato passam a pedir os dois.
update public.automacoes set captura_tipo = 'ambos' where captura_ativa = true;
