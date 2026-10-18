-- Custom SQL: Drizzle cannot generate a role (data D5). Step 8, founder 2026-10-17 ("Grant A", data
-- D11): the role that owns projects.project_of_host. It cannot log in, owns nothing else and reads
-- three columns of the Projects, as hub_administrators does for its check (decision 0039, A1).
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_hosts NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_hosts NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
