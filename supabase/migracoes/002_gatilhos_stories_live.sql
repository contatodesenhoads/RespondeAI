-- =====================================================================
-- Migração 002: novos gatilhos "Resposta a stories" e "Comentário em live"
-- Rodar uma vez no SQL Editor do Supabase.
-- =====================================================================

alter table public.automacoes drop constraint if exists automacoes_gatilho_check;

alter table public.automacoes
  add constraint automacoes_gatilho_check
  check (gatilho in ('comentario', 'direct', 'story', 'live'));
