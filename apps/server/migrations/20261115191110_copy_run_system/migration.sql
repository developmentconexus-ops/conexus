ALTER TABLE "copies"."copy_run" ADD COLUMN "whole" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "copies"."copy_run" ADD COLUMN "system_status" integer;--> statement-breakpoint
ALTER TABLE "copies"."copy_run" ADD COLUMN "system_code" text;--> statement-breakpoint
ALTER TABLE "copies"."copy_run" ADD COLUMN "system_message" text;--> statement-breakpoint
ALTER TABLE "copies"."copy_run" ADD CONSTRAINT "copy_run_system" CHECK (("system_status" IS NULL AND "system_code" IS NULL AND "system_message" IS NULL) OR "outcome" = 'ERROR');--> statement-breakpoint
ALTER TABLE "copies"."copy_run" ADD CONSTRAINT "copy_run_system_message" CHECK (char_length("system_message") <= 1000);