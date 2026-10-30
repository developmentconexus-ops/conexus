-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 20, founder 2026-10-30 ("1 aprovo", the
-- step 20 card, data D11): a company's routes grant a Projeto the use of a connection and take it
-- back, and read and change the connection's notes. Nothing of connection.sealed or revision moves.
GRANT SELECT, INSERT, DELETE ON TABLE connectors.project_connection TO hub_company;
--> statement-breakpoint
GRANT SELECT (notes), UPDATE (notes) ON TABLE connectors.connection TO hub_company;
