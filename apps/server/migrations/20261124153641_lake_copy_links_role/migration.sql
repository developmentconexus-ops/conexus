-- Custom SQL: Drizzle cannot generate a role (data D5). The lake copy's first part (data D11,
-- founder 2026-11-24, asked "Pode dar a palavra?", answered "Sim"): the role that owns
-- connectors.link_of, the one way a route without a session finds a link. It cannot log in and owns nothing else, as hub_connection_seals. It comes
-- before the generated migration, whose row policy names it.
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_links NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_links NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
