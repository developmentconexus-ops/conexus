CREATE TABLE "connectors"."connection_sign_in" (
	"id" uuid PRIMARY KEY,
	"company_id" text NOT NULL,
	"person_id" text NOT NULL,
	"connector_id" text NOT NULL,
	"connection_id" uuid,
	"name" text,
	"connection_revision" integer,
	"sealed" bytea NOT NULL,
	"key_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "connection_sign_in_target" CHECK (("connection_id" IS NULL) <> ("name" IS NULL)
        AND ("connection_id" IS NULL) = ("connection_revision" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "connectors"."connection_sign_in" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD COLUMN "refresh_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD COLUMN "account_ref" text;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD COLUMN "account_label" text;--> statement-breakpoint
CREATE UNIQUE INDEX "connection_account_key" ON "connectors"."connection" ("connector_id","account_ref") WHERE "account_ref" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "connectors"."connection_sign_in" ADD CONSTRAINT "connection_sign_in_member_fkey" FOREIGN KEY ("company_id","person_id") REFERENCES "auth"."member"("company_id","user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "connectors"."connection_sign_in" ADD CONSTRAINT "connection_sign_in_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "connectors"."connection"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "connectors"."connection" ADD CONSTRAINT "connection_account" CHECK (("account_ref" IS NULL) = ("account_label" IS NULL)
        AND ("account_label" IS NULL OR char_length("account_label") BETWEEN 1 AND 120));--> statement-breakpoint
CREATE POLICY "company_all" ON "connectors"."connection_sign_in" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')
      and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null)) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), '')
      and (person_id = nullif(current_setting('conexus.person_id', true), '') or nullif(current_setting('conexus.person_id', true), '') is null));