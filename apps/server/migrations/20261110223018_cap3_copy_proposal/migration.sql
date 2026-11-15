-- contract: copies.copy.model accepts null, a relaxation and not a drop of data: a copy turned on from the
-- Builder's proposal has no template (Capacity 3, U3). Every row of a released version keeps its model
-- and the running code only logs the column (data D6).
CREATE TABLE "copies"."copy_proposal" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"connector_id" text NOT NULL,
	"connection_id" uuid NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"definition" jsonb NOT NULL,
	"proposed_by" text NOT NULL,
	"proved_rows" integer NOT NULL,
	"proved_more" boolean NOT NULL,
	"proposed_at" timestamp with time zone NOT NULL,
	"state" text NOT NULL,
	"copy_id" uuid,
	CONSTRAINT "copy_proposal_name" CHECK ("name" ~ '^[a-z][a-z0-9_]{0,39}$'),
	CONSTRAINT "copy_proposal_definition" CHECK (jsonb_typeof("definition") = 'object'),
	CONSTRAINT "copy_proposal_proved_rows" CHECK ("proved_rows" BETWEEN 0 AND 50),
	CONSTRAINT "copy_proposal_state" CHECK ("state" IN ('OPEN', 'ACCEPTED', 'DISMISSED')),
	CONSTRAINT "copy_proposal_copy" CHECK ("state" = 'ACCEPTED' OR "copy_id" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "copies"."copy" ALTER COLUMN "model" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "copy_proposal_open_name_key" ON "copies"."copy_proposal" ("company_id","name") WHERE "state" = 'OPEN';--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal" ADD CONSTRAINT "copy_proposal_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal" ADD CONSTRAINT "copy_proposal_connection_fkey" FOREIGN KEY ("company_id","connector_id","connection_id") REFERENCES "connectors"."connection"("company_id","connector_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal" ADD CONSTRAINT "copy_proposal_project_fkey" FOREIGN KEY ("company_id","project_id") REFERENCES "projects"."project"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_proposal" ADD CONSTRAINT "copy_proposal_copy_fkey" FOREIGN KEY ("copy_id") REFERENCES "copies"."copy"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy_proposal" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));