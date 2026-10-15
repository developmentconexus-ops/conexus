-- Custom SQL: Drizzle cannot generate a grant (data D5). The Hub signs people in through Better Auth
-- on these tables: it never deletes a person or a stored password, and it deletes sessions,
-- one-use links and attempt counts. The founder approved this list on 2026-10-14 (data D11).
GRANT USAGE ON SCHEMA auth TO hub_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE auth.user, auth.account TO hub_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auth.session, auth.verification, auth.rate_limit TO hub_runtime;
