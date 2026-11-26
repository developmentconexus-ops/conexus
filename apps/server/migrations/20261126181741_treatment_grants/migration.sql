-- Custom SQL: Drizzle cannot generate a grant (data D5). The treatment of the lake, T1 (data D11;
-- founder, 2026-11-26, asked "O senhor aprova essas duas permissões, no PR próprio?", answered
-- "2. Aprovo"): the permissions of the new treatment tables, and a company's login reading the recipe
-- of its own lake.
GRANT USAGE ON SCHEMA treatment TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE treatment.model, treatment.version, treatment.run, treatment.model_run TO hub_company;
--> statement-breakpoint
GRANT UPDATE (description) ON TABLE treatment.model TO hub_company;
--> statement-breakpoint
GRANT UPDATE (approved_by, approved_at) ON TABLE treatment.version TO hub_company;
--> statement-breakpoint
GRANT UPDATE (state, pending, failure, stopped_by, attempt, task, ended_at) ON TABLE treatment.run TO hub_company;
--> statement-breakpoint
GRANT SELECT (template) ON TABLE lake.company_lake TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA treatment TO hub_operator;
--> statement-breakpoint
GRANT SELECT, DELETE ON TABLE treatment.model, treatment.run TO hub_operator;
