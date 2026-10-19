-- Custom SQL: Drizzle cannot generate a role (data D5). Step 11, founder 2026-10-19 ("2. a",
-- Grant A, data D11): the role that owns builder.sealed_of, the one reader of a model account's
-- sealed credential. It cannot log in and owns nothing else, as hub_hosts (decision 0039, A1).
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_model_seals NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_model_seals NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
