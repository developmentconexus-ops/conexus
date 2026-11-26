CREATE TABLE "builder"."company_network_domain" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"domain" text NOT NULL,
	"reason" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_network_domain_company_id_domain_key" UNIQUE("company_id","domain"),
	CONSTRAINT "company_network_domain_reason" CHECK (char_length("reason") BETWEEN 1 AND 200)
);
--> statement-breakpoint
ALTER TABLE "builder"."company_network_domain" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "builder"."conversation_network_domain" (
	"conversation_id" uuid,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"domain" text,
	"reason" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_network_domain_pkey" PRIMARY KEY("conversation_id","domain"),
	CONSTRAINT "conversation_network_domain_reason" CHECK (char_length("reason") BETWEEN 1 AND 200)
);
--> statement-breakpoint
ALTER TABLE "builder"."conversation_network_domain" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "builder"."company_network_domain" ADD CONSTRAINT "company_network_domain_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "builder"."company_network_domain" ADD CONSTRAINT "company_network_domain_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "builder"."conversation_network_domain" ADD CONSTRAINT "conversation_network_domain_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."company_network_domain" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "company_all" ON "builder"."conversation_network_domain" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null)) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '')
  and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null));