ALTER TABLE "copies"."lake_copy" ADD COLUMN "full_pass" text DEFAULT 'OFF' NOT NULL;--> statement-breakpoint
ALTER TABLE "copies"."lake_table" ADD COLUMN "full_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "copies"."lake_copy" ADD CONSTRAINT "lake_copy_full_pass" CHECK ("full_pass" IN ('WEEKLY', 'DAILY', 'OFF'));