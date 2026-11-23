-- contract: the host says the environment since v0.24.110 (A Prévia em endereço próprio) and no code reads the column; images before this release name it in whole-row reads, so none of them runs on the migrated database
ALTER TABLE "apps"."app_session" DROP CONSTRAINT "app_session_environment";--> statement-breakpoint
ALTER TABLE "apps"."handoff" DROP CONSTRAINT "handoff_environment";--> statement-breakpoint
ALTER TABLE "apps"."app_session" DROP COLUMN "environment";--> statement-breakpoint
ALTER TABLE "apps"."handoff" DROP COLUMN "environment";