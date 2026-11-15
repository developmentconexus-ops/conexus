CREATE TABLE "copies"."copy_reader" (
	"company_id" text NOT NULL,
	"copy_id" uuid,
	"role_id" text,
	"granted_by" text NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "copy_reader_pkey" PRIMARY KEY("copy_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "copies"."copy_reader" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "copies"."copy" ADD COLUMN "readers_set" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "copy_reader_role_idx" ON "copies"."copy_reader" ("role_id");--> statement-breakpoint
ALTER TABLE "copies"."copy_reader" ADD CONSTRAINT "copy_reader_copy_fkey" FOREIGN KEY ("company_id","copy_id") REFERENCES "copies"."copy"("company_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "copies"."copy_reader" ADD CONSTRAINT "copy_reader_role_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."organization_role"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "company_all" ON "copies"."copy_reader" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));