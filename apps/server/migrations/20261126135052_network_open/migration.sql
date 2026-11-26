CREATE TABLE "builder"."company_network_open" (
	"company_id" text PRIMARY KEY,
	"opened_by" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builder"."company_network_open" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."company_network_open" ADD CONSTRAINT "company_network_open_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."company_network_open" ADD CONSTRAINT "company_network_open_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "auth"."user"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."company_network_open" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));