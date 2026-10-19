CREATE TABLE "builder"."conversation" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"project_id" text NOT NULL,
	"person_id" text NOT NULL,
	"attempt_key" text NOT NULL,
	"body_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "conversation_attempt_key" UNIQUE("company_id","person_id","attempt_key")
);
--> statement-breakpoint
ALTER TABLE "builder"."conversation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."conversation_turn" (
	"conversation_id" uuid,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"idempotency_key" text,
	"body_hash" text NOT NULL,
	CONSTRAINT "conversation_turn_pkey" PRIMARY KEY("conversation_id","idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "builder"."conversation_turn" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."company_model_fallback" (
	"company_id" text PRIMARY KEY,
	"enabled" boolean NOT NULL,
	"chain" text[] NOT NULL,
	"revision" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builder"."company_model_fallback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."model_account" ADD COLUMN "limited_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "builder"."model_account" ADD COLUMN "refresh_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "builder"."conversation" ADD CONSTRAINT "conversation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."conversation" ADD CONSTRAINT "conversation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."conversation" ADD CONSTRAINT "conversation_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."conversation_turn" ADD CONSTRAINT "conversation_turn_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "builder"."conversation"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."company_model_fallback" ADD CONSTRAINT "company_model_fallback_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."conversation" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null)) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."conversation_turn" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null)) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."company_model_fallback" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));