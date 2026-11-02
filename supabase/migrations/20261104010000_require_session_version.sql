-- Apply AFTER the new application deployment has been verified.
-- Old/preview deployments must no longer create sessions without a verified version.
begin;
create or replace function public.check_session_auth_version() returns trigger
language plpgsql set search_path = '' as $$
declare current_version uuid;
begin
  select auth_version into current_version from public.account
    where id = new.account_id for share;
  if current_version is null or new.auth_version is null or new.auth_version <> current_version then
    raise exception 'Credentials changed';
  end if;
  return new;
end $$;
revoke all on function public.check_session_auth_version() from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
