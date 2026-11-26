CREATE SCHEMA "treatment";
--> statement-breakpoint
CREATE TABLE "treatment"."model" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "treatment_model_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "treatment_model_name_key" UNIQUE("company_id","name"),
	CONSTRAINT "treatment_model_name" CHECK ("name" ~ '^[a-z][a-z0-9_]{0,59}$'),
	CONSTRAINT "treatment_model_description" CHECK (char_length("description") <= 500)
);
--> statement-breakpoint
ALTER TABLE "treatment"."model" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "treatment"."model_run" (
	"run_id" text,
	"company_id" text NOT NULL,
	"name" text,
	"version_id" text,
	"status" text NOT NULL,
	"rows" integer,
	"failure" text,
	"line" integer,
	CONSTRAINT "model_run_pkey" PRIMARY KEY("run_id","name"),
	CONSTRAINT "treatment_model_run_status" CHECK ("status" IN ('BUILT', 'FAILED', 'SKIPPED')),
	CONSTRAINT "treatment_model_run_rows" CHECK (("status" = 'BUILT') = ("rows" IS NOT NULL) AND "rows" >= 0),
	CONSTRAINT "treatment_model_run_failure" CHECK (("status" = 'FAILED') = ("failure" IS NOT NULL)),
	CONSTRAINT "treatment_model_run_line" CHECK ("line" IS NULL OR ("status" = 'FAILED' AND "line" >= 1))
);
--> statement-breakpoint
ALTER TABLE "treatment"."model_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "treatment"."run" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"lake_id" text NOT NULL,
	"cause" text NOT NULL,
	"state" text NOT NULL,
	"select" jsonb NOT NULL,
	"pending" jsonb DEFAULT '[]' NOT NULL,
	"failure" text,
	"stopped_by" text,
	"attempt" integer NOT NULL,
	"task" text,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "treatment_run_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "treatment_run_cause" CHECK ("cause" IN ('COPY', 'NOW')),
	CONSTRAINT "treatment_run_state" CHECK ("state" IN ('STARTING', 'RUNNING', 'DONE', 'FAILED', 'STOPPED')),
	CONSTRAINT "treatment_run_ended" CHECK (("ended_at" IS NULL) = ("state" IN ('STARTING', 'RUNNING'))),
	CONSTRAINT "treatment_run_failure_only_when_failed" CHECK (("state" = 'FAILED') = ("failure" IS NOT NULL)),
	CONSTRAINT "treatment_run_failure" CHECK ("failure" IS NULL OR "failure" IN ('TREAT_START_FAILED', 'TREAT_TASK_STOPPED', 'TREAT_SPEC_INVALID', 'TREAT_ENGINE_FAILED')),
	CONSTRAINT "treatment_run_attempt" CHECK ("attempt" >= 1),
	CONSTRAINT "treatment_run_select" CHECK (jsonb_typeof("select") = 'array'),
	CONSTRAINT "treatment_run_pending" CHECK (jsonb_typeof("pending") = 'array')
);
--> statement-breakpoint
ALTER TABLE "treatment"."run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "treatment"."version" (
	"id" text PRIMARY KEY,
	"model_id" text NOT NULL,
	"company_id" text NOT NULL,
	"number" integer NOT NULL,
	"sql" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"hash" text NOT NULL,
	"proposed_by" text NOT NULL,
	"proposed_at" timestamp with time zone NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	CONSTRAINT "treatment_version_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "treatment_version_number_key" UNIQUE("model_id","number"),
	CONSTRAINT "treatment_version_number" CHECK ("number" >= 1),
	CONSTRAINT "treatment_version_sql" CHECK (char_length("sql") <= 20000),
	CONSTRAINT "treatment_version_inputs" CHECK (jsonb_typeof("inputs") = 'array'),
	CONSTRAINT "treatment_version_hash" CHECK ("hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "treatment_version_approved" CHECK (("approved_by" IS NULL) = ("approved_at" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "treatment"."version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_run_open_key" ON "treatment"."run" ("company_id") WHERE "ended_at" IS NULL;--> statement-breakpoint
ALTER TABLE "treatment"."model_run" ADD CONSTRAINT "treatment_model_run_run_fkey" FOREIGN KEY ("company_id","run_id") REFERENCES "treatment"."run"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "treatment"."model_run" ADD CONSTRAINT "treatment_model_run_version_fkey" FOREIGN KEY ("company_id","version_id") REFERENCES "treatment"."version"("company_id","id") ON DELETE SET NULL ("version_id");--> statement-breakpoint
ALTER TABLE "treatment"."version" ADD CONSTRAINT "treatment_version_model_fkey" FOREIGN KEY ("company_id","model_id") REFERENCES "treatment"."model"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "treatment"."model" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "treatment"."model" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "treatment"."model" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "treatment"."model_run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "treatment"."run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "treatment"."run" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "treatment"."run" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "treatment"."version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));