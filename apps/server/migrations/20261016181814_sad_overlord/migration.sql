ALTER TABLE "auth"."invitation" ADD COLUMN "superseded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth"."invitation" ADD COLUMN "replaces" jsonb;