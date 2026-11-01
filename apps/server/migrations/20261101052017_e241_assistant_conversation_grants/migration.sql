-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 24.1, U2, waiting for the founder's word
-- (data D11): the Assistant's routes keep a conversation's chosen connections, and its turn reads
-- them. The row leaves by its foreign keys' cascade, so the Hub never deletes it.
GRANT SELECT, INSERT ON TABLE builder.assistant_conversation TO hub_company;
--> statement-breakpoint
GRANT UPDATE (connections) ON TABLE builder.assistant_conversation TO hub_company;
