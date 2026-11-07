-- Custom SQL: Drizzle cannot generate a grant (data D5). Step Papéis da empresa, U1, with the
-- founder's word on the step's card (2026-11-06, "Aprovo tudo"): a company's routes read, create,
-- change and delete the roles of their company, and the Central seeds a new company's two editable roles. The permission and the instant of a change are all
-- a role changes; its name and label stay as created. A company's deletion removes them by the
-- foreign key's cascade, never by the Hub.
GRANT SELECT, INSERT, DELETE ON TABLE auth.organization_role TO hub_company;
--> statement-breakpoint
GRANT UPDATE (permission, updated_at) ON TABLE auth.organization_role TO hub_company;
--> statement-breakpoint
GRANT INSERT ON TABLE auth.organization_role TO hub_operator;
