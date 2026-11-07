-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 24.5, U1, with the founder's word on
-- the step's card (data D11, page approval "Sim"): a company's routes read and record each write an
-- agent sends to an outside system, and finish its record with the state and the answer, never any
-- other column. A record leaves with nothing but the database owner; the Hub never deletes one.
GRANT SELECT, INSERT ON TABLE connectors.connector_write TO hub_company;
--> statement-breakpoint
GRANT UPDATE (state, answer) ON TABLE connectors.connector_write TO hub_company;
