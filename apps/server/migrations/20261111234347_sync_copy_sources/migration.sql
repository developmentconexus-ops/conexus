CREATE TABLE "copies"."copy_proposal_source" (
	"company_id" text NOT NULL,
	"proposal_id" uuid,
	"connector_id" text NOT NULL,
	"connection_id" uuid,
	CONSTRAINT "copy_proposal_source_pkey" PRIMARY KEY("proposal_id","connection_id")
);
--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal_source" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."copy_source" (
	"company_id" text NOT NULL,
	"copy_id" uuid,
	"connector_id" text NOT NULL,
	"connection_id" uuid,
	"account_ref" text,
	"pass" integer DEFAULT 0 NOT NULL,
	"pass_started_at" timestamp with time zone,
	"position" jsonb,
	"watermark" timestamp with time zone,
	"wait_until" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "copy_source_pkey" PRIMARY KEY("copy_id","connection_id"),
	CONSTRAINT "copy_source_copy_id_account_ref_key" UNIQUE("copy_id","account_ref"),
	CONSTRAINT "copy_source_position" CHECK ("position" IS NULL OR jsonb_typeof("position") = 'object')
);
--> statement-breakpoint
ALTER TABLE "copies"."copy_source" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."copy_table_left" (
	"company_id" text,
	"copy_id" uuid,
	"name" text NOT NULL,
	CONSTRAINT "copy_table_left_pkey" PRIMARY KEY("company_id","copy_id"),
	CONSTRAINT "copy_table_left_name" CHECK ("name" ~ '^[a-z][a-z0-9_]{0,39}$')
);
--> statement-breakpoint
ALTER TABLE "copies"."copy_table_left" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal" ADD COLUMN "proved_calls" integer;--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal_source" ADD CONSTRAINT "copy_proposal_source_proposal_fkey" FOREIGN KEY ("proposal_id") REFERENCES "copies"."copy_proposal"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal_source" ADD CONSTRAINT "copy_proposal_source_connection_fkey" FOREIGN KEY ("company_id","connector_id","connection_id") REFERENCES "connectors"."connection"("company_id","connector_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_source" ADD CONSTRAINT "copy_source_copy_fkey" FOREIGN KEY ("company_id","copy_id") REFERENCES "copies"."copy"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_source" ADD CONSTRAINT "copy_source_connection_fkey" FOREIGN KEY ("company_id","connector_id","connection_id") REFERENCES "connectors"."connection"("company_id","connector_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_table_left" ADD CONSTRAINT "copy_table_left_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy_proposal_source" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy_source" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy_table_left" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));