-- Custom SQL: Drizzle cannot generate a grant (data D5). A governança mínima, grupo 3, with the
-- founder's word of 2026-11-15 (P2), in a pull request of its own (data D11; E4a): a company's
-- routes record each read of the company's data and list them. A record is never changed or
-- deleted by the Hub; it leaves only with its company, by the cascade.
GRANT USAGE ON SCHEMA data TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE data.data_read TO hub_company;
