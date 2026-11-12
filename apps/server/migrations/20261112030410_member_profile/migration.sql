ALTER TABLE "auth"."member" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "auth"."member" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "auth"."member" ADD CONSTRAINT "member_job_title_length" CHECK (char_length("job_title") <= 80);--> statement-breakpoint
ALTER TABLE "auth"."member" ADD CONSTRAINT "member_department_length" CHECK (char_length("department") <= 80);