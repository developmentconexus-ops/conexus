-- Custom SQL: Drizzle cannot generate a role (data D5). Step 13, founder 2026-10-20 ("Aprovo", data
-- D11): the role that owns builder.companies_with_runs. It cannot log in and owns nothing else, as
-- hub_model_seals (decision 0039, A1).
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_runs NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_runs NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
