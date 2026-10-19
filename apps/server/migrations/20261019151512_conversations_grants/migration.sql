-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 12, founder 2026-10-19 ("1. A", data
-- D11): a company's routes index their own conversations and their messages' keys, and read and
-- write the automatic switch; the queue marks an account limited and holds a token's refresh. The
-- Hub's login reaches none of them.
GRANT SELECT, INSERT, DELETE ON TABLE builder.conversation, builder.conversation_turn TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE (enabled, chain, revision) ON TABLE builder.company_model_fallback TO hub_company;
--> statement-breakpoint
GRANT SELECT (limited_until, refresh_until), UPDATE (limited_until, refresh_until) ON TABLE builder.model_account TO hub_company;
