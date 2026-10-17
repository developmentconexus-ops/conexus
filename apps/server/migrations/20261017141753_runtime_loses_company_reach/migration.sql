-- contract: step 5's second phase (data D6, the founder's answer H). It ships after v0.5.0, whose
-- image reaches a company's tables only through a scope's role, so no running image leans on the
-- Hub login's own reach that these statements take away.
DROP POLICY "runtime_transition" ON "auth"."company";--> statement-breakpoint
DROP POLICY "runtime_transition" ON "auth"."invitation";--> statement-breakpoint
DROP POLICY "runtime_transition" ON "auth"."member";--> statement-breakpoint
DROP POLICY "runtime_transition" ON "operations"."client";--> statement-breakpoint
REVOKE ALL ON TABLE auth.company, auth.member, auth.invitation, operations.client FROM hub_runtime;
