CREATE TABLE "builder"."agent" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"draft" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"active_version" integer,
	"created_by" text,
	"body_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "agent_revision_positive" CHECK ("revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "builder"."agent" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."agent_tool" (
	"agent_id" uuid,
	"tool_id" uuid NOT NULL,
	"tool_version_id" uuid,
	"company_id" text NOT NULL,
	CONSTRAINT "agent_tool_pkey" PRIMARY KEY("agent_id","tool_version_id"),
	CONSTRAINT "agent_tool_agent_id_tool_id_key" UNIQUE("agent_id","tool_id")
);
--> statement-breakpoint
ALTER TABLE "builder"."agent_tool" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."agent_version" (
	"agent_id" uuid,
	"number" integer,
	"company_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"source_revision" integer NOT NULL,
	"message" text NOT NULL,
	"published_by" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_version_pkey" PRIMARY KEY("agent_id","number"),
	CONSTRAINT "agent_version_agent_id_source_revision_key" UNIQUE("agent_id","source_revision"),
	CONSTRAINT "agent_version_company_id_agent_id_number_key" UNIQUE("company_id","agent_id","number"),
	CONSTRAINT "agent_version_number_positive" CHECK ("number" > 0)
);
--> statement-breakpoint
ALTER TABLE "builder"."agent_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."agent_version_tool" (
	"agent_id" uuid,
	"number" integer,
	"tool_version_id" uuid,
	"company_id" text NOT NULL,
	CONSTRAINT "agent_version_tool_pkey" PRIMARY KEY("agent_id","number","tool_version_id")
);
--> statement-breakpoint
ALTER TABLE "builder"."agent_version_tool" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."tool" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"kind" text DEFAULT 'PRESET' NOT NULL,
	"connection_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"slug" text NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"body_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_company_id_slug_key" UNIQUE("company_id","slug"),
	CONSTRAINT "tool_company_id_id_key" UNIQUE("company_id","id"),
	CONSTRAINT "tool_kind" CHECK ("kind" in ('PRESET'))
);
--> statement-breakpoint
ALTER TABLE "builder"."tool" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."tool_version" (
	"id" uuid PRIMARY KEY,
	"tool_id" uuid NOT NULL,
	"company_id" text NOT NULL,
	"number" integer NOT NULL,
	"config" jsonb NOT NULL,
	"created_by" text,
	"body_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_version_tool_id_number_key" UNIQUE("tool_id","number"),
	CONSTRAINT "tool_version_tool_id_id_key" UNIQUE("tool_id","id"),
	CONSTRAINT "tool_version_company_id_id_key" UNIQUE("company_id","id")
);
--> statement-breakpoint
ALTER TABLE "builder"."tool_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."agent" ADD CONSTRAINT "agent_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."agent" ADD CONSTRAINT "agent_project_fkey" FOREIGN KEY ("company_id","project_id") REFERENCES "projects"."project"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."agent_tool" ADD CONSTRAINT "agent_tool_agent_fkey" FOREIGN KEY ("company_id","agent_id") REFERENCES "builder"."agent"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."agent_tool" ADD CONSTRAINT "agent_tool_tool_version_fkey" FOREIGN KEY ("tool_id","tool_version_id") REFERENCES "builder"."tool_version"("tool_id","id");--> statement-breakpoint
ALTER TABLE "builder"."agent_tool" ADD CONSTRAINT "agent_tool_company_tool_version_fkey" FOREIGN KEY ("company_id","tool_version_id") REFERENCES "builder"."tool_version"("company_id","id");--> statement-breakpoint
ALTER TABLE "builder"."agent_version" ADD CONSTRAINT "agent_version_agent_fkey" FOREIGN KEY ("company_id","agent_id") REFERENCES "builder"."agent"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."agent_version_tool" ADD CONSTRAINT "agent_version_tool_agent_version_fkey" FOREIGN KEY ("company_id","agent_id","number") REFERENCES "builder"."agent_version"("company_id","agent_id","number") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."agent_version_tool" ADD CONSTRAINT "agent_version_tool_tool_version_fkey" FOREIGN KEY ("company_id","tool_version_id") REFERENCES "builder"."tool_version"("company_id","id");--> statement-breakpoint
ALTER TABLE "builder"."tool" ADD CONSTRAINT "tool_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."tool_version" ADD CONSTRAINT "tool_version_tool_fkey" FOREIGN KEY ("company_id","tool_id") REFERENCES "builder"."tool"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."agent" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."agent_tool" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."agent_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."agent_version_tool" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."tool" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."tool_version" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));