CREATE SCHEMA "notifications";
--> statement-breakpoint
CREATE TABLE "notifications"."notification" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"kind" text NOT NULL,
	"automation_id" text NOT NULL,
	"automation_name" text NOT NULL,
	"project_id" text,
	"conversation_id" uuid,
	"failure_code" text,
	"run_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "notification_run_key" UNIQUE("company_id","run_id"),
	CONSTRAINT "notification_kind" CHECK ("kind" in ('AUTOMATION_DONE', 'AUTOMATION_FAILED', 'AUTOMATION_PAUSED')),
	CONSTRAINT "notification_done" CHECK ("kind" <> 'AUTOMATION_DONE' or ("conversation_id" is not null and "failure_code" is null)),
	CONSTRAINT "notification_failed" CHECK ("kind" <> 'AUTOMATION_FAILED' or ("failure_code" is not null and "failure_code" in ('MODEL_NO_ACCOUNT', 'MODEL_CALL_FAILED', 'MODEL_REFUSED', 'MODEL_ANSWER_CUT', 'MACHINE_UNAVAILABLE', 'MACHINE_LOST', 'HUB_UPDATED', 'INTERNAL_UNEXPECTED', 'DATABASE_UNAVAILABLE', 'INTERRUPTED', 'SCHEDULE_PUBLISH_FAILED'))),
	CONSTRAINT "notification_paused" CHECK ("kind" <> 'AUTOMATION_PAUSED' or ("conversation_id" is null and "failure_code" is null))
);
--> statement-breakpoint
ALTER TABLE "notifications"."notification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "notification_person_created" ON "notifications"."notification" ("company_id","person_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "notifications"."notification" ADD CONSTRAINT "notification_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications"."notification" ADD CONSTRAINT "notification_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "notifications"."notification" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));