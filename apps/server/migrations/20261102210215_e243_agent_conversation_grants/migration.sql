-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 24.3, U2, on the card the founder
-- approved (2026-11-02): the agents' routes keep which agent and whether the draft each conversation
-- runs, and its turn reads them. The row leaves by its foreign keys' cascade, so the Hub never
-- deletes it.
GRANT SELECT, INSERT ON TABLE builder.agent_conversation TO hub_company;
