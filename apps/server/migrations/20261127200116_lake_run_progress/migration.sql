ALTER TABLE "copies"."lake_run" ADD COLUMN "progress" jsonb;--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD COLUMN "progress_seq" integer;--> statement-breakpoint
ALTER TABLE "copies"."lake_table_run" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "copies"."lake_table_run" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD CONSTRAINT "lake_run_progress" CHECK ((("progress" IS NULL) = ("progress_seq" IS NULL)) AND ("progress" IS NULL OR "ended_at" IS NULL));--> statement-breakpoint
ALTER TABLE "copies"."lake_table_run" ADD CONSTRAINT "lake_table_run_times" CHECK ("ended_at" IS NULL OR "started_at" IS NULL OR "ended_at" >= "started_at");