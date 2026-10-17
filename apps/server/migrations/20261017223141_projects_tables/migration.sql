CREATE SCHEMA "projects";
--> statement-breakpoint
CREATE TABLE "projects"."company_database" (
	"company_id" text PRIMARY KEY,
	"state" text NOT NULL,
	"neon_project_id" text CONSTRAINT "company_database_neon_project_id_key" UNIQUE,
	"claimed_until" timestamp with time zone,
	CONSTRAINT "company_database_state" CHECK ("state" IN ('creating', 'ready')),
	CONSTRAINT "company_database_ready_has_project" CHECK (("state" = 'ready') = ("neon_project_id" IS NOT NULL)),
	CONSTRAINT "company_database_creating_has_claim" CHECK (("state" = 'creating') = ("claimed_until" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "projects"."company_database" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects"."project" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"attempt_key" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "project_company_id_attempt_key_key" UNIQUE("company_id","attempt_key"),
	CONSTRAINT "project_name_length" CHECK (char_length("name") BETWEEN 1 AND 100)
);
--> statement-breakpoint
ALTER TABLE "projects"."project" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."company" ADD COLUMN "deleting_since" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "project_company_name_key" ON "projects"."project" ("company_id",lower("name"));--> statement-breakpoint
CREATE POLICY "company_all" ON "projects"."company_database" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "projects"."company_database" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "projects"."company_database" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "projects"."project" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "projects"."project" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "projects"."project" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));