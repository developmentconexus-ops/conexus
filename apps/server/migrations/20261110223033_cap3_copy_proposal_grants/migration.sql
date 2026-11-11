-- Custom SQL: Drizzle cannot generate a grant (data D5). Capacity 3, U3, with the founder's word in
-- the pull request of its own (data D11): the Builder's run proposes a copy in a company's
-- Projeto, and the company's routes list the proposals and decide each one, turning it on or
-- dismissing it. A proposal leaves only by its foreign keys' cascade.
GRANT SELECT, INSERT ON TABLE copies.copy_proposal TO hub_company;
--> statement-breakpoint
GRANT UPDATE (state, copy_id) ON TABLE copies.copy_proposal TO hub_company;
