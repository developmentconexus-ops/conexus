ALTER TABLE "copies"."lake_run" ADD COLUMN "cpu_allocated" numeric(5,2);--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD COLUMN "memory_allocated_mib" integer;--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD COLUMN "cpu_peak" numeric(5,2);--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD COLUMN "memory_peak_mib" integer;--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD COLUMN "machine_samples" jsonb;--> statement-breakpoint
ALTER TABLE "copies"."lake_run" ADD CONSTRAINT "lake_run_machine" CHECK (("cpu_allocated" IS NULL AND "memory_allocated_mib" IS NULL AND "cpu_peak" IS NULL AND "memory_peak_mib" IS NULL AND "machine_samples" IS NULL) OR ("cpu_allocated" IS NOT NULL AND "memory_allocated_mib" IS NOT NULL AND "cpu_peak" >= 0 AND "memory_peak_mib" >= 0 AND "machine_samples" IS NOT NULL AND "ended_at" IS NOT NULL));