-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 12.3, founder 2026-10-21 ("A"): the
-- Hub keeps the models a provider says an account serves, read and written as the company's role.
GRANT SELECT (served_models, served_at), UPDATE (served_models, served_at) ON TABLE builder.model_account TO hub_company;
