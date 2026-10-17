-- Custom SQL: Drizzle cannot generate a grant (data D5). The Hub reads, registers and corrects
-- clients, and never deletes one: deletion is step 5's, with its own grant. The founder approved
-- this list on 2026-10-16 (data D11).
GRANT USAGE ON SCHEMA operations TO hub_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE operations.client TO hub_runtime;
