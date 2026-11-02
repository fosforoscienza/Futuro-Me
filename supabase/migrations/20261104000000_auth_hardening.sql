-- Additive rollout: deploy before the application. Old inserts remain compatible.
begin;

alter table public.account add column if not exists auth_version uuid not null default gen_random_uuid();
alter table public.sessioni add column if not exists auth_version uuid;
-- Only existing sessions newer than the most recent reset may be preserved.
update public.sessioni s set auth_version = a.auth_version
from public.account a where s.account_id = a.id and s.auth_version is null
and s.created_at > a.password_cambiata_at;

create or replace function public.rotate_auth_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.password_hash is distinct from old.password_hash then
    new.auth_version := gen_random_uuid();
    new.password_cambiata_at := clock_timestamp();
  else
    new.auth_version := old.auth_version;
  end if;
  return new;
end $$;
drop trigger if exists account_rotate_auth_version on public.account;
create trigger account_rotate_auth_version before update on public.account
for each row execute function public.rotate_auth_version();

create or replace function public.check_session_auth_version() returns trigger
language plpgsql set search_path = '' as $$
declare current_version uuid;
begin
  -- The row lock serializes creation with password changes, even across instances.
  select auth_version into current_version from public.account
    where id = new.account_id for share;
  if current_version is null then raise exception 'Account unavailable'; end if;
  -- Compatibility for the previous deployment; the new app always supplies a version.
  if new.auth_version is null then new.auth_version := current_version; end if;
  if new.auth_version <> current_version then raise exception 'Credentials changed'; end if;
  return new;
end $$;
drop trigger if exists sessioni_check_auth_version on public.sessioni;
create trigger sessioni_check_auth_version before insert on public.sessioni
for each row execute function public.check_session_auth_version();

create table if not exists public.auth_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  attempts integer not null,
  expires_at timestamptz not null
);
create index if not exists auth_rate_limits_expiry_idx on public.auth_rate_limits(expires_at);
alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from public, anon, authenticated;

create or replace function public.consume_auth_rate_limit(
  p_key_hash text, p_limit integer, p_window_seconds integer
) returns boolean language plpgsql security definer set search_path = '' as $$
declare used integer; now_at timestamptz := clock_timestamp();
begin
  if p_limit < 1 or p_limit > 10000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit';
  end if;
  delete from public.auth_rate_limits where expires_at <= now_at;
  insert into public.auth_rate_limits as rl(key_hash, attempts, expires_at)
  values(p_key_hash, 1, now_at + make_interval(secs => p_window_seconds))
  on conflict(key_hash) do update set
    attempts = case when rl.expires_at <= now_at then 1 else least(rl.attempts + 1, p_limit + 1) end,
    expires_at = case when rl.expires_at <= now_at then excluded.expires_at else rl.expires_at end
  returning attempts into used;
  return used <= p_limit;
end $$;
revoke all on function public.consume_auth_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_auth_rate_limit(text, integer, integer) to service_role;
revoke all on function public.rotate_auth_version() from public, anon, authenticated;
revoke all on function public.check_session_auth_version() from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
