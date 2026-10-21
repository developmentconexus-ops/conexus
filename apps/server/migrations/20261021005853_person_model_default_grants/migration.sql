-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 12.3, founder 2026-10-20 ("Tudo A",
-- P1, P4): a person reads, writes and clears their own default model and level, and the company's
-- default model carries a level an owner or an administrator sets. The Hub's login reaches neither.
GRANT SELECT, INSERT, DELETE, UPDATE (model, effort) ON TABLE builder.person_model_default TO hub_company;
--> statement-breakpoint
GRANT UPDATE (effort) ON TABLE builder.company_model TO hub_company;
