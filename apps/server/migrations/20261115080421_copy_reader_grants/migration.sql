-- Custom SQL: Drizzle cannot generate a grant (data D5). A governança mínima, grupo 2, with the
-- founder's word of 2026-11-15 (P2), in a pull request of its own (data D11): a company's routes
-- read which roles read each copy, mark and unmark them, and mark a copy whose readers were written once.
GRANT SELECT, INSERT, DELETE ON TABLE copies.copy_reader TO hub_company;
--> statement-breakpoint
GRANT UPDATE (readers_set) ON TABLE copies.copy TO hub_company;
