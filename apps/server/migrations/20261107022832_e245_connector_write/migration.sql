CREATE TABLE "connectors"."connector_write" (
	"company_id" text,
	"thread_id" text,
	"tool_call_id" text,
	"connection_id" uuid NOT NULL,
	"operation_id" text NOT NULL,
	"input_hash" text NOT NULL,
	"version_id" uuid,
	"person_id" text,
	"state" text NOT NULL,
	"answer" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "connector_write_pkey" PRIMARY KEY("company_id","thread_id","tool_call_id"),
	CONSTRAINT "connector_write_speaker" CHECK (("version_id" is null) <> ("person_id" is null)),
	CONSTRAINT "connector_write_state" CHECK ("state" in ('SENDING', 'DONE', 'REFUSED', 'UNCERTAIN'))
);
--> statement-breakpoint
ALTER TABLE "connectors"."connector_write" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "company_all" ON "connectors"."connector_write" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));