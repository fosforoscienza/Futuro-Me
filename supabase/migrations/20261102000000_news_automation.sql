-- News automatiche "Il Futuro Me": fonti, articoli pubblicati ed esecuzioni del job.
-- Il job settimanale (/api/cron/fetch-news, lunedì 8:00 Europe/Rome) legge le
-- fonti attive, raccoglie le news della settimana precedente e le pubblica.
-- Scritture solo dal server (service role); il pubblico legge solo gli articoli
-- pubblicati.

-- Fonti autorevoli, gestite dalla console /admin.
create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  site_url text not null,
  feed_url text not null unique,
  language text not null default 'it' check (language in ('it', 'en')),
  category text not null default 'jobs'
    check (category in ('ai', 'jobs', 'training', 'skills')),
  active boolean not null default true,
  -- Se true, gli item del feed passano solo se parlano di lavoro, formazione,
  -- competenze o AI (per feed generici come i comunicati di un istituto).
  keyword_filter boolean not null default true,
  -- Pagine da leggere per i feed WordPress (?paged=N), che espongono solo
  -- gli ultimi 10 elementi.
  max_pages int not null default 1 check (max_pages between 1 and 5),
  notes text,
  last_fetched_at timestamptz,
  last_status text,
  last_error text,
  last_item_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Elementi dei feed raccolti ogni giorno. Molti feed (ANSA, Corriere, Sole 24
-- Ore) coprono solo 1-3 giorni: il lunedì il job pubblica partendo da qui.
create table if not exists public.news_feed_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources (id) on delete cascade,
  url text not null unique,
  title text not null,
  description text not null default '',
  published_at timestamptz not null,
  first_seen_at timestamptz not null default now()
);

create index if not exists news_feed_items_published_idx
  on public.news_feed_items (published_at);

-- Articoli pubblicati sul sito. Ogni riga riporta sempre la fonte.
create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  title_en text,
  excerpt_en text,
  content_en text,
  category text not null check (category in ('ai', 'jobs', 'training', 'skills')),
  -- Fonte: nome visibile e link all'articolo originale (obbligatori).
  source_name text not null,
  source_url text not null unique,
  source_id uuid references public.news_sources (id) on delete set null,
  original_title text,
  original_published_at timestamptz,
  -- Settimana (lunedì, ora italiana) a cui appartiene la news.
  week_start date not null,
  status text not null default 'published'
    check (status in ('published', 'hidden')),
  summary_method text not null default 'ai' check (summary_method in ('ai', 'extract')),
  run_id uuid,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists news_articles_published_idx
  on public.news_articles (status, published_at desc);

-- Una riga per ogni esecuzione del job (cron o manuale).
create table if not exists public.news_job_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('cron', 'manual')),
  status text not null default 'running'
    check (status in ('running', 'success', 'partial', 'error', 'skipped')),
  week_start date not null,
  week_end date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  sources_checked int not null default 0,
  items_found int not null default 0,
  items_in_week int not null default 0,
  items_published int not null default 0,
  message text,
  log jsonb not null default '[]'::jsonb
);

create index if not exists news_job_runs_started_idx
  on public.news_job_runs (started_at desc);

-- RLS: fonti ed esecuzioni senza policy (solo service role); articoli
-- pubblicati leggibili da tutti.
alter table public.news_sources enable row level security;
alter table public.news_feed_items enable row level security;
alter table public.news_job_runs enable row level security;
alter table public.news_articles enable row level security;

drop policy if exists "news_articles_public_read" on public.news_articles;
create policy "news_articles_public_read" on public.news_articles
  for select to anon, authenticated
  using (status = 'published');

-- Fonti iniziali: feed RSS/Atom scaricati e verificati il 2 novembre 2026
-- (esiti e fonti scartate in docs/news-automation.md).
insert into public.news_sources
  (name, site_url, feed_url, language, category, active, keyword_filter, max_pages, notes)
values
  ('ISTAT – Comunicati e notizie', 'https://www.istat.it', 'https://www.istat.it/feed/', 'it', 'jobs', true, true, 3, 'Feed generico: filtrato per parole chiave (occupati, disoccupati, retribuzioni).'),
  ('INPS – Notizie', 'https://www.inps.it', 'https://www.inps.it/it/it.rss.news.xml', 'it', 'jobs', true, true, 1, 'Date dd/mm/yyyy, senza descrizione; molto previdenziale, filtrato.'),
  ('Ministero del Lavoro – Notizie', 'https://www.lavoro.gov.it', 'https://www.lavoro.gov.it/_layouts/15/Lavoro.Web/AppPages/RSS', 'it', 'jobs', true, true, 1, 'Date in italiano, senza descrizione.'),
  ('Unioncamere – Comunicati stampa (incl. Excelsior)', 'https://www.unioncamere.gov.it', 'https://www.unioncamere.gov.it/rss', 'it', 'jobs', true, true, 1, 'Include i comunicati del Sistema Excelsior sui fabbisogni occupazionali.'),
  ('Banca d''Italia – Notizie', 'https://www.bancaditalia.it', 'https://www.bancaditalia.it/util/index.rss.html?sezione=/media/notizia&lingua=it', 'it', 'jobs', true, true, 1, 'Senza descrizione; molto filtrato.'),
  ('Eurostat – News releases', 'https://ec.europa.eu/eurostat', 'https://ec.europa.eu/eurostat/en/search?p_p_id=estatsearchportlet_WAR_estatsearchportlet&p_p_lifecycle=2&p_p_state=maximized&p_p_mode=view&p_p_resource_id=atom&_estatsearchportlet_WAR_estatsearchportlet_collection=CAT_PREREL', 'en', 'jobs', true, true, 1, 'Atom; filtrato per occupazione e disoccupazione.'),
  ('Eurostat – Popolazione e condizioni sociali', 'https://ec.europa.eu/eurostat', 'https://ec.europa.eu/eurostat/en/search?p_p_id=estatsearchportlet_WAR_estatsearchportlet&p_p_lifecycle=2&p_p_state=maximized&p_p_mode=view&p_p_resource_id=atom&_estatsearchportlet_WAR_estatsearchportlet_theme=PER_POPSOC&_estatsearchportlet_WAR_estatsearchportlet_collection=CAT_EURNEW', 'en', 'training', true, true, 1, 'Atom; istruzione, giovani, condizioni sociali.'),
  ('Commissione europea – DG Occupazione e affari sociali', 'https://employment-social-affairs.ec.europa.eu', 'https://employment-social-affairs.ec.europa.eu/node/2/rss_en', 'en', 'skills', true, true, 1, 'Competenze, AI e lavoro, politiche UE.'),
  ('OECD Education Today', 'https://oecdedutoday.com', 'https://oecdedutoday.com/feed/', 'en', 'skills', true, false, 1, 'Blog ufficiale OCSE sull''istruzione (oecd.org blocca i bot).'),
  ('Il Sole 24 Ore – Lavoro', 'https://www.ilsole24ore.com', 'https://www.ilsole24ore.com/rss/economia--lavoro.xml', 'it', 'jobs', true, true, 1, 'Sezione lavoro.'),
  ('Il Sole 24 Ore – Formazione e ITS', 'https://www.ilsole24ore.com', 'https://www.ilsole24ore.com/rss/scuola--formazione-e-its.xml', 'it', 'training', true, false, 1, 'ITS, borse di studio, STEM.'),
  ('Il Sole 24 Ore – Scuola', 'https://www.ilsole24ore.com', 'https://www.ilsole24ore.com/rss/scuola.xml', 'it', 'training', true, true, 1, 'Copre circa 3 giorni: raccolto ogni giorno.'),
  ('Il Sole 24 Ore – Tecnologia', 'https://www.ilsole24ore.com', 'https://www.ilsole24ore.com/rss/tecnologia.xml', 'it', 'ai', true, true, 1, 'Copre circa 3 giorni: raccolto ogni giorno.'),
  ('ANSA – Economia', 'https://www.ansa.it', 'https://www.ansa.it/sito/notizie/economia/economia_rss.xml', 'it', 'jobs', true, true, 1, 'Generico, copre circa 1 giorno: raccolto ogni giorno e filtrato.'),
  ('ANSA – Tecnologia', 'https://www.ansa.it', 'https://www.ansa.it/canale_tecnologia/notizie/tecnologia_rss.xml', 'it', 'ai', true, true, 1, 'Filtrato per AI e lavoro.'),
  ('Corriere della Sera – Economia', 'https://www.corriere.it/economia/', 'https://www.corriere.it/dynamic-feed/rss/section/Economia.xml', 'it', 'jobs', true, true, 1, 'Generico, copre circa 3 giorni: raccolto ogni giorno e filtrato.'),
  ('Agenda Digitale', 'https://www.agendadigitale.eu', 'https://www.agendadigitale.eu/feed/', 'it', 'ai', true, true, 3, 'Circa 10 elementi al giorno; generico, filtrato.'),
  ('Agenda Digitale – Competenze digitali', 'https://www.agendadigitale.eu', 'https://www.agendadigitale.eu/cultura-digitale/competenze-digitali/feed/', 'it', 'skills', true, false, 1, 'Molto pertinente.'),
  ('Agenda Digitale – Scuola digitale', 'https://www.agendadigitale.eu', 'https://www.agendadigitale.eu/scuola-digitale/feed/', 'it', 'training', true, true, 1, 'AI e istruzione.'),
  ('AI4Business – Intelligenza artificiale', 'https://www.ai4business.it', 'https://www.ai4business.it/intelligenza-artificiale/feed/', 'it', 'ai', true, true, 2, 'Taglio business; filtrato.'),
  ('Openpolis', 'https://www.openpolis.it', 'https://www.openpolis.it/feed/', 'it', 'training', true, true, 1, 'Data journalism su giovani e povertà educativa; filtrato.'),
  ('lavoce.info', 'https://lavoce.info', 'https://lavoce.info/feed/', 'it', 'jobs', true, true, 2, 'Analisi di economisti; filtrato.'),
  ('INDIRE', 'https://www.indire.it', 'https://www.indire.it/feed/', 'it', 'training', true, true, 1, 'Feed pesante (500 elementi); AI a scuola, orientamento.'),
  ('AlmaLaurea', 'https://www.almalaurea.it', 'https://www.almalaurea.it/rss.xml', 'it', 'training', true, true, 1, 'Indagini sui laureati; filtrato.'),
  ('Orizzonte Scuola – Orientamento', 'https://www.orizzontescuola.it', 'https://www.orizzontescuola.it/category/orientamento/feed/', 'it', 'training', true, false, 1, 'Molto pertinente, bassa frequenza.')
on conflict (feed_url) do nothing;

-- Ricarica la cache dello schema di PostgREST (Supabase self-hosted).
notify pgrst, 'reload schema';
