-- contract: o índice só se alarga para o Projeto; o código de antes nunca escreve project_id
CREATE TABLE "projects"."app_access" (
	"company_id" text NOT NULL,
	"project_id" text,
	"person_id" text,
	"role" text,
	"granted_at" timestamp with time zone DEFAULT statement_timestamp() NOT NULL,
	CONSTRAINT "app_access_pkey" PRIMARY KEY("project_id","person_id")
);
--> statement-breakpoint
ALTER TABLE "projects"."app_access" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."invitation" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "auth"."invitation" ADD COLUMN "app_role" text;--> statement-breakpoint
DROP INDEX "auth"."invitation_pending_email_key";--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_pending_email_key" ON "auth"."invitation" ("company_id",lower("email"),coalesce("project_id", '')) WHERE "status" = 'pending';--> statement-breakpoint
ALTER TABLE "projects"."app_access" ADD CONSTRAINT "app_access_project_id_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."project"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth"."invitation" ADD CONSTRAINT "invitation_kind" CHECK (("project_id" is null) = ("role" is not null));--> statement-breakpoint
CREATE POLICY "app_people_select" ON "auth"."company" AS PERMISSIVE FOR SELECT TO "hub_app_people" USING (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "projects"."app_access" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "invitation_insert" ON "projects"."app_access" AS PERMISSIVE FOR INSERT TO "hub_invitation" WITH CHECK (exists (select 1 from auth.invitation i
        join auth."user" u on lower(u.email) = lower(i.email)
        where i.id = nullif(current_setting('conexus.invitation_id', true), '') and i.company_id = app_access.company_id
          and i.project_id = app_access.project_id and i.app_role is not distinct from app_access.role
          and u.id = app_access.person_id));--> statement-breakpoint
CREATE POLICY "invitation_select" ON "projects"."app_access" AS PERMISSIVE FOR SELECT TO "hub_invitation" USING (exists (select 1 from auth.invitation i
        join auth."user" u on lower(u.email) = lower(i.email)
        where i.id = nullif(current_setting('conexus.invitation_id', true), '') and i.project_id = app_access.project_id
          and u.id = app_access.person_id));--> statement-breakpoint
CREATE POLICY "app_people_select" ON "projects"."app_access" AS PERMISSIVE FOR SELECT TO "hub_app_people" USING (true);--> statement-breakpoint
CREATE POLICY "app_people_select" ON "projects"."project" AS PERMISSIVE FOR SELECT TO "hub_app_people" USING (true);--> statement-breakpoint
CREATE POLICY "invitation_select" ON "projects"."project" AS PERMISSIVE FOR SELECT TO "hub_invitation" USING (exists (select 1 from auth.invitation i where i.id = nullif(current_setting('conexus.invitation_id', true), '')
        and i.company_id = project.company_id and i.project_id = project.id));--> statement-breakpoint
ALTER POLICY "company_all" ON "auth"."user" TO "hub_company" USING (id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.member m where m.user_id = "user".id and m.company_id = nullif(current_setting('conexus.company_id', true), ''))
        or exists (select 1 from auth.invitation i where i.inviter_id = "user".id and i.company_id = nullif(current_setting('conexus.company_id', true), ''))
        or exists (select 1 from projects.app_access a where a.person_id = "user".id and a.company_id = nullif(current_setting('conexus.company_id', true), ''))) WITH CHECK (id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.member m where m.user_id = "user".id and m.company_id = nullif(current_setting('conexus.company_id', true), ''))
        or exists (select 1 from auth.invitation i where i.inviter_id = "user".id and i.company_id = nullif(current_setting('conexus.company_id', true), ''))
        or exists (select 1 from projects.app_access a where a.person_id = "user".id and a.company_id = nullif(current_setting('conexus.company_id', true), '')));