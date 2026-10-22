-- Step 14: a company's routes record the libraries a Projeto's owner allowed and read them for each
-- check; an update changes the version of a package granted before. A turn that waits on an answer
-- (`waiting`) has work left like an open one: the function that names the companies with work
-- left counts it.
GRANT SELECT, INSERT, UPDATE (version, granted_by, granted_at) ON TABLE builder.package_grant TO hub_company;
--> statement-breakpoint
-- The function belongs to a role that cannot log in; the migration is its member for a moment.
GRANT CREATE ON SCHEMA builder TO hub_runs;
--> statement-breakpoint
GRANT hub_runs TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
SET ROLE hub_runs;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION builder.companies_with_runs() RETURNS TABLE (company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT DISTINCT r.company_id FROM builder.run r
    WHERE r.state IN ('open', 'waiting', 'saving')
      OR (r.candidate_sha IS NOT NULL AND r.copied_at IS NULL) $$;
--> statement-breakpoint
RESET ROLE;
--> statement-breakpoint
REVOKE hub_runs FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA builder FROM hub_runs;
