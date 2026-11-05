CREATE SCHEMA "requests";
--> statement-breakpoint
CREATE TABLE "notifications"."request_notice" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"request_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "request_notice_key" UNIQUE("request_id","person_id","kind"),
	CONSTRAINT "request_notice_kind" CHECK ("kind" in ('REQUEST_OPENED', 'REQUEST_DECIDED'))
);
--> statement-breakpoint
ALTER TABLE "notifications"."request_notice" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "requests"."request" (
	"id" uuid PRIMARY KEY,
	"attempt_key" text NOT NULL,
	"company_id" text NOT NULL,
	"requested_by" text NOT NULL,
	"project_id" text NOT NULL,
	"kind" text NOT NULL,
	"number" integer NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"state" text NOT NULL,
	"decided_by" text,
	"reason" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "request_attempt_key" UNIQUE("company_id","attempt_key"),
	CONSTRAINT "request_kind" CHECK ("kind" in ('PUBLISH_APP_VERSION')),
	CONSTRAINT "request_number" CHECK ("number" > 0),
	CONSTRAINT "request_message" CHECK (char_length("message") <= 280),
	CONSTRAINT "request_state" CHECK ("state" in ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED', 'SUPERSEDED')),
	CONSTRAINT "request_decided" CHECK (("state" in ('PENDING', 'CANCELLED')) = ("decided_by" is null)),
	CONSTRAINT "request_reason" CHECK ("reason" is null or "state" = 'DECLINED')
);
--> statement-breakpoint
ALTER TABLE "requests"."request" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "request_notice_person_created" ON "notifications"."request_notice" ("company_id","person_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "request_open_key" ON "requests"."request" ("company_id","project_id") WHERE "state" = 'PENDING';--> statement-breakpoint
ALTER TABLE "notifications"."request_notice" ADD CONSTRAINT "request_notice_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications"."request_notice" ADD CONSTRAINT "request_notice_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"."request"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requests"."request" ADD CONSTRAINT "request_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requests"."request" ADD CONSTRAINT "request_member_fkey" FOREIGN KEY ("company_id","requested_by") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requests"."request" ADD CONSTRAINT "request_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_select" ON "notifications"."request_notice" AS PERMISSIVE FOR SELECT TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_update" ON "notifications"."request_notice" AS PERMISSIVE FOR UPDATE TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_insert" ON "notifications"."request_notice" AS PERMISSIVE FOR INSERT TO "hub_company" WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "requests"."request" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));