CREATE SCHEMA "lake";
--> statement-breakpoint
CREATE TABLE "lake"."company_lake" (
	"company_id" text PRIMARY KEY,
	"lake_id" text NOT NULL CONSTRAINT "company_lake_lake_id_key" UNIQUE,
	"state" text NOT NULL,
	"account" text NOT NULL,
	"region" text NOT NULL,
	"template" text NOT NULL,
	"stack_id" text CONSTRAINT "company_lake_stack_id_key" UNIQUE,
	"since" timestamp with time zone NOT NULL,
	"failure" text,
	CONSTRAINT "company_lake_lake_id_form" CHECK ("lake_id" ~ '^[a-z0-9]{12}$'),
	CONSTRAINT "company_lake_state" CHECK ("state" IN ('creating', 'ready', 'failed', 'deleting', 'delete_failed')),
	CONSTRAINT "company_lake_account_form" CHECK ("account" ~ '^[0-9]{12}$'),
	CONSTRAINT "company_lake_region_form" CHECK ("region" ~ '^[a-z]{2}-[a-z]+-[0-9]$'),
	CONSTRAINT "company_lake_template_form" CHECK ("template" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "company_lake_settled_has_stack" CHECK ("state" NOT IN ('ready', 'deleting', 'delete_failed') OR "stack_id" IS NOT NULL),
	CONSTRAINT "company_lake_failure_only_when_failed" CHECK (("state" = 'failed') = ("failure" IS NOT NULL)),
	CONSTRAINT "company_lake_failure_code" CHECK ("failure" IS NULL OR "failure" = 'LAKE_CREATE_FAILED')
);
--> statement-breakpoint
ALTER TABLE "lake"."company_lake" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "operator_select" ON "lake"."company_lake" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')));--> statement-breakpoint
CREATE POLICY "operator_insert" ON "lake"."company_lake" AS PERMISSIVE FOR INSERT TO "hub_operator" WITH CHECK (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')));--> statement-breakpoint
CREATE POLICY "operator_update" ON "lake"."company_lake" AS PERMISSIVE FOR UPDATE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), ''))) WITH CHECK (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "lake"."company_lake" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));