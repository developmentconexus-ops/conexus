-- Custom SQL: Drizzle cannot generate a role, a grant or a function (data D5); it generated only the
-- policy. Step 24.6, U1, founder 2026-11-08 ("Sim" on the step's card, data D11; the approval of
-- the step's card, docs/approvals.md): the role that owns builder.companies_with_workflows, for the
-- clean-up of the workflow definitions at start. It cannot log in, owns nothing else and reads one
-- column of the workflows, as hub_agent_companies does for the agents.
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_workflow_companies NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_workflow_companies NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
--> statement-breakpoint
CREATE POLICY "workflow_companies_select" ON "builder"."workflow" AS PERMISSIVE FOR SELECT TO "hub_workflow_companies" USING (true);
--> statement-breakpoint
-- A company's routes create, change and delete workflows. A version is never changed: only its
-- author leaves with the person (data D17), and it leaves with its workflow.
GRANT SELECT, INSERT, DELETE ON TABLE builder.workflow TO hub_company;
--> statement-breakpoint
GRANT UPDATE (name, draft, revision, test_draft, state, active_version, active_by, created_by) ON TABLE builder.workflow TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE builder.workflow_version TO hub_company;
--> statement-breakpoint
GRANT UPDATE (published_by) ON TABLE builder.workflow_version TO hub_company;
--> statement-breakpoint
-- The companies with a workflow, for the clean-up at start, before any company is known: the one
-- answer the Hub's login gets from every company's workflows, and it holds no row of them.
GRANT USAGE ON SCHEMA builder TO hub_workflow_companies;
--> statement-breakpoint
GRANT SELECT (company_id) ON TABLE builder.workflow TO hub_workflow_companies;
--> statement-breakpoint
CREATE FUNCTION builder.companies_with_workflows() RETURNS TABLE (company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT DISTINCT w.company_id FROM builder.workflow w $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION builder.companies_with_workflows() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION builder.companies_with_workflows() TO hub_runtime;
--> statement-breakpoint
-- The function changes hands to the role that cannot log in, as builder.companies_with_agents did.
GRANT CREATE ON SCHEMA builder TO hub_workflow_companies;
--> statement-breakpoint
GRANT hub_workflow_companies TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION builder.companies_with_workflows() OWNER TO hub_workflow_companies;
--> statement-breakpoint
REVOKE hub_workflow_companies FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA builder FROM hub_workflow_companies;
