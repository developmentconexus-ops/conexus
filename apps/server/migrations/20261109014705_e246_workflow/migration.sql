CREATE TABLE "builder"."workflow" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"project_id" text,
	"name" text NOT NULL,
	"draft" jsonb,
	"revision" integer DEFAULT 0 NOT NULL,
	"test_draft" jsonb,
	"state" text DEFAULT 'ON' NOT NULL,
	"active_version" integer,
	"active_by" text,
	"created_by" text,
	"body_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "workflow_state_known" CHECK ("state" in ('ON', 'PAUSED', 'PAUSED_OWNER')),
	CONSTRAINT "workflow_revision_not_negative" CHECK ("revision" >= 0),
	CONSTRAINT "workflow_active_by_needs_version" CHECK ("active_version" is not null or "active_by" is null)
);
--> statement-breakpoint
ALTER TABLE "builder"."workflow" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."workflow_version" (
	"workflow_id" uuid,
	"number" integer,
	"company_id" text NOT NULL,
	"frozen" jsonb NOT NULL,
	"source_revision" integer NOT NULL,
	"published_by" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_version_pkey" PRIMARY KEY("workflow_id","number"),
	CONSTRAINT "workflow_version_workflow_id_source_revision_key" UNIQUE("workflow_id","source_revision"),
	CONSTRAINT "workflow_version_company_id_workflow_id_number_key" UNIQUE("company_id","workflow_id","number"),
	CONSTRAINT "workflow_version_number_positive" CHECK ("number" > 0)
);
--> statement-breakpoint
ALTER TABLE "builder"."workflow_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."workflow" ADD CONSTRAINT "workflow_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."workflow" ADD CONSTRAINT "workflow_project_fkey" FOREIGN KEY ("company_id","project_id") REFERENCES "projects"."project"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."workflow" ADD CONSTRAINT "workflow_active_version_fkey" FOREIGN KEY ("company_id","id","active_version") REFERENCES "builder"."workflow_version"("company_id","workflow_id","number");--> statement-breakpoint
ALTER TABLE "builder"."workflow_version" ADD CONSTRAINT "workflow_version_workflow_fkey" FOREIGN KEY ("company_id","workflow_id") REFERENCES "builder"."workflow"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."workflow" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."workflow_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));