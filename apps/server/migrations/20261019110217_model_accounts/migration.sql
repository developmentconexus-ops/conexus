CREATE SCHEMA "builder";
--> statement-breakpoint
CREATE TABLE "builder"."company_account_kind" (
	"company_id" text,
	"kind" text,
	CONSTRAINT "company_account_kind_pkey" PRIMARY KEY("company_id","kind"),
	CONSTRAINT "company_account_kind_kind" CHECK ("kind" IN ('claude_subscription', 'google_cliproxy'))
);
--> statement-breakpoint
ALTER TABLE "builder"."company_account_kind" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."company_model" (
	"company_id" text PRIMARY KEY,
	"model" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builder"."company_model" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."model_account" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"person_id" text,
	"kind" text NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	"state" text NOT NULL,
	"sealed" bytea NOT NULL,
	"key_id" text NOT NULL,
	"hint" text,
	"linked_by" text NOT NULL,
	"linked_at" timestamp with time zone NOT NULL,
	"revision" integer NOT NULL,
	"attempt_key" text NOT NULL,
	CONSTRAINT "model_account_attempt_key" UNIQUE("company_id","attempt_key"),
	CONSTRAINT "model_account_kind" CHECK ("kind" IN ('api_key', 'claude_subscription', 'google_cliproxy')),
	CONSTRAINT "model_account_state" CHECK ("state" IN ('ready', 'paused', 'refused')),
	CONSTRAINT "model_account_label_length" CHECK (char_length("label") BETWEEN 1 AND 60),
	CONSTRAINT "model_account_position" CHECK ("position" >= 0),
	CONSTRAINT "model_account_hint" CHECK (("kind" = 'api_key') = ("hint" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "builder"."model_account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."model_account_assignee" (
	"account_id" uuid,
	"company_id" text NOT NULL,
	"person_id" text,
	CONSTRAINT "model_account_assignee_pkey" PRIMARY KEY("account_id","person_id")
);
--> statement-breakpoint
ALTER TABLE "builder"."model_account_assignee" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."model_account_sign_in" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"owner" text NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"sealed" bytea NOT NULL,
	"key_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "model_account_sign_in_owner" CHECK ("owner" IN ('company', 'me')),
	CONSTRAINT "model_account_sign_in_kind" CHECK ("kind" IN ('claude_subscription', 'google_cliproxy')),
	CONSTRAINT "model_account_sign_in_label_length" CHECK (char_length("label") BETWEEN 1 AND 60)
);
--> statement-breakpoint
ALTER TABLE "builder"."model_account_sign_in" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."company_account_kind" ADD CONSTRAINT "company_account_kind_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."company_model" ADD CONSTRAINT "company_model_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."model_account" ADD CONSTRAINT "model_account_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."model_account" ADD CONSTRAINT "model_account_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."model_account_assignee" ADD CONSTRAINT "model_account_assignee_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "builder"."model_account"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."model_account_assignee" ADD CONSTRAINT "model_account_assignee_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."model_account_sign_in" ADD CONSTRAINT "model_account_sign_in_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_select" ON "builder"."company_account_kind" AS PERMISSIVE FOR SELECT TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_select" ON "builder"."company_account_kind" AS PERMISSIVE FOR SELECT TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_insert" ON "builder"."company_account_kind" AS PERMISSIVE FOR INSERT TO "hub_operator" WITH CHECK (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "operator_delete" ON "builder"."company_account_kind" AS PERMISSIVE FOR DELETE TO "hub_operator" USING (auth.is_installation_administrator(nullif(current_setting('conexus.person_id', true), '')) and company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."company_model" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."model_account" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id is null or person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null)) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id is null or person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null));--> statement-breakpoint
CREATE POLICY "model_seals_select" ON "builder"."model_account" AS PERMISSIVE FOR SELECT TO "hub_model_seals" USING (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."model_account_assignee" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."model_account_sign_in" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')
      and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null)) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '')
      and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null));--> statement-breakpoint
CREATE POLICY "model_seals_select" ON "builder"."model_account_sign_in" AS PERMISSIVE FOR SELECT TO "hub_model_seals" USING (true);