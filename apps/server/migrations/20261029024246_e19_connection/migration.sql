CREATE SCHEMA "connectors";
--> statement-breakpoint
CREATE TABLE "connectors"."connection" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connector_id" text NOT NULL,
	"connector_version" text NOT NULL,
	"state" text NOT NULL,
	"sealed" bytea NOT NULL,
	"key_id" text NOT NULL,
	"linked_by" text NOT NULL,
	"linked_at" timestamp with time zone NOT NULL,
	"tested_at" timestamp with time zone,
	"attempt_key" text NOT NULL,
	CONSTRAINT "connection_connector_key" UNIQUE("company_id","connector_id"),
	CONSTRAINT "connection_attempt_key" UNIQUE("company_id","attempt_key"),
	CONSTRAINT "connection_state" CHECK ("state" IN ('NEW', 'ACTIVE', 'NEEDS_REAUTH')),
	CONSTRAINT "connection_connector_id" CHECK ("connector_id" ~ '^[a-z][a-z0-9-]{1,31}$')
);
--> statement-breakpoint
ALTER TABLE "connectors"."connection" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD CONSTRAINT "connection_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "connectors"."connection" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "connection_seals_select" ON "connectors"."connection" AS PERMISSIVE FOR SELECT TO "hub_connection_seals" USING (true);