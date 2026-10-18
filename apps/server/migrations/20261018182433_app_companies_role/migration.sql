-- Custom SQL: Drizzle cannot generate a role (data D5). Step 9, founder 2026-10-18 ("Tudo A", data
-- D11): the role that owns apps.companies_with_apps, for the repair at start. It cannot log in, owns
-- nothing else and reads one column of the apps, as hub_hosts does for its lookup.
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_app_companies NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_app_companies NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
