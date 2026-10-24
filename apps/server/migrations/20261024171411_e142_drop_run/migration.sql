-- contract: nothing reads or writes builder.run any more (step 14.2, topic 6, part A). A turn lives in Mastra's own run and the bucket copy is the ref refs/conexus/copied in the Projeto's repository, so the table, its function and its role leave in this one step (data D30: no company data). Needs the founder's word (data D11): it removes a role and its grants.
DROP FUNCTION builder.companies_with_runs();
--> statement-breakpoint
DROP POLICY "company_all" ON "builder"."run";--> statement-breakpoint
DROP POLICY "runs_select" ON "builder"."run";--> statement-breakpoint
DROP TABLE "builder"."run";
--> statement-breakpoint
REVOKE USAGE ON SCHEMA builder FROM hub_runs;
--> statement-breakpoint
DROP ROLE hub_runs;
