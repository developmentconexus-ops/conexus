ALTER TABLE "builder"."agent_tool" ADD COLUMN "approval" text;--> statement-breakpoint
ALTER TABLE "builder"."agent_version_tool" ADD COLUMN "approval" text;--> statement-breakpoint
ALTER TABLE "builder"."agent_tool" ADD CONSTRAINT "agent_tool_approval" CHECK ("approval" in ('ASK', 'AUTO'));--> statement-breakpoint
ALTER TABLE "builder"."agent_version_tool" ADD CONSTRAINT "agent_version_tool_approval" CHECK ("approval" in ('ASK', 'AUTO'));