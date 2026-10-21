CREATE TABLE "builder"."machine" (
	"project_id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"sandbox_id" text NOT NULL,
	"used_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builder"."machine" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."run" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"person_id" text NOT NULL,
	"state" text NOT NULL,
	"base_sha" text,
	"candidate_sha" text,
	"deadline_at" timestamp with time zone NOT NULL,
	"lease_until" timestamp with time zone NOT NULL,
	"owner" uuid NOT NULL,
	"copied_at" timestamp with time zone,
	CONSTRAINT "run_state" CHECK ("state" IN ('open', 'saving', 'saved', 'unchanged', 'stopped', 'interrupted', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "builder"."run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."run_event" (
	"run_id" uuid,
	"company_id" text NOT NULL,
	"n" integer,
	"event" jsonb NOT NULL,
	CONSTRAINT "run_event_pkey" PRIMARY KEY("run_id","n")
);
--> statement-breakpoint
ALTER TABLE "builder"."run_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "run_one_open_per_project" ON "builder"."run" ("project_id") WHERE "state" IN ('open', 'saving');--> statement-breakpoint
ALTER TABLE "builder"."machine" ADD CONSTRAINT "machine_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."machine" ADD CONSTRAINT "machine_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."run" ADD CONSTRAINT "run_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."run" ADD CONSTRAINT "run_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."run" ADD CONSTRAINT "run_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."run_event" ADD CONSTRAINT "run_event_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "builder"."run"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."machine" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "runs_select" ON "builder"."run" AS PERMISSIVE FOR SELECT TO "hub_runs" USING (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."run_event" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));