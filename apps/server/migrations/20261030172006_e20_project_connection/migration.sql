CREATE TABLE "connectors"."project_connection" (
	"project_id" text,
	"company_id" text NOT NULL,
	"connector_id" text NOT NULL,
	"connection_id" uuid,
	"exclusive" boolean NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "project_connection_pkey" PRIMARY KEY("project_id","connection_id")
);
--> statement-breakpoint
ALTER TABLE "connectors"."project_connection" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD COLUMN "notes" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "project_connection_one_key" ON "connectors"."project_connection" ("project_id","connector_id") WHERE "exclusive";--> statement-breakpoint
ALTER TABLE "connectors"."project_connection" ADD CONSTRAINT "project_connection_connection_fkey" FOREIGN KEY ("company_id","connector_id","connection_id") REFERENCES "connectors"."connection"("company_id","connector_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "connectors"."project_connection" ADD CONSTRAINT "project_connection_project_fkey" FOREIGN KEY ("company_id","project_id") REFERENCES "projects"."project"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD CONSTRAINT "connection_notes" CHECK (jsonb_typeof("notes") = 'object' AND octet_length("notes"::text) <= 32768);--> statement-breakpoint
CREATE POLICY "company_all" ON "connectors"."project_connection" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));