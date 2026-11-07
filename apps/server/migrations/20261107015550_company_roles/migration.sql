CREATE TABLE "auth"."organization_role" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"role" text NOT NULL,
	"permission" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "auth"."organization_role" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_role_company_id_role_key" ON "auth"."organization_role" ("company_id","role");--> statement-breakpoint
ALTER TABLE "auth"."organization_role" ADD CONSTRAINT "organization_role_company_id_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "auth"."organization_role" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_insert" ON "auth"."organization_role" AS PERMISSIVE FOR INSERT TO "hub_operator" WITH CHECK (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')));