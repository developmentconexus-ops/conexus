-- Custom SQL: Drizzle cannot generate a grant (data D5). O Sync de qualquer conector, with the founder's
-- word in the pull request of its own (data D11): a copy's runs read and save where each of its
-- connections stands and until when the provider asked it to wait; Desligar ends, in the transaction
-- that deletes the connection, the copy left with no source, writes down its table when the company's
-- database does not answer, and drains those rows once each table is dropped; the Builder's run
-- proposes a copy over several connections. A source leaves only by its foreign keys' cascade.
GRANT SELECT, INSERT ON TABLE copies.copy_source TO hub_company;
--> statement-breakpoint
GRANT UPDATE (pass, pass_started_at, position, watermark, wait_until) ON TABLE copies.copy_source TO hub_company;
--> statement-breakpoint
GRANT DELETE ON TABLE copies.copy TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE copies.copy_table_left TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE copies.copy_proposal_source TO hub_company;
