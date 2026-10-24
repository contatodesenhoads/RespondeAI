-- =====================================================================
-- Migração 005: agendador do remarketing (roda a cada 5 minutos)
-- 1. Supabase › Database › Extensions: ative "pg_cron" e "pg_net".
-- 2. Troque COLE_AQUI_O_CRON_SECRET pelo mesmo valor de CRON_SECRET da Vercel.
-- 3. Rode no SQL Editor.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'responde-ai-remarketing';

select cron.schedule(
  'responde-ai-remarketing',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://responde-ai-kappa.vercel.app/api/cron/remarketing',
    headers := jsonb_build_object('Authorization', 'Bearer COLE_AQUI_O_CRON_SECRET')
  );
  $$
);
