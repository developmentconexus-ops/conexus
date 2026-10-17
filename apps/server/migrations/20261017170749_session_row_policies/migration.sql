-- Step 6 (founder 2026-10-17, "Aprovo"): a company's routes delete a member and change its role, and
-- the invitation link deletes sessions, because changing the password ends the person's others.
-- The grants are custom SQL: the pgRole of Drizzle does not generate a grant (data D5, issue 72).
-- The policies below limit both scopes to the sessions of their own person (issue 57).
ALTER TABLE "auth"."session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "runtime_all" ON "auth"."session" AS PERMISSIVE FOR ALL TO "hub_runtime" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "company_all" ON "auth"."session" AS PERMISSIVE FOR ALL TO "hub_company" USING (user_id = nullif(current_setting('conexus.person_id', true), '')) WITH CHECK (user_id = nullif(current_setting('conexus.person_id', true), ''));--> statement-breakpoint
CREATE POLICY "invitation_all" ON "auth"."session" AS PERMISSIVE FOR ALL TO "hub_invitation" USING (user_id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.invitation i join auth."user" u on u.email = lower(i.email)
          where i.id = nullif(current_setting('conexus.invitation_id', true), '') and u.id = session.user_id)) WITH CHECK (user_id = nullif(current_setting('conexus.person_id', true), '')
        or exists (select 1 from auth.invitation i join auth."user" u on u.email = lower(i.email)
          where i.id = nullif(current_setting('conexus.invitation_id', true), '') and u.id = session.user_id));--> statement-breakpoint
GRANT DELETE, UPDATE (role) ON TABLE auth.member TO hub_company;
--> statement-breakpoint
GRANT DELETE ON TABLE auth.session TO hub_invitation;
