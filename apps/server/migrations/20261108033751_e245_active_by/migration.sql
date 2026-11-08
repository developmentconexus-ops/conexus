ALTER TABLE "builder"."agent" ADD COLUMN "active_by" text;--> statement-breakpoint
-- Each existing agent keeps answering as before: its active version's publisher (step 24.5, D2-a).
UPDATE "builder"."agent" SET "active_by" = "agent_version"."published_by" FROM "builder"."agent_version" WHERE "agent_version"."agent_id" = "agent"."id" AND "agent_version"."number" = "agent"."active_version";
