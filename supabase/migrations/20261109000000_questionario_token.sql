-- Token del questionario: abbinano la compilazione di inizio e di fine progetto
-- senza account e senza nomi. Il nome dello studente sta solo sul foglio
-- cartaceo tenuto dagli psicologi; qui c'è soltanto l'impronta SHA-256 del token.
-- A fine progetto chiudi_token_classe() cancella le impronte e cambia l'id di
-- ogni token: le coppie inizio/fine restano, il collegamento con i fogli no.
-- Idempotente: si può rilanciare senza danni.

create table if not exists public.questionario_token (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.classi(id) on delete restrict,
  token_hash text unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  chiuso_at timestamptz,
  constraint questionario_token_chiuso_check check ((token_hash is null) = (chiuso_at is not null))
);

create index if not exists questionario_token_classe_idx on public.questionario_token (classe_id);

alter table public.questionario_risposte
  add column if not exists token_id uuid
    references public.questionario_token(id) on delete cascade on update cascade;

-- Una compilazione ha una fase se e solo se arriva da un account (sistema
-- precedente) o da un token, mai da entrambi.
alter table public.questionario_risposte
  drop constraint if exists questionario_risposte_account_fase_check;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questionario_risposte_origine_fase_check'
  ) then
    alter table public.questionario_risposte
      add constraint questionario_risposte_origine_fase_check
      check (
        (account_id is null or token_id is null)
        and ((account_id is null and token_id is null) = (fase is null))
      );
  end if;
end $$;

-- Una sola compilazione per token e per fase.
create unique index if not exists questionario_risposte_token_fase_key
  on public.questionario_risposte (token_id, fase)
  where token_id is not null;

-- Chiusura degli abbinamenti di una classe, da fare dopo la distruzione dei
-- fogli: elimina i token mai usati, porta la data delle risposte al giorno,
-- cancella le impronte e assegna a ogni token un id nuovo (le risposte lo
-- seguono con ON UPDATE CASCADE). Irreversibile. Restituisce le coppie chiuse.
create or replace function public.chiudi_token_classe(p_classe uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  chiusi integer;
begin
  delete from public.questionario_token t
   where t.classe_id = p_classe
     and t.chiuso_at is null
     and not exists (select 1 from public.questionario_risposte r where r.token_id = t.id);

  update public.questionario_risposte r
     set created_at = date_trunc('day', r.created_at)
    from public.questionario_token t
   where r.token_id = t.id and t.classe_id = p_classe and t.chiuso_at is null;

  update public.questionario_token
     set id = gen_random_uuid(), token_hash = null, chiuso_at = now()
   where classe_id = p_classe and chiuso_at is null;
  get diagnostics chiusi = row_count;
  return chiusi;
end;
$$;

alter table public.questionario_token enable row level security;
alter table public.questionario_risposte enable row level security;
revoke all on public.questionario_token, public.questionario_risposte from public, anon, authenticated;
revoke all on function public.chiudi_token_classe(uuid) from public, anon, authenticated;
grant execute on function public.chiudi_token_classe(uuid) to service_role;

notify pgrst, 'reload schema';
