CREATE TABLE "builder"."person_model_default" (
	"company_id" text,
	"person_id" text,
	"model" text NOT NULL,
	"effort" text NOT NULL,
	CONSTRAINT "person_model_default_pkey" PRIMARY KEY("company_id","person_id"),
	CONSTRAINT "person_model_default_effort" CHECK ("effort" IN ('off', 'low', 'medium', 'high', 'xhigh', 'max'))
);
--> statement-breakpoint
ALTER TABLE "builder"."person_model_default" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."company_model" ADD COLUMN "effort" text DEFAULT 'off' NOT NULL;--> statement-breakpoint
ALTER TABLE "builder"."person_model_default" ADD CONSTRAINT "person_model_default_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."company_model" ADD CONSTRAINT "company_model_effort" CHECK ("effort" IN ('off', 'low', 'medium', 'high', 'xhigh', 'max'));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."person_model_default" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '') and person_id = nullif(current_setting('conexus.person_id', true), ''));