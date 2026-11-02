CREATE TABLE "builder"."assistant_conversation" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"project_id" text,
	"connections" uuid[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builder"."assistant_conversation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."assistant_conversation" ADD CONSTRAINT "assistant_conversation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."assistant_conversation" ADD CONSTRAINT "assistant_conversation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."assistant_conversation" ADD CONSTRAINT "assistant_conversation_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."assistant_conversation" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null)) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null));