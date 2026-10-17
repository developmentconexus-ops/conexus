-- Custom SQL: Drizzle cannot generate a grant (data D5, issue 72). Step 7, founder 2026-10-17
-- ("A", data D11): a company's routes read, create and delete Projects, and read, create and mark
-- ready the company's database; the Central, deleting a company, reads and deletes both of that
-- company's. Neither scope changes a Project; neither company nor Hub login reaches a row of another.
GRANT USAGE ON SCHEMA projects TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA projects TO hub_operator;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE projects.project TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE (state, neon_project_id, claimed_until) ON TABLE projects.company_database TO hub_company;
--> statement-breakpoint
GRANT SELECT, DELETE ON TABLE projects.project TO hub_operator;
--> statement-breakpoint
GRANT SELECT, DELETE ON TABLE projects.company_database TO hub_operator;
