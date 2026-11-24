CREATE TABLE "apps"."check_session" (
	"token_hash" text PRIMARY KEY,
	"host_label" text NOT NULL,
	"person_id" text NOT NULL,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apps"."check_session" ADD CONSTRAINT "check_session_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;