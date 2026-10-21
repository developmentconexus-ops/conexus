ALTER TABLE "builder"."model_account" ADD COLUMN "served_models" text[];--> statement-breakpoint
ALTER TABLE "builder"."model_account" ADD COLUMN "served_at" timestamp with time zone;