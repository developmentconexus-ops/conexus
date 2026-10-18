-- Custom SQL: Drizzle cannot generate a function or a grant (data D5, issue 72). Step 8, founder
-- 2026-10-17 ("Grant A", data D11): the Hub's login writes and redeems app handoffs and sessions and
-- finds a host's Project through one function; a company's routes choose its nickname.
GRANT USAGE ON SCHEMA apps TO hub_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE apps.handoff TO hub_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE apps.app_session TO hub_runtime;
--> statement-breakpoint
GRANT UPDATE (nickname) ON TABLE auth.company TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA projects TO hub_hosts;
--> statement-breakpoint
GRANT SELECT (id, company_id, host_label) ON TABLE projects.project TO hub_hosts;
--> statement-breakpoint
-- A host's Project and company, before the Hub knows the company: the one answer the Hub's login
-- gets from the Projects of every company, and only for the host it names.
CREATE FUNCTION projects.project_of_host(label text) RETURNS TABLE (project_id text, company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT p.id, p.company_id FROM projects.project p WHERE p.host_label = label $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION projects.project_of_host(text) FROM PUBLIC;
--> statement-breakpoint
-- The schema's USAGE lets the login name the function; it reads no table of the schema.
GRANT USAGE ON SCHEMA projects TO hub_runtime;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION projects.project_of_host(text) TO hub_runtime;
--> statement-breakpoint
-- The function changes hands to the role that cannot log in, as auth.is_installation_administrator
-- did: the owner giving it acts as that role, which creates in the schema, for this moment only.
GRANT CREATE ON SCHEMA projects TO hub_hosts;
--> statement-breakpoint
GRANT hub_hosts TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION projects.project_of_host(text) OWNER TO hub_hosts;
--> statement-breakpoint
REVOKE hub_hosts FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA projects FROM hub_hosts;
