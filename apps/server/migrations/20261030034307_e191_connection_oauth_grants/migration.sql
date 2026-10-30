-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 19.1, founder 2026-10-29 ("Aprovado
-- 19.1", the step 19.1 card, data D11): a company's routes start an OAuth authorization, read and
-- spend it once, read and renew the account and the refresh lease of a connection, and Conectar de
-- novo changes who linked it and when. connection.sealed stays out of reach: only
-- connectors.sealed_of reads it; a sign-in's own verifier is read by the company that started it.
GRANT SELECT, INSERT, DELETE ON TABLE connectors.connection_sign_in TO hub_company;
--> statement-breakpoint
GRANT SELECT (revision, refresh_until, account_ref, account_label) ON TABLE connectors.connection TO hub_company;
--> statement-breakpoint
GRANT UPDATE (revision, refresh_until, account_ref, account_label, linked_by, linked_at) ON TABLE connectors.connection TO hub_company;
