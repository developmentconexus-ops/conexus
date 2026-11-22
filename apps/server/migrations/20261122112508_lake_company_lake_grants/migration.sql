-- Custom SQL: Drizzle cannot generate a grant (data D5). The company's lake, with the founder's word
-- of 2026-11-22 ("2. A", decision G), in a pull request of its own (data D11): the Hub's login for
-- the Central reads, creates, changes the state of and deletes a lake's row; the login for a company
-- sees none. `account`, `region` and `company_id` are never updated.
GRANT USAGE ON SCHEMA lake TO hub_operator;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE lake.company_lake TO hub_operator;
--> statement-breakpoint
GRANT UPDATE (lake_id, state, template, stack_id, since, failure) ON TABLE lake.company_lake TO hub_operator;
