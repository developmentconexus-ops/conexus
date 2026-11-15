CREATE TABLE "notifications"."alert_recipient" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications"."alert_recipient" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications"."copy_follower" (
	"company_id" text NOT NULL,
	"copy_id" uuid,
	"person_id" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "copy_follower_pkey" PRIMARY KEY("copy_id","person_id")
);
--> statement-breakpoint
ALTER TABLE "notifications"."copy_follower" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications"."copy_notice" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"copy_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"copy_name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "copy_notice_key" UNIQUE("run_id","person_id"),
	CONSTRAINT "copy_notice_code" CHECK ("code" in ('COPY_SOURCE_REFUSED', 'COPY_SOURCE_NEEDS_REAUTH', 'COPY_SOURCE_UNREACHABLE', 'COPY_SOURCE_UNREADABLE', 'COPY_SOURCE_CEILING', 'COPY_DATABASE_UNAVAILABLE'))
);
--> statement-breakpoint
ALTER TABLE "notifications"."copy_notice" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_recipient_key" ON "notifications"."alert_recipient" ("company_id",lower("email"));--> statement-breakpoint
CREATE INDEX "copy_notice_person_created" ON "notifications"."copy_notice" ("company_id","person_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "notifications"."alert_recipient" ADD CONSTRAINT "alert_recipient_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications"."copy_follower" ADD CONSTRAINT "copy_follower_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications"."copy_follower" ADD CONSTRAINT "copy_follower_copy_fkey" FOREIGN KEY ("company_id","copy_id") REFERENCES "copies"."copy"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications"."copy_notice" ADD CONSTRAINT "copy_notice_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications"."copy_notice" ADD CONSTRAINT "copy_notice_copy_fkey" FOREIGN KEY ("company_id","copy_id") REFERENCES "copies"."copy"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "notifications"."alert_recipient" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_select" ON "notifications"."copy_follower" AS PERMISSIVE FOR SELECT TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_insert" ON "notifications"."copy_follower" AS PERMISSIVE FOR INSERT TO "hub_company" WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_delete" ON "notifications"."copy_follower" AS PERMISSIVE FOR DELETE TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_select" ON "notifications"."copy_notice" AS PERMISSIVE FOR SELECT TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_update" ON "notifications"."copy_notice" AS PERMISSIVE FOR UPDATE TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_insert" ON "notifications"."copy_notice" AS PERMISSIVE FOR INSERT TO "hub_company" WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));