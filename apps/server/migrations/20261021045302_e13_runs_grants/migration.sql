-- Custom SQL: Drizzle cannot generate a function or a grant (data D5). Step 13, founder
-- 2026-10-20 ("Aprovo", data D11): a company's routes admit, drive and settle their Projetos' runs and
-- keep each run's events and each Projeto's machine, but a run's lease and takeover at start look
-- across companies, which the scope forbids: one function names the companies that have work left,
-- as builder.companies_with_seals does, and holds no row of them for the Hub's login.
GRANT SELECT, INSERT, DELETE, UPDATE (state, base_sha, candidate_sha, lease_until, owner, copied_at) ON TABLE builder.run TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE builder.run_event TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE, UPDATE (sandbox_id, used_at) ON TABLE builder.machine TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA builder TO hub_runs;
--> statement-breakpoint
GRANT SELECT (company_id, state, candidate_sha, copied_at) ON TABLE builder.run TO hub_runs;
--> statement-breakpoint
-- The companies with a turn that is not over, or a saved version whose copy is not made.
CREATE FUNCTION builder.companies_with_runs() RETURNS TABLE (company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT DISTINCT r.company_id FROM builder.run r
    WHERE r.state IN ('open', 'saving')
      OR (r.candidate_sha IS NOT NULL AND r.copied_at IS NULL) $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION builder.companies_with_runs() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION builder.companies_with_runs() TO hub_runtime;
--> statement-breakpoint
GRANT CREATE ON SCHEMA builder TO hub_runs;
--> statement-breakpoint
GRANT hub_runs TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION builder.companies_with_runs() OWNER TO hub_runs;
--> statement-breakpoint
REVOKE hub_runs FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA builder FROM hub_runs;
