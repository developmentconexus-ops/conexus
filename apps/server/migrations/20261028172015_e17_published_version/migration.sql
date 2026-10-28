-- Custom SQL, step 17 (founder, 2026-10-27, "A1 B1 C2 D1"): the app gets a second pointer, the
-- published version, and a pass and a session say whether they came from the Prévia's frame or from
-- a tab. A session from before this step does not say, so every session and pass goes first: the
-- passes live 60 s and a session is made again by the dispatcher's next call, which the Hub
-- answers with APP_SESSION_INVALID. The Projetos that have a version on the air before the step
-- come out with it published, so their saved address does not fall.
DELETE FROM apps.app_session;
--> statement-breakpoint
DELETE FROM apps.handoff;
--> statement-breakpoint
ALTER TABLE "apps"."app" ADD COLUMN "published_version_id" text;--> statement-breakpoint
ALTER TABLE "apps"."app_session" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "apps"."handoff" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "apps"."app" ADD CONSTRAINT "app_published_version_fkey" FOREIGN KEY ("project_id","published_version_id") REFERENCES "apps"."app_version"("project_id","id");--> statement-breakpoint
ALTER TABLE "apps"."app_session" ADD CONSTRAINT "app_session_environment" CHECK ("environment" IN ('preview', 'published'));--> statement-breakpoint
ALTER TABLE "apps"."handoff" ADD CONSTRAINT "handoff_environment" CHECK ("environment" IN ('preview', 'published'));
--> statement-breakpoint
UPDATE apps.app SET published_version_id = live_version_id WHERE live_version_id IS NOT NULL;
