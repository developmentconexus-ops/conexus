CREATE TABLE "apps"."app" (
	"project_id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"live_version_id" text,
	"sending_version_id" text,
	"claimed_until" timestamp with time zone,
	"database_ready" boolean DEFAULT false NOT NULL,
	CONSTRAINT "app_sending_has_claim" CHECK (("sending_version_id" IS NULL) = ("claimed_until" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "apps"."app" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "apps"."app_version" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"state" text NOT NULL,
	"failure" text,
	"manifest" jsonb NOT NULL,
	"digest" text NOT NULL,
	"sent_by" text NOT NULL,
	"attempt_key" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "app_version_project_id_number_key" UNIQUE("project_id","number"),
	CONSTRAINT "app_version_project_id_attempt_key_key" UNIQUE("project_id","attempt_key"),
	CONSTRAINT "app_version_project_id_id_key" UNIQUE("project_id","id"),
	CONSTRAINT "app_version_state" CHECK ("state" IN ('sending', 'ready', 'failed', 'pruning')),
	CONSTRAINT "app_version_failed_has_failure" CHECK ("state" <> 'failed' OR "failure" IS NOT NULL),
	CONSTRAINT "app_version_number_positive" CHECK ("number" > 0),
	CONSTRAINT "app_version_digest_form" CHECK ("digest" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "apps"."app_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "apps"."blob" (
	"company_id" text,
	"sha256" text,
	"bytes" bytea NOT NULL,
	CONSTRAINT "blob_pkey" PRIMARY KEY("company_id","sha256"),
	CONSTRAINT "blob_sha256_form" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "blob_size" CHECK (octet_length("bytes") <= 10485760)
);
--> statement-breakpoint
ALTER TABLE "apps"."blob" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "apps"."version_file" (
	"version_id" text,
	"company_id" text NOT NULL,
	"path" text,
	"sha256" text NOT NULL,
	"size" integer NOT NULL,
	"media_type" text NOT NULL,
	CONSTRAINT "version_file_pkey" PRIMARY KEY("version_id","path"),
	CONSTRAINT "version_file_size" CHECK ("size" BETWEEN 0 AND 10485760)
);
--> statement-breakpoint
ALTER TABLE "apps"."version_file" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects"."company_database" ADD COLUMN "host" text;--> statement-breakpoint
ALTER TABLE "projects"."project" ADD COLUMN "deleting_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apps"."app" ADD CONSTRAINT "app_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "apps"."app" ADD CONSTRAINT "app_live_version_fkey" FOREIGN KEY ("project_id","live_version_id") REFERENCES "apps"."app_version"("project_id","id");--> statement-breakpoint
ALTER TABLE "apps"."app" ADD CONSTRAINT "app_sending_version_fkey" FOREIGN KEY ("project_id","sending_version_id") REFERENCES "apps"."app_version"("project_id","id");--> statement-breakpoint
ALTER TABLE "apps"."app_version" ADD CONSTRAINT "app_version_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "apps"."app"("project_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "apps"."version_file" ADD CONSTRAINT "version_file_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "apps"."app_version"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "apps"."version_file" ADD CONSTRAINT "version_file_blob_fkey" FOREIGN KEY ("company_id","sha256") REFERENCES "apps"."blob"("company_id","sha256");--> statement-breakpoint
CREATE POLICY "company_all" ON "apps"."app" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "apps"."app" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "apps"."app" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "companies_select" ON "apps"."app" AS PERMISSIVE FOR SELECT TO "hub_app_companies" USING (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "apps"."app_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "apps"."app_version" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "apps"."app_version" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "apps"."blob" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "apps"."blob" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "apps"."blob" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "apps"."version_file" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "apps"."version_file" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "apps"."version_file" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));