-- The approved snapshot of the Hub database: owners, grants, default privileges, database settings
-- (pg_dump --create --schema-only) and every role (pg_dumpall --roles-only --no-role-passwords).
-- catalog.test.ts replaces the test database, owner and superuser names by hub_database, test_owner
-- and test_superuser, and leaves out the two roles of the test harness. Comment lines and blank lines
-- are ignored in the comparison.
ALTER DATABASE hub_database OWNER TO test_owner;
ALTER SCHEMA auth OWNER TO test_owner;
ALTER SCHEMA drizzle OWNER TO test_owner;
ALTER SCHEMA hub OWNER TO test_owner;
ALTER SCHEMA operations OWNER TO test_owner;
ALTER TABLE auth.account OWNER TO test_owner;
ALTER TABLE auth.company OWNER TO test_owner;
ALTER TABLE auth.invitation OWNER TO test_owner;
ALTER TABLE auth.member OWNER TO test_owner;
ALTER TABLE auth.rate_limit OWNER TO test_owner;
ALTER TABLE auth.session OWNER TO test_owner;
ALTER TABLE auth."user" OWNER TO test_owner;
ALTER TABLE auth.verification OWNER TO test_owner;
ALTER TABLE drizzle.__drizzle_migrations OWNER TO test_owner;
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO test_owner;
ALTER TABLE hub.starts OWNER TO test_owner;
ALTER TABLE operations.client OWNER TO test_owner;
GRANT USAGE ON SCHEMA auth TO hub_runtime;
GRANT USAGE ON SCHEMA drizzle TO hub_runtime;
GRANT USAGE ON SCHEMA hub TO hub_runtime;
GRANT USAGE ON SCHEMA operations TO hub_runtime;
-- Step 3, founder 2026-10-14 ("0 Aprovo"): the Hub never deletes a person or a stored password.
GRANT SELECT,INSERT,UPDATE ON TABLE auth.account TO hub_runtime;
-- Step 4, founder 2026-10-15 (decision 8, "Aprovo"): the Hub never deletes a company, a member or an
-- invitation.
GRANT SELECT,INSERT,UPDATE ON TABLE auth.company TO hub_runtime;
GRANT SELECT,INSERT,UPDATE ON TABLE auth.invitation TO hub_runtime;
GRANT SELECT,INSERT,UPDATE ON TABLE auth.member TO hub_runtime;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.rate_limit TO hub_runtime;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.session TO hub_runtime;
GRANT SELECT,INSERT,UPDATE ON TABLE auth."user" TO hub_runtime;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.verification TO hub_runtime;
GRANT SELECT ON TABLE drizzle.__drizzle_migrations TO hub_runtime;
GRANT SELECT,INSERT ON TABLE hub.starts TO hub_runtime;
-- Step 4.2, founder 2026-10-16 ("Aprovo", option A): the Hub never deletes a client.
GRANT SELECT,INSERT,UPDATE ON TABLE operations.client TO hub_runtime;
CREATE ROLE hub_runtime;
ALTER ROLE hub_runtime WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
ALTER ROLE hub_runtime SET statement_timeout TO '10s';
ALTER ROLE hub_runtime SET idle_in_transaction_session_timeout TO '10s';
-- PostgreSQL grants the role that creates hub_runtime (the migration owner) the right to administer it. Neon does the same.
GRANT hub_runtime TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
