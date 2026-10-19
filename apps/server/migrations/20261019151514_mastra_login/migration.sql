-- Custom SQL: Drizzle cannot generate a role or a database grant (data D5, D10). Step 12, founder
-- 2026-10-19 ("1. A", data D11): Mastra's login enters only Mastra's database (decision 0010). Roles
-- belong to the whole server, so an existing one is kept; `migrate` sets its password from Mastra's
-- key file, never in SQL (data D20), and gives it Mastra's database.
DO $$
BEGIN
  BEGIN
    CREATE ROLE mastra_runtime LOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE mastra_runtime SET statement_timeout = '10s';
  ALTER ROLE mastra_runtime SET idle_in_transaction_session_timeout = '10s';
END
$$;
--> statement-breakpoint
-- The Hub's database lets in its own logins only: PUBLIC loses CONNECT, so Mastra's login is
-- refused at the door, before any grant could matter.
DO $$
BEGIN
  EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO hub_runtime', current_database());
END
$$;
