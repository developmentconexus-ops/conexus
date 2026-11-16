CREATE TABLE "copies"."copy_reader_turn" (
	"role_id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"turn" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "copies"."copy_reader_turn" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "copies"."copy_reader_turn" ADD CONSTRAINT "copy_reader_turn_role_id_organization_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."organization_role"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy_reader_turn" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));