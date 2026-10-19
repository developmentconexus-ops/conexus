-- Custom SQL: Drizzle cannot generate a deferrable constraint, a function or a grant (data D5).
-- One queue, one owner and one provider, holds each position once; an order writes them all
-- before the check, at commit.
ALTER TABLE builder.model_account ADD CONSTRAINT model_account_position_key
  UNIQUE NULLS NOT DISTINCT (company_id, person_id, provider, position) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
-- Step 11, founder 2026-10-19 ("2. a", Grant A, data D11): a company's routes link, read, order,
-- change, give and remove its model accounts, and set its default model, but never read a sealed
-- credential: one function hands it out, one account at a time, in the transaction's company. The
-- Central chooses the company's sign-in kinds. The Hub's login reaches no table of them.
GRANT USAGE ON SCHEMA builder TO hub_company;
--> statement-breakpoint
GRANT USAGE ON SCHEMA builder TO hub_operator;
--> statement-breakpoint
GRANT SELECT (id, company_id, person_id, kind, provider, label, position, state, key_id, hint, linked_by, linked_at, revision, attempt_key), INSERT, DELETE ON TABLE builder.model_account TO hub_company;
--> statement-breakpoint
GRANT UPDATE (label, position, state, sealed, key_id, revision) ON TABLE builder.model_account TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE builder.model_account_assignee, builder.model_account_sign_in TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE (model) ON TABLE builder.company_model TO hub_company;
--> statement-breakpoint
GRANT SELECT ON TABLE builder.company_account_kind TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE builder.company_account_kind TO hub_operator;
--> statement-breakpoint
GRANT USAGE ON SCHEMA builder TO hub_model_seals;
--> statement-breakpoint
GRANT SELECT (id, company_id, person_id, sealed, key_id) ON TABLE builder.model_account TO hub_model_seals;
--> statement-breakpoint
GRANT SELECT (company_id) ON TABLE builder.model_account_sign_in TO hub_model_seals;
--> statement-breakpoint
-- An account's sealed credential, in the company the transaction entered, and only a company's
-- or the scope's person's own: the one way any role reads `sealed`.
CREATE FUNCTION builder.sealed_of(account uuid) RETURNS TABLE (sealed bytea, key_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT m.sealed, m.key_id FROM builder.model_account m
    WHERE m.id = account
      AND m.company_id = nullif(current_setting('conexus.company_id', true), '')
      AND (m.person_id IS NULL
        OR m.person_id = nullif(current_setting('conexus.person_id', true), '')
        OR nullif(current_setting('conexus.person_id', true), '') IS NULL) $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION builder.sealed_of(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION builder.sealed_of(uuid) TO hub_company;
--> statement-breakpoint
-- The companies that hold a sealed value, for `reseal`, before any company is known: the one
-- answer the Hub's login gets from the model accounts, and it holds no row of them.
CREATE FUNCTION builder.companies_with_seals() RETURNS TABLE (company_id text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT m.company_id FROM builder.model_account m
    UNION SELECT s.company_id FROM builder.model_account_sign_in s $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION builder.companies_with_seals() FROM PUBLIC;
--> statement-breakpoint
GRANT USAGE ON SCHEMA builder TO hub_runtime;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION builder.companies_with_seals() TO hub_runtime;
--> statement-breakpoint
-- Both functions change hands to the role that cannot log in, as projects.project_of_host did.
GRANT CREATE ON SCHEMA builder TO hub_model_seals;
--> statement-breakpoint
GRANT hub_model_seals TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION builder.sealed_of(uuid) OWNER TO hub_model_seals;
--> statement-breakpoint
ALTER FUNCTION builder.companies_with_seals() OWNER TO hub_model_seals;
--> statement-breakpoint
REVOKE hub_model_seals FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA builder FROM hub_model_seals;
