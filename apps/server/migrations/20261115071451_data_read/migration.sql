CREATE SCHEMA "data";
--> statement-breakpoint
CREATE TABLE "data"."data_read" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"person_id" text NOT NULL,
	"agent" text NOT NULL,
	"project_id" text,
	"agent_id" text,
	"thread_id" text,
	"verb" text NOT NULL,
	"tables" text[] NOT NULL,
	"connection_id" uuid,
	"operation" text,
	"query" text,
	"outcome" text NOT NULL,
	"rows" integer,
	"ms" integer NOT NULL,
	CONSTRAINT "data_read_agent" CHECK ("agent" in ('ASSISTANT', 'BUILDER', 'AGENT', 'APP')),
	CONSTRAINT "data_read_verb" CHECK ("verb" in ('SAMPLE', 'QUERY', 'LIVE')),
	CONSTRAINT "data_read_live" CHECK (("verb" = 'LIVE') = ("connection_id" is not null and "operation" is not null)),
	CONSTRAINT "data_read_query" CHECK (("query" is null or "verb" = 'QUERY') and char_length("query") <= 4000),
	CONSTRAINT "data_read_counts" CHECK (("rows" is null or "rows" >= 0) and "ms" >= 0)
);
--> statement-breakpoint
ALTER TABLE "data"."data_read" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "data_read_company_at_idx" ON "data"."data_read" ("company_id","at");--> statement-breakpoint
ALTER TABLE "data"."data_read" ADD CONSTRAINT "data_read_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "data"."data_read" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));