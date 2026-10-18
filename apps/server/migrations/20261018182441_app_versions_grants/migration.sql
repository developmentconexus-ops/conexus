-- Custom SQL: Drizzle cannot generate a function or a grant (data D5, issue 72). Step 9, founder
-- 2026-10-18 ("Tudo A", data D11): a company's routes send, list, put back and delete its apps'
-- versions, mark a Projeto being deleted and record its database's host; the Central, deleting a
-- company, reads and deletes its apps' rows. The Hub's login reaches no table of them.
GRANT USAGE ON SCHEMA apps TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA apps TO hub_operator;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE apps.app, apps.app_version, apps.version_file, apps.blob TO hub_company;
--> statement-breakpoint
GRANT SELECT, DELETE ON TABLE apps.app, apps.app_version, apps.version_file, apps.blob TO hub_operator;
--> statement-breakpoint
GRANT UPDATE (host) ON TABLE projects.company_database TO hub_company;
--> statement-breakpoint
GRANT UPDATE (deleting_since) ON TABLE projects.project TO hub_company;
--> statement-breakpoint
-- A Projeto being deleted has no app: the host lookup reads its mark too.
GRANT SELECT (deleting_since) ON TABLE projects.project TO hub_hosts;
--> statement-breakpoint
GRANT hub_hosts TO current_user WITH INHERIT TRUE, SET TRUE;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION projects.project_of_host(label text) RETURNS TABLE (project_id text, company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT p.id, p.company_id FROM projects.project p WHERE p.host_label = label AND p.deleting_since IS NULL $$;
--> statement-breakpoint
REVOKE hub_hosts FROM current_user;
--> statement-breakpoint
-- The companies that have an app, for the repair at start, before any company is known: the one
-- answer the Hub's login gets from every company's apps, and it holds no row of them.
GRANT USAGE ON SCHEMA apps TO hub_app_companies;
--> statement-breakpoint
GRANT SELECT (company_id) ON TABLE apps.app TO hub_app_companies;
--> statement-breakpoint
CREATE FUNCTION apps.companies_with_apps() RETURNS TABLE (company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT DISTINCT a.company_id FROM apps.app a $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION apps.companies_with_apps() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION apps.companies_with_apps() TO hub_runtime;
--> statement-breakpoint
-- The function changes hands to the role that cannot log in, as projects.project_of_host did.
GRANT CREATE ON SCHEMA apps TO hub_app_companies;
--> statement-breakpoint
GRANT hub_app_companies TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION apps.companies_with_apps() OWNER TO hub_app_companies;
--> statement-breakpoint
REVOKE hub_app_companies FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA apps FROM hub_app_companies;
