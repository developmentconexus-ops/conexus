-- Custom SQL: Drizzle cannot generate a role, a grant or a function (data D5); it generated only the
-- policy. Step 24.3, U1, founder 2026-11-02 ("Aprovo a pagina", data D11; the approval of the step's
-- card, docs/approvals.md): the role that owns builder.companies_with_agents, for the load of the
-- published agents at start. It cannot log in, owns nothing else and reads two columns of the
-- agents, as hub_app_companies does for the apps.
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_agent_companies NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_agent_companies NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
--> statement-breakpoint
CREATE POLICY "agent_companies_select" ON "builder"."agent" AS PERMISSIVE FOR SELECT TO "hub_agent_companies" USING (true);
--> statement-breakpoint
-- A company's routes create, change and delete agents, their choices of tools and the tools of the
-- library. A version is never changed: only its author leaves with the person (data D17), and it
-- leaves with its agent or its tool.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE builder.agent TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE builder.tool TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE builder.agent_tool TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE builder.agent_version TO hub_company;
--> statement-breakpoint
GRANT UPDATE (published_by) ON TABLE builder.agent_version TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE builder.tool_version TO hub_company;
--> statement-breakpoint
GRANT UPDATE (created_by) ON TABLE builder.tool_version TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE builder.agent_version_tool TO hub_company;
--> statement-breakpoint
-- The companies with a published agent, for the load at start, before any company is known: the
-- one answer the Hub's login gets from every company's agents, and it holds no row of them.
GRANT USAGE ON SCHEMA builder TO hub_agent_companies;
--> statement-breakpoint
GRANT SELECT (company_id, active_version) ON TABLE builder.agent TO hub_agent_companies;
--> statement-breakpoint
CREATE FUNCTION builder.companies_with_agents() RETURNS TABLE (company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT DISTINCT a.company_id FROM builder.agent a WHERE a.active_version IS NOT NULL $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION builder.companies_with_agents() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION builder.companies_with_agents() TO hub_runtime;
--> statement-breakpoint
-- The function changes hands to the role that cannot log in, as builder.companies_with_seals did.
GRANT CREATE ON SCHEMA builder TO hub_agent_companies;
--> statement-breakpoint
GRANT hub_agent_companies TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION builder.companies_with_agents() OWNER TO hub_agent_companies;
--> statement-breakpoint
REVOKE hub_agent_companies FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA builder FROM hub_agent_companies;
