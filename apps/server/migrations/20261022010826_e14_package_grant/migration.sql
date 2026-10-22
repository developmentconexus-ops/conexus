-- contract: step 14's own unreleased state: the run's one-open-per-project index and state check take `waiting`, a turn that waits on an answer; no data of a released version changes (data D6).
CREATE TABLE "builder"."package_grant" (
	"company_id" text NOT NULL,
	"project_id" text,
	"name" text,
	"version" text NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "package_grant_pkey" PRIMARY KEY("project_id","name")
);
--> statement-breakpoint
ALTER TABLE "builder"."package_grant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX "builder"."run_one_open_per_project";--> statement-breakpoint
CREATE UNIQUE INDEX "run_one_open_per_project" ON "builder"."run" ("project_id") WHERE "state" IN ('open', 'waiting', 'saving');--> statement-breakpoint
ALTER TABLE "builder"."package_grant" ADD CONSTRAINT "package_grant_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."package_grant" ADD CONSTRAINT "package_grant_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."run" DROP CONSTRAINT "run_state", ADD CONSTRAINT "run_state" CHECK ("state" IN ('open', 'waiting', 'saving', 'saved', 'unchanged', 'stopped', 'interrupted', 'failed'));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."package_grant" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));