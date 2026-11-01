-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 24.1, U2, founder 2026-11-01
-- ("Aprovo as permissoes do b1"): the Assistant's routes keep a conversation's chosen connections,
-- and its turn reads them. The row leaves by its foreign keys' cascade, so the Hub never deletes it.
GRANT SELECT, INSERT ON TABLE builder.assistant_conversation TO hub_company;
--> statement-breakpoint
GRANT UPDATE (connections) ON TABLE builder.assistant_conversation TO hub_company;
