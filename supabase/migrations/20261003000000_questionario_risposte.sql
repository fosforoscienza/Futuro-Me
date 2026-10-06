-- Risposte anonime al questionario "Il Futuro Me" (pagina /questionario).
-- Nessun dato personale: niente nome, email, IP o user agent.
-- Le scritture arrivano solo dalla API route /api/questionario (service role).

create table if not exists public.questionario_risposte (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  versione text not null,

  -- Sezione 1: Il mio futuro e il lavoro
  q1 text not null,
  q2 text not null,
  q3 text not null,
  q4 text not null,
  q5 text not null,
  -- Domanda 6: classifica delle aree (q6_1 = la più interessante)
  q6_1 text not null,
  q6_2 text not null,
  q6_3 text not null,
  q6_4 text not null,
  q6_5 text not null,
  q6_6 text not null,
  q6_7 text not null,
  q6_8 text not null,
  q7 text not null,
  q8 text not null,
  q9 text not null,
  q10 text, -- null se alla 9 ha risposto "Sì"

  -- Sezione 2: Il mio posto nel mondo
  q11 text not null,
  q12 text not null,

  -- Sezione 3: Relazioni e affetti
  q13 text not null,

  -- Sezione 4: Il mio tempo
  q14 text not null,

  -- Sezione 5: Le mie capacità
  q15 text not null,
  q16 text not null,
  q17 text not null,
  q18 text not null,

  -- Sezione 6: La mia visione
  q19 text not null,
  q19_altro text,
  q20 text not null,
  q20_altro text,

  -- Sezione 7: Proiettarsi nel futuro
  q21 text not null,
  q22 text not null,
  q23 text not null,
  q24 text not null,
  q25 text not null,
  q26 text not null,

  -- Avatar costruito durante il questionario (scelte per livello, vedi src/lib/avatar/config.ts)
  avatar jsonb not null
);

-- RLS attiva senza policy: anon e authenticated non possono né leggere né
-- scrivere; solo il service role (server) inserisce.
alter table public.questionario_risposte enable row level security;
