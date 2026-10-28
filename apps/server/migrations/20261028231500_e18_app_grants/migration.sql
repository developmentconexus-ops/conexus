-- Custom SQL: Drizzle cannot generate a function or a grant (data D5, issue 72). Step 18, founder
-- 2026-10-28 ("aPROVO PAGINA", data D11): a company's people write and read who uses its apps; the
-- acceptance of an app invitation writes the one row its invitation names and checks the Projeto is
-- there; the Hub's login finds the apps of a person through one function.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE projects.app_access TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA projects TO hub_invitation;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE projects.app_access TO hub_invitation;
--> statement-breakpoint
GRANT SELECT ON TABLE projects.project TO hub_invitation;
--> statement-breakpoint
GRANT USAGE ON SCHEMA projects, auth TO hub_app_people;
--> statement-breakpoint
GRANT SELECT (project_id, person_id) ON TABLE projects.app_access TO hub_app_people;
--> statement-breakpoint
GRANT SELECT (id, name, host_label, company_id, deleting_since) ON TABLE projects.project TO hub_app_people;
--> statement-breakpoint
GRANT SELECT (id, name, deleting_since) ON TABLE auth.company TO hub_app_people;
--> statement-breakpoint
-- The Projects, with their company's name and address label, of the apps one person uses: the one
-- answer the Hub's login gets from the rows of every company, and only for the person it names.
CREATE FUNCTION projects.apps_of_person(person text)
  RETURNS TABLE (project_id text, project_name text, company_name text, host_label text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT p.id, p.name, c.name, p.host_label
    FROM projects.app_access a
    JOIN projects.project p ON p.id = a.project_id AND p.deleting_since IS NULL
    JOIN auth.company c ON c.id = p.company_id AND c.deleting_since IS NULL
    WHERE a.person_id = person $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION projects.apps_of_person(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION projects.apps_of_person(text) TO hub_runtime;
--> statement-breakpoint
GRANT CREATE ON SCHEMA projects TO hub_app_people;
--> statement-breakpoint
GRANT hub_app_people TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION projects.apps_of_person(text) OWNER TO hub_app_people;
--> statement-breakpoint
REVOKE hub_app_people FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA projects FROM hub_app_people;
