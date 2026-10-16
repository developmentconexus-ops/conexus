-- Custom SQL: Drizzle cannot generate a grant (data D5). The Hub reads, creates and changes
-- companies, members and invitations through Better Auth, and never deletes them: a defect that
-- tries is refused by the database. The founder approved this list on 2026-10-15 (data D11).
GRANT SELECT, INSERT, UPDATE ON TABLE auth.company, auth.member, auth.invitation TO hub_runtime;
