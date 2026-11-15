-- contract: a column with a default and a CHECK true for the default, so every row and every insert the previous image makes still passes (data D6).
ALTER TABLE "copies"."copy" ADD COLUMN "column_state" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "copies"."copy" ADD CONSTRAINT "copy_column_state" CHECK (jsonb_typeof("column_state") = 'object');