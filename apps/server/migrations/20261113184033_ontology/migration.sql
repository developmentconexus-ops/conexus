CREATE SCHEMA "ontology";
--> statement-breakpoint
CREATE TABLE "ontology"."inventory_end" (
	"run_id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"outcome" text NOT NULL,
	"reason" text,
	"pages" integer NOT NULL,
	CONSTRAINT "inventory_end_outcome" CHECK ("outcome" IN ('COMPLETE', 'PARTIAL', 'FAILED', 'INTERRUPTED')),
	CONSTRAINT "inventory_end_reason" CHECK ("reason" IS NULL OR "reason" IN ('CAP', 'REFUSED', 'AUTH_REFUSED', 'UNREADABLE', 'BUSY', 'UNREACHABLE', 'DEADLINE', 'NOT_IN_ROLE')),
	CONSTRAINT "inventory_end_reason_outcome" CHECK (("reason" IS NULL) = ("outcome" IN ('COMPLETE', 'INTERRUPTED'))),
	CONSTRAINT "inventory_end_pages" CHECK ("pages" >= 0)
);
--> statement-breakpoint
ALTER TABLE "ontology"."inventory_end" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."inventory_entry" (
	"run_id" uuid,
	"company_id" text NOT NULL,
	"kind" text,
	"name" text,
	"type" text,
	"label" text,
	"custom" boolean NOT NULL,
	CONSTRAINT "inventory_entry_pkey" PRIMARY KEY("run_id","kind","name"),
	CONSTRAINT "inventory_entry_kind" CHECK ("kind" IN ('TABLE', 'FIELD', 'CODE', 'OPERATION')),
	CONSTRAINT "inventory_entry_name" CHECK (char_length("name") BETWEEN 1 AND 200),
	CONSTRAINT "inventory_entry_type" CHECK (char_length("type") <= 20),
	CONSTRAINT "inventory_entry_label" CHECK (char_length("label") <= 200)
);
--> statement-breakpoint
ALTER TABLE "ontology"."inventory_entry" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."inventory_run" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connection_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "inventory_run_company_id_id_key" UNIQUE("company_id","id")
);
--> statement-breakpoint
ALTER TABLE "ontology"."inventory_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."proof_run" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connection_id" uuid NOT NULL,
	"query" text NOT NULL,
	"query_hash" text NOT NULL,
	"ran_at" timestamp with time zone NOT NULL,
	"outcome" text NOT NULL,
	"reason" text,
	"rows" bigint NOT NULL,
	"shape" jsonb NOT NULL,
	"outside_base" bigint,
	CONSTRAINT "proof_run_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "proof_run_query" CHECK (char_length("query") BETWEEN 1 AND 4000),
	CONSTRAINT "proof_run_query_hash" CHECK ("query_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "proof_run_outcome" CHECK ("outcome" IN ('OK', 'FAILED')),
	CONSTRAINT "proof_run_reason" CHECK (("outcome" = 'OK') = ("reason" IS NULL)),
	CONSTRAINT "proof_run_rows" CHECK ("rows" >= 0),
	CONSTRAINT "proof_run_shape" CHECK (jsonb_typeof("shape") = 'array'),
	CONSTRAINT "proof_run_outside_base" CHECK ("outside_base" IS NULL OR "outside_base" >= 0)
);
--> statement-breakpoint
ALTER TABLE "ontology"."proof_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."proposal" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"demand" text NOT NULL,
	"proposed_by" text NOT NULL,
	"agent" text,
	"conversation_id" text,
	"base_revision" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"state" text NOT NULL,
	"attempt_key" text,
	"body_hash" text,
	CONSTRAINT "proposal_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "proposal_company_id_attempt_key_key" UNIQUE("company_id","attempt_key"),
	CONSTRAINT "proposal_demand" CHECK (char_length("demand") BETWEEN 1 AND 500),
	CONSTRAINT "proposal_agent" CHECK ("agent" IS NULL OR "agent" IN ('builder', 'assistant')),
	CONSTRAINT "proposal_base_revision" CHECK ("base_revision" >= 0),
	CONSTRAINT "proposal_state" CHECK ("state" IN ('OPEN', 'CLOSED')),
	CONSTRAINT "proposal_attempt" CHECK (("attempt_key" IS NULL) = ("body_hash" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "ontology"."proposal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."proposal_item" (
	"proposal_id" uuid,
	"company_id" text NOT NULL,
	"n" integer,
	"kind" text NOT NULL,
	"target" text NOT NULL,
	"content" jsonb NOT NULL,
	"proof_run_id" uuid,
	"decision" text NOT NULL,
	"reason" text,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	CONSTRAINT "proposal_item_pkey" PRIMARY KEY("proposal_id","n"),
	CONSTRAINT "proposal_item_n" CHECK ("n" >= 1),
	CONSTRAINT "proposal_item_kind" CHECK ("kind" IN ('ADD_CONCEPT', 'ADD_FIELD', 'SET_CODE', 'ADD_RELATION', 'SET_SOURCE', 'RENAME_LABEL', 'DEPRECATE', 'NOTE')),
	CONSTRAINT "proposal_item_target" CHECK (char_length("target") BETWEEN 1 AND 130),
	CONSTRAINT "proposal_item_content" CHECK (jsonb_typeof("content") = 'object'),
	CONSTRAINT "proposal_item_decision" CHECK ("decision" IN ('PENDING', 'APPROVED', 'REFUSED')),
	CONSTRAINT "proposal_item_reason" CHECK (char_length("reason") <= 500),
	CONSTRAINT "proposal_item_decided" CHECK (("decision" = 'PENDING') = ("decided_at" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "ontology"."proposal_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."revision" (
	"company_id" text,
	"number" integer,
	"proposal_id" uuid NOT NULL,
	"proposed_by" text NOT NULL,
	"approved_by" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"hash" text NOT NULL,
	CONSTRAINT "revision_pkey" PRIMARY KEY("company_id","number"),
	CONSTRAINT "revision_number" CHECK ("number" >= 1),
	CONSTRAINT "revision_hash" CHECK ("hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "ontology"."revision" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."code_version" (
	"company_id" text,
	"concept" text,
	"field" text,
	"value" text,
	"revision" integer,
	"label" text NOT NULL,
	"description" text,
	"origin" text NOT NULL,
	"state" text NOT NULL,
	CONSTRAINT "code_version_pkey" PRIMARY KEY("company_id","concept","field","value","revision"),
	CONSTRAINT "code_version_concept" CHECK ("concept" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "code_version_field" CHECK ("field" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "code_version_value" CHECK (char_length("value") BETWEEN 1 AND 40),
	CONSTRAINT "code_version_label" CHECK (char_length("label") BETWEEN 1 AND 80),
	CONSTRAINT "code_version_description" CHECK (char_length("description") <= 200),
	CONSTRAINT "code_version_origin" CHECK ("origin" IN ('DICTIONARY', 'PERSON')),
	CONSTRAINT "code_version_state" CHECK ("state" IN ('ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
ALTER TABLE "ontology"."code_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."concept_version" (
	"company_id" text,
	"key" text,
	"revision" integer,
	"name" text NOT NULL,
	"plural" text NOT NULL,
	"description" text NOT NULL,
	"synonyms" text[] NOT NULL,
	"title_field" text NOT NULL,
	"key_fields" text[] NOT NULL,
	"base" text,
	"state" text NOT NULL,
	"replaced_by" text,
	CONSTRAINT "concept_version_pkey" PRIMARY KEY("company_id","key","revision"),
	CONSTRAINT "concept_version_key" CHECK ("key" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "concept_version_name" CHECK (char_length("name") BETWEEN 1 AND 80),
	CONSTRAINT "concept_version_plural" CHECK (char_length("plural") BETWEEN 1 AND 80),
	CONSTRAINT "concept_version_description" CHECK (char_length("description") <= 500),
	CONSTRAINT "concept_version_key_fields" CHECK (cardinality("key_fields") BETWEEN 1 AND 4),
	CONSTRAINT "concept_version_base" CHECK ("base" IS NULL OR "base" <> "key"),
	CONSTRAINT "concept_version_state" CHECK ("state" IN ('EXPERIMENTAL', 'ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
ALTER TABLE "ontology"."concept_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."field_version" (
	"company_id" text,
	"concept" text,
	"key" text,
	"revision" integer,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"currency" text,
	"unit" text,
	"column_name" text NOT NULL,
	"state" text NOT NULL,
	CONSTRAINT "field_version_pkey" PRIMARY KEY("company_id","concept","key","revision"),
	CONSTRAINT "field_version_concept" CHECK ("concept" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "field_version_key" CHECK ("key" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "field_version_name" CHECK (char_length("name") BETWEEN 1 AND 80),
	CONSTRAINT "field_version_description" CHECK (char_length("description") <= 200),
	CONSTRAINT "field_version_type" CHECK ("type" IN ('ID', 'TEXT', 'INTEGER', 'DECIMAL', 'MONEY', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'CODE')),
	CONSTRAINT "field_version_currency" CHECK ("currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "field_version_money" CHECK (("type" = 'MONEY') = ("currency" IS NOT NULL)),
	CONSTRAINT "field_version_unit" CHECK (char_length("unit") <= 12),
	CONSTRAINT "field_version_column" CHECK (char_length("column_name") BETWEEN 1 AND 128),
	CONSTRAINT "field_version_state" CHECK ("state" IN ('EXPERIMENTAL', 'ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
ALTER TABLE "ontology"."field_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."relation_version" (
	"company_id" text,
	"key" text,
	"revision" integer,
	"from_concept" text NOT NULL,
	"to_concept" text NOT NULL,
	"cardinality" text NOT NULL,
	"pairs" jsonb NOT NULL,
	"from_name" text NOT NULL,
	"to_name" text NOT NULL,
	"through" text,
	"through_pairs" jsonb,
	"state" text NOT NULL,
	CONSTRAINT "relation_version_pkey" PRIMARY KEY("company_id","key","revision"),
	CONSTRAINT "relation_version_key" CHECK ("key" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "relation_version_from" CHECK ("from_concept" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "relation_version_to" CHECK ("to_concept" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "relation_version_cardinality" CHECK ("cardinality" IN ('MANY_TO_ONE', 'ONE_TO_ONE', 'MANY_TO_MANY')),
	CONSTRAINT "relation_version_pairs" CHECK (jsonb_typeof("pairs") = 'array'),
	CONSTRAINT "relation_version_through_pairs" CHECK ("through_pairs" IS NULL OR jsonb_typeof("through_pairs") = 'array'),
	CONSTRAINT "relation_version_names" CHECK (char_length("from_name") BETWEEN 1 AND 80 AND char_length("to_name") BETWEEN 1 AND 80),
	CONSTRAINT "relation_version_through" CHECK (("cardinality" = 'MANY_TO_MANY') = ("through" IS NOT NULL)),
	CONSTRAINT "relation_version_through_both" CHECK (("through" IS NULL) = ("through_pairs" IS NULL)),
	CONSTRAINT "relation_version_state" CHECK ("state" IN ('EXPERIMENTAL', 'ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
ALTER TABLE "ontology"."relation_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ontology"."source_version" (
	"company_id" text,
	"concept" text,
	"revision" integer,
	"connection_id" uuid NOT NULL,
	"read" jsonb NOT NULL,
	"proof_run_id" uuid NOT NULL,
	CONSTRAINT "source_version_pkey" PRIMARY KEY("company_id","concept","revision"),
	CONSTRAINT "source_version_concept" CHECK ("concept" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "source_version_read" CHECK (jsonb_typeof("read") = 'object')
);
--> statement-breakpoint
ALTER TABLE "ontology"."source_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "inventory_run_connection_started_idx" ON "ontology"."inventory_run" ("company_id","connection_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "proof_run_query_idx" ON "ontology"."proof_run" ("company_id","connection_id","query_hash","ran_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_open_conversation_key" ON "ontology"."proposal" ("company_id","conversation_id") WHERE "state" = 'OPEN' AND "conversation_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "ontology"."inventory_end" ADD CONSTRAINT "inventory_end_run_fkey" FOREIGN KEY ("company_id","run_id") REFERENCES "ontology"."inventory_run"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."inventory_entry" ADD CONSTRAINT "inventory_entry_run_fkey" FOREIGN KEY ("company_id","run_id") REFERENCES "ontology"."inventory_run"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."inventory_run" ADD CONSTRAINT "inventory_run_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."proof_run" ADD CONSTRAINT "proof_run_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."proposal" ADD CONSTRAINT "proposal_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."proposal_item" ADD CONSTRAINT "proposal_item_proposal_fkey" FOREIGN KEY ("company_id","proposal_id") REFERENCES "ontology"."proposal"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."proposal_item" ADD CONSTRAINT "proposal_item_proof_fkey" FOREIGN KEY ("company_id","proof_run_id") REFERENCES "ontology"."proof_run"("company_id","id");--> statement-breakpoint
ALTER TABLE "ontology"."revision" ADD CONSTRAINT "revision_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."revision" ADD CONSTRAINT "revision_proposal_fkey" FOREIGN KEY ("company_id","proposal_id") REFERENCES "ontology"."proposal"("company_id","id");--> statement-breakpoint
ALTER TABLE "ontology"."code_version" ADD CONSTRAINT "code_version_revision_fkey" FOREIGN KEY ("company_id","revision") REFERENCES "ontology"."revision"("company_id","number") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."concept_version" ADD CONSTRAINT "concept_version_revision_fkey" FOREIGN KEY ("company_id","revision") REFERENCES "ontology"."revision"("company_id","number") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."field_version" ADD CONSTRAINT "field_version_revision_fkey" FOREIGN KEY ("company_id","revision") REFERENCES "ontology"."revision"("company_id","number") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."relation_version" ADD CONSTRAINT "relation_version_revision_fkey" FOREIGN KEY ("company_id","revision") REFERENCES "ontology"."revision"("company_id","number") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."source_version" ADD CONSTRAINT "source_version_revision_fkey" FOREIGN KEY ("company_id","revision") REFERENCES "ontology"."revision"("company_id","number") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ontology"."source_version" ADD CONSTRAINT "source_version_proof_fkey" FOREIGN KEY ("company_id","proof_run_id") REFERENCES "ontology"."proof_run"("company_id","id");--> statement-breakpoint
CREATE VIEW "ontology"."code" WITH (security_invoker = true) AS (select distinct on ("ontology"."code_version"."company_id", "ontology"."code_version"."concept", "ontology"."code_version"."field", "ontology"."code_version"."value") "company_id", "concept", "field", "value", "revision", "label", "description", "origin", "state" from "ontology"."code_version" order by "ontology"."code_version"."company_id", "ontology"."code_version"."concept", "ontology"."code_version"."field", "ontology"."code_version"."value", "ontology"."code_version"."revision" desc);--> statement-breakpoint
CREATE VIEW "ontology"."concept" WITH (security_invoker = true) AS (select distinct on ("ontology"."concept_version"."company_id", "ontology"."concept_version"."key") "company_id", "key", "revision", "name", "plural", "description", "synonyms", "title_field", "key_fields", "base", "state", "replaced_by" from "ontology"."concept_version" order by "ontology"."concept_version"."company_id", "ontology"."concept_version"."key", "ontology"."concept_version"."revision" desc);--> statement-breakpoint
CREATE VIEW "ontology"."field" WITH (security_invoker = true) AS (select distinct on ("ontology"."field_version"."company_id", "ontology"."field_version"."concept", "ontology"."field_version"."key") "company_id", "concept", "key", "revision", "name", "description", "type", "currency", "unit", "column_name", "state" from "ontology"."field_version" order by "ontology"."field_version"."company_id", "ontology"."field_version"."concept", "ontology"."field_version"."key", "ontology"."field_version"."revision" desc);--> statement-breakpoint
CREATE VIEW "ontology"."relation" WITH (security_invoker = true) AS (select distinct on ("ontology"."relation_version"."company_id", "ontology"."relation_version"."key") "company_id", "key", "revision", "from_concept", "to_concept", "cardinality", "pairs", "from_name", "to_name", "through", "through_pairs", "state" from "ontology"."relation_version" order by "ontology"."relation_version"."company_id", "ontology"."relation_version"."key", "ontology"."relation_version"."revision" desc);--> statement-breakpoint
CREATE VIEW "ontology"."source" WITH (security_invoker = true) AS (select distinct on ("ontology"."source_version"."company_id", "ontology"."source_version"."concept") "company_id", "concept", "revision", "connection_id", "read", "proof_run_id" from "ontology"."source_version" order by "ontology"."source_version"."company_id", "ontology"."source_version"."concept", "ontology"."source_version"."revision" desc);--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."inventory_end" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."inventory_entry" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."inventory_run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."proof_run" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."proposal" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."proposal_item" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."revision" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."code_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."concept_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."field_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."relation_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "ontology"."source_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));