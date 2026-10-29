-- Custom SQL: Drizzle cannot generate a role (data D5). Step 18, founder 2026-10-28 ("aPROVO PAGINA",
-- data D11): the role that owns projects.apps_of_person. It cannot log in, owns nothing else and
-- reads the columns of three tables the function answers from, as hub_hosts does for project_of_host.
-- It comes before the generated migration, whose row policies name it.
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_app_people NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_app_people NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
