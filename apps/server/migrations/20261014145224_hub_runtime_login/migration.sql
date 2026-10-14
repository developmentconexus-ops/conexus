-- Custom SQL: Drizzle cannot generate a role or a grant (data D5, D10).
-- Roles belong to the whole server and tests create many databases on one, so an existing role is
-- kept, and its settings are applied either way. Its password is set by `migrate` from the Hub's
-- key file, never in SQL (data D20).
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_runtime LOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_runtime SET statement_timeout = '10s';
  ALTER ROLE hub_runtime SET idle_in_transaction_session_timeout = '10s';
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA drizzle TO hub_runtime;
--> statement-breakpoint
GRANT SELECT ON TABLE drizzle.__drizzle_migrations TO hub_runtime;
