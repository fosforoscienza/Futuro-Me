-- Account per l'area personale: studenti (autoregistrazione con il codice
-- della classe), gestore e admin. Ogni studente compila questionario + avatar
-- due volte: a inizio e a fine progetto.
--
-- Dati minimi: username scelto dal ragazzo (niente nome, email o data di
-- nascita), classe, hash scrypt della password. Tutte le letture e scritture
-- passano dal server con la service role: RLS attiva senza policy, quindi le
-- chiavi anon/authenticated non vedono nulla.
-- Idempotente: si può rilanciare senza danni.

-- Classi: i ragazzi si registrano con il codice della loro classe.
create table if not exists public.classi (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scuola text not null check (char_length(scuola) between 1 and 120),
  nome text not null check (char_length(nome) between 1 and 40), -- es. "3B"
  codice text not null unique check (codice ~ '^[A-Z0-9-]{6,20}$'),
  attiva boolean not null default true -- false: il codice non accetta nuove registrazioni
);

create table if not exists public.account (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- Sempre minuscolo: l'unicità vale senza distinzione di maiuscole.
  username text not null unique check (username ~ '^[a-z0-9._]{3,24}$'),
  password_hash text not null, -- scrypt$N$r$p$sale$hash (src/lib/auth/password.ts)
  ruolo text not null check (ruolo in ('studente', 'gestore', 'admin')),
  classe_id uuid references public.classi(id) on delete restrict,
  password_cambiata_at timestamptz not null default now(),
  ultimo_accesso_at timestamptz,
  constraint account_classe_solo_studenti check ((ruolo = 'studente') = (classe_id is not null))
);

create index if not exists account_classe_idx on public.account (classe_id);

-- Sessioni: il cookie contiene un token casuale, qui solo il suo SHA-256.
-- Reimpostare la password cancella le sessioni aperte dell'account.
create table if not exists public.sessioni (
  token_hash text primary key,
  account_id uuid not null references public.account(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessioni_account_idx on public.sessioni (account_id);

-- Tentativi di accesso falliti per username: limite che regge anche tra
-- istanze serverless diverse (il rate limit in memoria no).
create table if not exists public.login_tentativi (
  id bigint generated always as identity primary key,
  username text not null,
  created_at timestamptz not null default now()
);

create index if not exists login_tentativi_username_idx
  on public.login_tentativi (username, created_at);

-- Interruttori modificabili dalla console admin.
create table if not exists public.impostazioni (
  chiave text primary key,
  valore jsonb not null,
  updated_at timestamptz not null default now()
);

-- "Fine progetto" resta grigia finché l'admin non la attiva.
insert into public.impostazioni (chiave, valore)
values ('fase_fine_attiva', 'false'::jsonb)
on conflict (chiave) do nothing;

-- Questionario: le compilazioni anonime già raccolte restano com'erano
-- (account_id e fase null); quelle dall'area personale hanno entrambi.
alter table public.questionario_risposte
  add column if not exists account_id uuid references public.account(id) on delete cascade,
  add column if not exists fase text check (fase in ('inizio', 'fine'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questionario_risposte_account_fase_check'
  ) then
    alter table public.questionario_risposte
      add constraint questionario_risposte_account_fase_check
      check ((account_id is null) = (fase is null));
  end if;
end $$;

-- Una sola compilazione per studente e per fase.
create unique index if not exists questionario_risposte_account_fase_key
  on public.questionario_risposte (account_id, fase)
  where account_id is not null;

-- RLS senza policy + niente privilegi per anon/authenticated: solo il server.
alter table public.classi enable row level security;
alter table public.account enable row level security;
alter table public.sessioni enable row level security;
alter table public.login_tentativi enable row level security;
alter table public.impostazioni enable row level security;

revoke all on public.classi, public.account, public.sessioni,
  public.login_tentativi, public.impostazioni from anon, authenticated;
