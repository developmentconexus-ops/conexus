-- Custom SQL: Drizzle cannot generate a grant (data D5). The conference's session, with the
-- founder's word of 2026-11-23 ("2. A", data D11), in a pull request of its own: the Hub's login
-- writes and redeems a conference's session with no scope, as it does an app session; it never
-- changes one.
GRANT SELECT, INSERT, DELETE ON TABLE apps.check_session TO hub_runtime;
