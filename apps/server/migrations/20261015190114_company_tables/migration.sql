CREATE TABLE "auth"."company" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"metadata" text,
	"created_at" timestamp with time zone NOT NULL,
	"attempt_key" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "auth"."invitation" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"inviter_id" text NOT NULL,
	"attempt_key" text NOT NULL,
	CONSTRAINT "invitation_company_id_attempt_key_key" UNIQUE("company_id","attempt_key")
);
--> statement-breakpoint
CREATE TABLE "auth"."member" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "member_company_id_user_id_key" UNIQUE("company_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "auth"."session" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "auth"."session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "ban_expires" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_pending_email_key" ON "auth"."invitation" ("company_id",lower("email")) WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "auth"."invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "auth"."member" ("user_id");--> statement-breakpoint
ALTER TABLE "auth"."invitation" ADD CONSTRAINT "invitation_company_id_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."member" ADD CONSTRAINT "member_company_id_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."company"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;