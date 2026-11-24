CREATE SCHEMA "copies";
--> statement-breakpoint
CREATE TABLE "connectors"."connection_link" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connector_id" text NOT NULL,
	"name" text NOT NULL,
	"secret_hash" text NOT NULL CONSTRAINT "connection_link_secret_hash_key" UNIQUE,
	"asked" text[] NOT NULL,
	"sealed" bytea,
	"key_id" text,
	"created_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "connection_link_secret_hash" CHECK ("secret_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "connection_link_name" CHECK (char_length("name") BETWEEN 1 AND 60 AND "name" = btrim("name")),
	CONSTRAINT "connection_link_connector_id" CHECK ("connector_id" ~ '^[a-z][a-z0-9-]{1,31}$'),
	CONSTRAINT "connection_link_asked" CHECK (cardinality("asked") >= 1),
	CONSTRAINT "connection_link_sealed" CHECK (("sealed" IS NULL) = ("key_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "connectors"."connection_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."lake_copy" (
	"company_id" text,
	"connector_id" text NOT NULL,
	"connection_id" uuid,
	"interval" text NOT NULL,
	"start_date" date,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "lake_copy_pkey" PRIMARY KEY("company_id","connection_id"),
	CONSTRAINT "lake_copy_interval" CHECK ("interval" IN ('15m', '30m', '1h', '2h', '6h', '24h', 'MANUAL'))
);
--> statement-breakpoint
ALTER TABLE "copies"."lake_copy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."lake_run" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connection_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"outcome" text,
	"whole" boolean NOT NULL,
	"code" text,
	"failed_table" text,
	"system_status" integer,
	"system_code" text,
	"system_message" text,
	"task_arn" text,
	"attempt" integer NOT NULL,
	CONSTRAINT "lake_run_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "lake_run_ended" CHECK (("ended_at" IS NULL) = ("outcome" IS NULL)),
	CONSTRAINT "lake_run_outcome" CHECK ("outcome" IS NULL OR "outcome" IN ('COMPLETE', 'ERROR', 'INTERRUPTED')),
	CONSTRAINT "lake_run_code" CHECK ("code" IS NULL OR ("outcome" = 'ERROR' AND "code" IN ('COPY_SOURCE_NEEDS_REAUTH', 'COPY_SOURCE_REFUSED', 'COPY_SOURCE_UNREACHABLE', 'COPY_SOURCE_UNREADABLE', 'COPY_LAKE_UNAVAILABLE', 'COPY_TASK_LOST', 'COPY_LAKE_WRITE_FAILED'))),
	CONSTRAINT "lake_run_system" CHECK (("system_status" IS NULL AND "system_code" IS NULL AND "system_message" IS NULL AND "failed_table" IS NULL) OR "outcome" = 'ERROR'),
	CONSTRAINT "lake_run_system_code" CHECK (char_length("system_code") <= 64),
	CONSTRAINT "lake_run_system_message" CHECK (char_length("system_message") <= 1000),
	CONSTRAINT "lake_run_task_arn" CHECK ("task_arn" IS NULL OR "task_arn" LIKE 'arn:aws:ecs:%'),
	CONSTRAINT "lake_run_attempt" CHECK ("attempt" >= 1)
);
--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."lake_table" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connection_id" uuid NOT NULL,
	"source_table" text NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"columns" jsonb NOT NULL,
	"rows" bigint,
	"last_run_id" uuid,
	CONSTRAINT "lake_table_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "lake_table_source_key" UNIQUE("company_id","connection_id","source_table"),
	CONSTRAINT "lake_table_source_table" CHECK ("source_table" ~ '^[A-Za-z][A-Za-z0-9_]{0,59}$'),
	CONSTRAINT "lake_table_name" CHECK ("name" ~ '^[a-z][a-z0-9_]{0,59}$'),
	CONSTRAINT "lake_table_columns" CHECK (jsonb_typeof("columns") = 'array')
);
--> statement-breakpoint
ALTER TABLE "copies"."lake_table" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "copies"."lake_table_run" (
	"run_id" uuid,
	"table_id" uuid,
	"company_id" text NOT NULL,
	"read" integer NOT NULL,
	"written" integer NOT NULL,
	"rows" bigint NOT NULL,
	"whole" boolean NOT NULL,
	CONSTRAINT "lake_table_run_pkey" PRIMARY KEY("run_id","table_id"),
	CONSTRAINT "lake_table_run_counts" CHECK ("read" >= 0 AND "written" >= 0 AND "rows" >= 0)
);
--> statement-breakpoint
ALTER TABLE "copies"."lake_table_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "lake_run_open_key" ON "copies"."lake_run" ("connection_id") WHERE "ended_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "lake_table_name_key" ON "copies"."lake_table" ("company_id",lower("name"));--> statement-breakpoint
ALTER TABLE "connectors"."connection_link" ADD CONSTRAINT "connection_link_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."lake_copy" ADD CONSTRAINT "lake_copy_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."lake_copy" ADD CONSTRAINT "lake_copy_connection_fkey" FOREIGN KEY ("company_id","connector_id","connection_id") REFERENCES "connectors"."connection"("company_id","connector_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD CONSTRAINT "lake_run_copy_fkey" FOREIGN KEY ("company_id","connection_id") REFERENCES "copies"."lake_copy"("company_id","connection_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."lake_table" ADD CONSTRAINT "lake_table_copy_fkey" FOREIGN KEY ("company_id","connection_id") REFERENCES "copies"."lake_copy"("company_id","connection_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."lake_table" ADD CONSTRAINT "lake_table_last_run_id_fkey" FOREIGN KEY ("company_id","last_run_id") REFERENCES "copies"."lake_run"("company_id","id") ON DELETE SET NULL ("last_run_id");--> statement-breakpoint
ALTER TABLE "copies"."lake_table_run" ADD CONSTRAINT "lake_table_run_run_fkey" FOREIGN KEY ("company_id","run_id") REFERENCES "copies"."lake_run"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."lake_table_run" ADD CONSTRAINT "lake_table_run_table_fkey" FOREIGN KEY ("company_id","table_id") REFERENCES "copies"."lake_table"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "connectors"."connection_link" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "connection_link_links_select" ON "connectors"."connection_link" AS PERMISSIVE FOR SELECT TO "hub_links" USING (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."lake_copy" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."lake_run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."lake_table" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."lake_table_run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_select" ON "lake"."company_lake" AS PERMISSIVE FOR SELECT TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), ''));