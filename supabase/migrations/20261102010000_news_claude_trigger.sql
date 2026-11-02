-- Le news possono essere scritte anche dal task programmato di Claude Desktop
-- (redazione con l'account Claude, senza chiave API): nuovo valore di trigger.
alter table public.news_job_runs
  drop constraint if exists news_job_runs_trigger_check;
alter table public.news_job_runs
  add constraint news_job_runs_trigger_check
  check (trigger in ('cron', 'manual', 'claude'));

notify pgrst, 'reload schema';
