CREATE TABLE "builder"."observational_memory_models" (
	"company_id" text PRIMARY KEY,
	"observer" text,
	"reflector" text
);
--> statement-breakpoint
ALTER TABLE "builder"."observational_memory_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."observational_memory_models" ADD CONSTRAINT "observational_memory_models_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."observational_memory_models" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));
