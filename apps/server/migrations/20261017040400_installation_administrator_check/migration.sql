-- Custom SQL: Drizzle cannot generate a role, a function or a grant (data D5). Provisional, firstmate
-- 2026-10-17, until the founder's word: every operator policy needs the person to be an installation
-- administrator (security S11), and the operator reads companies' owners in auth.user. Checked by a
-- query on auth.user from auth.member's policy, the two policies would expand each other forever, which
-- PostgreSQL refuses. This one function answers the check instead: it runs as hub_administrators, a
-- role that cannot log in and reads only the administrators' rows, so no operator policy expands
-- another (step 5's U1 proof).
DO $$
BEGIN
  BEGIN
    CREATE ROLE hub_administrators NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  EXCEPTION WHEN duplicate_object OR unique_violation THEN
    NULL;
  END;
  ALTER ROLE hub_administrators NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE;
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA auth TO hub_administrators;
--> statement-breakpoint
GRANT SELECT (id, role) ON TABLE auth."user" TO hub_administrators;
--> statement-breakpoint
CREATE FUNCTION auth.is_installation_administrator(person text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
  AS $$ SELECT EXISTS (SELECT 1 FROM auth."user" u WHERE u.id = person AND u.role = 'admin') $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION auth.is_installation_administrator(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION auth.is_installation_administrator(text) TO hub_operator;
--> statement-breakpoint
-- The function changes hands to the role that cannot log in. PostgreSQL asks the owner giving it to
-- be able to act as that role, and the role to create in the schema, for this moment only.
GRANT CREATE ON SCHEMA auth TO hub_administrators;
--> statement-breakpoint
GRANT hub_administrators TO current_user WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
ALTER FUNCTION auth.is_installation_administrator(text) OWNER TO hub_administrators;
--> statement-breakpoint
REVOKE hub_administrators FROM current_user;
--> statement-breakpoint
REVOKE CREATE ON SCHEMA auth FROM hub_administrators;
