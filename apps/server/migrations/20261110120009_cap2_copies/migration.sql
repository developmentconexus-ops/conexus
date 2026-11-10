CREATE SCHEMA "copies";
--> statement-breakpoint
CREATE TABLE "copies"."copy" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connector_id" text NOT NULL,
	"connection_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"model" text NOT NULL,
	"definition" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"attempt_key" text NOT NULL,
	"body_hash" text NOT NULL,
	"claim_token" uuid,
	"claimed_until" timestamp with time zone,
	"pass" integer DEFAULT 0 NOT NULL,
	"pass_started_at" timestamp with time zone,
	"position" jsonb,
	"watermark" timestamp with time zone,
	"rows" bigint,
	"last_run_id" uuid,
	CONSTRAINT "copy_company_id_name_key" UNIQUE("company_id","name"),
	CONSTRAINT "copy_company_id_attempt_key_key" UNIQUE("company_id","attempt_key"),
	CONSTRAINT "copy_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "copy_claim" CHECK (("claim_token" IS NULL) = ("claimed_until" IS NULL)),
	CONSTRAINT "copy_name" CHECK ("name" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "copy_definition" CHECK (jsonb_typeof("definition") = 'object')
);
--> statement-breakpoint
ALTER TABLE "copies"."copy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."copy_run" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"copy_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"outcome" text,
	"reason" text,
	"pages" integer DEFAULT 0 NOT NULL,
	"read" integer DEFAULT 0 NOT NULL,
	"written" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "copy_run_ended" CHECK (("ended_at" IS NULL) = ("outcome" IS NULL)),
	CONSTRAINT "copy_run_outcome" CHECK ("outcome" IS NULL OR "outcome" IN ('COMPLETE', 'PARTIAL', 'ERROR', 'INTERRUPTED'))
);
--> statement-breakpoint
ALTER TABLE "copies"."copy_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."project_copy" (
	"company_id" text NOT NULL,
	"project_id" text,
	"copy_id" uuid,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "project_copy_pkey" PRIMARY KEY("project_id","copy_id")
);
--> statement-breakpoint
ALTER TABLE "copies"."project_copy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "copy_run_open_key" ON "copies"."copy_run" ("copy_id") WHERE "ended_at" IS NULL;--> statement-breakpoint
CREATE INDEX "copy_run_copy_started_idx" ON "copies"."copy_run" ("copy_id","started_at");--> statement-breakpoint
ALTER TABLE "copies"."copy" ADD CONSTRAINT "copy_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy" ADD CONSTRAINT "copy_connection_fkey" FOREIGN KEY ("company_id","connector_id","connection_id") REFERENCES "connectors"."connection"("company_id","connector_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_run" ADD CONSTRAINT "copy_run_copy_fkey" FOREIGN KEY ("company_id","copy_id") REFERENCES "copies"."copy"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."project_copy" ADD CONSTRAINT "project_copy_project_fkey" FOREIGN KEY ("company_id","project_id") REFERENCES "projects"."project"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."project_copy" ADD CONSTRAINT "project_copy_copy_fkey" FOREIGN KEY ("company_id","copy_id") REFERENCES "copies"."copy"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy_run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."project_copy" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));