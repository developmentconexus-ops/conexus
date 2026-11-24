-- Custom SQL: Drizzle cannot generate a function or a grant (data D5). The lake copy's first part,
-- in the pull request of its own (data D11): a company's routes keep the four tables of its copies;
-- its login reads its own lake's row, five columns of it (decision H); and a link for another person
-- is found by one function owned by a role that cannot log in.
GRANT USAGE ON SCHEMA copies TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE copies.lake_copy, copies.lake_table, copies.lake_run, copies.lake_table_run TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA lake TO hub_company;
--> statement-breakpoint
GRANT SELECT (company_id, lake_id, state, account, region) ON TABLE lake.company_lake TO hub_company;
--> statement-breakpoint
-- The routes with a session make, read and spend a link; they never read the digest of its secret.
GRANT SELECT (id, company_id, connector_id, name, asked, sealed, key_id, created_by, expires_at), INSERT, DELETE ON TABLE connectors.connection_link TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA connectors TO hub_links;
--> statement-breakpoint
GRANT SELECT (id, company_id, created_by, secret_hash, expires_at) ON TABLE connectors.connection_link TO hub_links;
--> statement-breakpoint
-- A live link by the digest of its secret, before the Hub knows the company: the one answer the
-- Hub's login gets from the links of every company, and only for the digest it names.
CREATE FUNCTION connectors.link_of(secret_hash text) RETURNS TABLE (id uuid, company_id text, created_by text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT l.id, l.company_id, l.created_by FROM connectors.connection_link l
    WHERE l.secret_hash = link_of.secret_hash AND l.expires_at > statement_timestamp() $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION connectors.link_of(text) FROM PUBLIC;
--> statement-breakpoint
-- The schema's USAGE lets the login name the function; it reads no table of the schema.
GRANT USAGE ON SCHEMA connectors TO hub_runtime;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION connectors.link_of(text) TO hub_runtime;
--> statement-breakpoint
-- The function changes hands to the role that cannot log in, as connectors.sealed_of did: the owner
-- giving it acts as that role, which creates in the schema, for this moment only.
GRANT CREATE ON SCHEMA connectors TO hub_links;
--> statement-breakpoint
GRANT hub_links TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION connectors.link_of(text) OWNER TO hub_links;
--> statement-breakpoint
REVOKE hub_links FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA connectors FROM hub_links;
