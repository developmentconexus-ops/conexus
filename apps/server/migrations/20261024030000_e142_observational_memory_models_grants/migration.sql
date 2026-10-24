-- Step 14.2, founder 2026-10-23 ("1. Aprovo", data D11): a company's people read the company's
-- Observer and Reflector choice, and an owner or an administrator saves it; no one deletes it, the
-- row leaves with its company.
GRANT SELECT, INSERT, UPDATE (observer, reflector) ON TABLE builder.observational_memory_models TO hub_company;
