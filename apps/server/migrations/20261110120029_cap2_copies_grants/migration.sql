-- Custom SQL: Drizzle cannot generate a grant (data D5). Capacity 2, U2, with the founder's word in
-- the pull request of its own (data D11): a company's routes and its copies' runs turn a copy on,
-- hold its run's lease, save where its pass stands, record each run and keep the newest, and release
-- a copy to a Projeto and take it back. A copy leaves only by its foreign keys' cascade.
GRANT USAGE ON SCHEMA copies TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE copies.copy TO hub_company;
--> statement-breakpoint
GRANT UPDATE (claim_token, claimed_until, pass, pass_started_at, position, watermark, rows, last_run_id) ON TABLE copies.copy TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE copies.copy_run TO hub_company;
--> statement-breakpoint
GRANT UPDATE (ended_at, outcome, reason, pages, read, written) ON TABLE copies.copy_run TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE copies.project_copy TO hub_company;
