ALTER TABLE "auth"."company" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."invitation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."member" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "operations"."client" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "runtime_transition" ON "auth"."company" AS PERMISSIVE FOR ALL TO "hub_runtime" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "auth"."company" AS PERMISSIVE FOR ALL TO "hub_company" USING (id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "person_select" ON "auth"."company" AS PERMISSIVE FOR SELECT TO "hub_person" USING (exists (select 1 from auth.member m where m.company_id = company.id and m.user_id = nullif(current_setting('conexus.person_id', true), '')));--> statement-breakpoint
CREATE POLICY "invitation_all" ON "auth"."company" AS PERMISSIVE FOR ALL TO "hub_invitation" USING (exists (select 1 from auth.invitation i where i.id = nullif(current_setting('conexus.invitation_id', true), '') and i.company_id = company.id)) WITH CHECK (exists (select 1 from auth.invitation i where i.id = nullif(current_setting('conexus.invitation_id', true), '') and i.company_id = company.id));--> statement-breakpoint
CREATE POLICY "runtime_transition" ON "auth"."invitation" AS PERMISSIVE FOR ALL TO "hub_runtime" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "auth"."invitation" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "person_select" ON "auth"."invitation" AS PERMISSIVE FOR SELECT TO "hub_person" USING (inviter_id = nullif(current_setting('conexus.person_id', true), '')
        or lower(email) = (select u.email from auth."user" u where u.id = nullif(current_setting('conexus.person_id', true), '')));--> statement-breakpoint
CREATE POLICY "invitation_all" ON "auth"."invitation" AS PERMISSIVE FOR ALL TO "hub_invitation" USING (id = nullif(current_setting('conexus.invitation_id', true), '')) WITH CHECK (id = nullif(current_setting('conexus.invitation_id', true), ''));--> statement-breakpoint
CREATE POLICY "runtime_transition" ON "auth"."member" AS PERMISSIVE FOR ALL TO "hub_runtime" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "auth"."member" AS PERMISSIVE FOR ALL TO "hub_company" USING (company_id = nullif(current_setting('conexus.company_id', true), '')) WITH CHECK (company_id = nullif(current_setting('conexus.company_id', true), ''));--> statement-breakpoint
CREATE POLICY "person_select" ON "auth"."member" AS PERMISSIVE FOR SELECT TO "hub_person" USING (user_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "invitation_insert" ON "auth"."member" AS PERMISSIVE FOR INSERT TO "hub_invitation" WITH CHECK (user_id = nullif(current_setting('conexus.person_id', true), '')
        and exists (select 1 from auth.invitation i where i.id = nullif(current_setting('conexus.invitation_id', true), '') and i.company_id = member.company_id));--> statement-breakpoint
CREATE POLICY "runtime_sign_in" ON "auth"."user" AS PERMISSIVE FOR ALL TO "hub_runtime" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "auth"."user" AS PERMISSIVE FOR ALL TO "hub_company" USING (id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.member m where m.user_id = "user".id and m.company_id = nullif(current_setting('conexus.company_id', true), ''))
        or exists (select 1 from auth.invitation i where i.inviter_id = "user".id and i.company_id = nullif(current_setting('conexus.company_id', true), ''))) WITH CHECK (id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.member m where m.user_id = "user".id and m.company_id = nullif(current_setting('conexus.company_id', true), ''))
        or exists (select 1 from auth.invitation i where i.inviter_id = "user".id and i.company_id = nullif(current_setting('conexus.company_id', true), '')));--> statement-breakpoint
CREATE POLICY "person_all" ON "auth"."user" AS PERMISSIVE FOR ALL TO "hub_person" USING (id = nullif(current_setting('conexus.person_id', true), '')) WITH CHECK (id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "invitation_all" ON "auth"."user" AS PERMISSIVE FOR ALL TO "hub_invitation" USING (id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.invitation i where i.id = nullif(current_setting('conexus.invitation_id', true), '')
          and (i.inviter_id = "user".id or lower(i.email) = "user".email))) WITH CHECK (id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.invitation i where i.id = nullif(current_setting('conexus.invitation_id', true), '')
          and (i.inviter_id = "user".id or lower(i.email) = "user".email)));--> statement-breakpoint
CREATE POLICY "runtime_transition" ON "operations"."client" AS PERMISSIVE FOR ALL TO "hub_runtime" USING (true) WITH CHECK (true);