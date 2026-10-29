-- Custom SQL: Drizzle cannot generate a role (data D5). Step 19, founder 2026-10-28 (the step 19
-- card, data D11): the role that owns connectors.sealed_of, the one reader of a connection's sealed
-- credential. It cannot log in and owns nothing else, as hub_model_seals. It comes before the
-- generated migration, whose row policy names it.
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_connection_seals NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_connection_seals NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
