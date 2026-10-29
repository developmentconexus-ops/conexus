-- Custom SQL: Drizzle cannot generate a function or a grant (data D5). Step 19, founder 2026-10-28
-- (the step 19 card, data D11): a company's routes link, read, test and remove its connections, but
-- never read a sealed credential: one function hands it out, one connection at a time, in the
-- transaction's company. The Hub's login reaches no table of them.
GRANT USAGE ON SCHEMA connectors TO hub_company;
--> statement-breakpoint
GRANT SELECT (id, company_id, connector_id, name, connector_version, state, key_id, linked_by, linked_at, tested_at, tested_by, last_test, attempt_key), INSERT, DELETE ON TABLE connectors.connection TO hub_company;
--> statement-breakpoint
GRANT UPDATE (state, tested_at, tested_by, last_test, sealed, key_id) ON TABLE connectors.connection TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA connectors TO hub_connection_seals;
--> statement-breakpoint
GRANT SELECT (id, company_id, sealed, key_id) ON TABLE connectors.connection TO hub_connection_seals;
--> statement-breakpoint
-- A connection's sealed credential, in the company the transaction entered: the one way any role
-- reads `sealed`.
CREATE FUNCTION connectors.sealed_of(connection uuid) RETURNS TABLE (sealed bytea, key_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT c.sealed, c.key_id FROM connectors.connection c
    WHERE c.id = connection
      AND c.company_id = nullif(current_setting('conexus.company_id', true), '') $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION connectors.sealed_of(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION connectors.sealed_of(uuid) TO hub_company;
--> statement-breakpoint
-- The companies that hold a sealed value, for `reseal`, before any company is known: the one
-- answer the Hub's login gets from the connections, and it holds no row of them.
CREATE FUNCTION connectors.companies_with_seals() RETURNS TABLE (company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT DISTINCT c.company_id FROM connectors.connection c $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION connectors.companies_with_seals() FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA connectors TO hub_runtime;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION connectors.companies_with_seals() TO hub_runtime;
--> statement-breakpoint
-- Both functions change hands to the role that cannot log in, as builder's did.
GRANT CREATE ON SCHEMA connectors TO hub_connection_seals;
--> statement-breakpoint
GRANT hub_connection_seals TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION connectors.sealed_of(uuid) OWNER TO hub_connection_seals;
--> statement-breakpoint
ALTER FUNCTION connectors.companies_with_seals() OWNER TO hub_connection_seals;
--> statement-breakpoint
REVOKE hub_connection_seals FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA connectors FROM hub_connection_seals;
