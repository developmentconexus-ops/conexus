-- contract: no code reads the nine tables of the `copies` schema or `notifications.copy_follower` and `copy_notice` since v0.24.119 (G0b, U14); an image before it names them in its reads, so none of them runs on the migrated database
DROP POLICY "company_all" ON "copies"."copy_reader_turn";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."copy";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."copy_proposal";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."copy_proposal_source";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."copy_reader";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."copy_run";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."copy_source";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."copy_table_left";--> statement-breakpoint
DROP POLICY "company_all" ON "copies"."project_copy";--> statement-breakpoint
DROP POLICY "company_select" ON "notifications"."copy_follower";--> statement-breakpoint
DROP POLICY "company_insert" ON "notifications"."copy_follower";--> statement-breakpoint
DROP POLICY "company_delete" ON "notifications"."copy_follower";--> statement-breakpoint
DROP POLICY "company_select" ON "notifications"."copy_notice";--> statement-breakpoint
DROP POLICY "company_update" ON "notifications"."copy_notice";--> statement-breakpoint
DROP POLICY "company_insert" ON "notifications"."copy_notice";--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal" DROP CONSTRAINT "copy_proposal_copy_fkey";--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal_source" DROP CONSTRAINT "copy_proposal_source_proposal_fkey";--> statement-breakpoint
ALTER TABLE "copies"."copy_reader" DROP CONSTRAINT "copy_reader_copy_fkey";--> statement-breakpoint
ALTER TABLE "copies"."copy_run" DROP CONSTRAINT "copy_run_copy_fkey";--> statement-breakpoint
ALTER TABLE "copies"."copy_source" DROP CONSTRAINT "copy_source_copy_fkey";--> statement-breakpoint
ALTER TABLE "copies"."project_copy" DROP CONSTRAINT "project_copy_copy_fkey";--> statement-breakpoint
ALTER TABLE "notifications"."copy_follower" DROP CONSTRAINT "copy_follower_copy_fkey";--> statement-breakpoint
ALTER TABLE "notifications"."copy_notice" DROP CONSTRAINT "copy_notice_copy_fkey";--> statement-breakpoint
DROP TABLE "copies"."copy_reader_turn";--> statement-breakpoint
DROP TABLE "copies"."copy";--> statement-breakpoint
DROP TABLE "copies"."copy_proposal";--> statement-breakpoint
DROP TABLE "copies"."copy_proposal_source";--> statement-breakpoint
DROP TABLE "copies"."copy_reader";--> statement-breakpoint
DROP TABLE "copies"."copy_run";--> statement-breakpoint
DROP TABLE "copies"."copy_source";--> statement-breakpoint
DROP TABLE "copies"."copy_table_left";--> statement-breakpoint
DROP TABLE "copies"."project_copy";--> statement-breakpoint
DROP TABLE "notifications"."copy_follower";--> statement-breakpoint
DROP TABLE "notifications"."copy_notice";--> statement-breakpoint
DROP SCHEMA "copies";
