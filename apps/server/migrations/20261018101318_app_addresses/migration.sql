CREATE SCHEMA "apps";
--> statement-breakpoint
CREATE TABLE "apps"."app_session" (
	"token_hash" text PRIMARY KEY,
	"host_label" text NOT NULL,
	"person_id" text NOT NULL,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"hub_session_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apps"."handoff" (
	"code_hash" text PRIMARY KEY,
	"binding_hash" text NOT NULL,
	"host_label" text NOT NULL,
	"person_id" text NOT NULL,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"hub_session_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."company" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "projects"."project" ADD COLUMN "host_label" text;--> statement-breakpoint
ALTER TABLE "auth"."company" ADD CONSTRAINT "company_nickname_key" UNIQUE("nickname");--> statement-breakpoint
ALTER TABLE "projects"."project" ADD CONSTRAINT "project_host_label_key" UNIQUE("host_label");--> statement-breakpoint
ALTER TABLE "apps"."app_session" ADD CONSTRAINT "app_session_hub_session_id_fkey" FOREIGN KEY ("hub_session_id") REFERENCES "auth"."session"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "apps"."handoff" ADD CONSTRAINT "handoff_hub_session_id_fkey" FOREIGN KEY ("hub_session_id") REFERENCES "auth"."session"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth"."company" ADD CONSTRAINT "company_nickname_form" CHECK ("nickname" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("nickname") BETWEEN 3 AND 30);--> statement-breakpoint
ALTER TABLE "projects"."project" ADD CONSTRAINT "project_host_label_form" CHECK ("host_label" ~ '^[a-z0-9]+(-[a-z0-9]+)*--[a-z0-9]+(-[a-z0-9]+)*$' and char_length("host_label") <= 63);--> statement-breakpoint
CREATE POLICY "hosts_select" ON "projects"."project" AS PERMISSIVE FOR SELECT TO "hub_hosts" USING (true);