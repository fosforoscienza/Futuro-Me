#!/usr/bin/env bash
# Crea la tabella del questionario nel Supabase self-hosted del Mac mini.
# Uso (dal proprio computer):
#   ssh mac-mini 'cd ~/Documents/Software/Futuro-Me && git pull && bash scripts/supabase/setup-questionario.sh'
# Idempotente: si può rilanciare senza danni. Non stampa chiavi o segreti.
set -euo pipefail

# Via SSH non interattivo il PATH di macOS non include Homebrew né Docker Desktop
export PATH="/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"

cd "$(dirname "$0")/../.."
MIGRATION="supabase/migrations/20261003000000_questionario_risposte.sql"

command -v docker >/dev/null || { echo "ERRORE: docker non trovato sul Mac mini"; exit 1; }

# Container Postgres di Supabase (self-hosted: supabase-db; CLI locale: supabase_db_<progetto>)
DB=$(docker ps --format '{{.Names}}' | grep -E '^supabase[-_]db' | head -n1 || true)
if [ -z "$DB" ]; then
  echo "ERRORE: nessun container Postgres di Supabase in esecuzione. Container attivi:"
  docker ps --format '  {{.Names}}  ({{.Image}})'
  exit 1
fi
echo "Database: container $DB"

psql_db() { docker exec -i "$DB" psql -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"; }

echo "Applico $MIGRATION ..."
psql_db -q < "$MIGRATION"

# Rende subito visibile la nuova tabella alle API REST (PostgREST)
psql_db -q -c "notify pgrst, 'reload schema';"

echo
echo "Verifica:"
psql_db -At -c "select 'tabella: ' || to_regclass('public.questionario_risposte');"
psql_db -At -c "select 'RLS attiva: ' || relrowsecurity from pg_class where oid = 'public.questionario_risposte'::regclass;"
psql_db -At -c "select 'colonne: ' || count(*) from information_schema.columns where table_schema = 'public' and table_name = 'questionario_risposte';"
psql_db -At -c "select 'risposte salvate: ' || count(*) from public.questionario_risposte;"

# Dove si trova la chiave service_role da copiare su Vercel (senza stamparla)
ENVFILE=$(docker inspect "$DB" --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || true)
echo
if [ -n "$ENVFILE" ] && [ -f "$ENVFILE/.env" ]; then
  echo "Chiave per Vercel: variabile SERVICE_ROLE_KEY nel file $ENVFILE/.env"
  echo "  Per copiarla negli appunti del tuo computer, lancia lì:"
  echo "  ssh mac-mini \"grep '^SERVICE_ROLE_KEY=' '$ENVFILE/.env' | cut -d= -f2-\" | pbcopy"
else
  echo "Chiave per Vercel: SERVICE_ROLE_KEY nel file .env della cartella docker di Supabase"
fi
echo "Su Vercel (progetto futuro-me, Production):"
echo "  NEXT_PUBLIC_SUPABASE_URL = https://api.fosforo.info"
echo "  SUPABASE_SERVICE_ROLE_KEY = <SERVICE_ROLE_KEY>"
echo "Poi Redeploy."
