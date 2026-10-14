-- The approved snapshot of the Hub database: owners, grants, default privileges, database settings
-- (pg_dump --create --schema-only) and every role (pg_dumpall --roles-only --no-role-passwords).
-- catalog.test.ts replaces the test database, owner and superuser names by hub_database, test_owner
-- and test_superuser, and leaves out the two roles of the test harness and the membership that
-- test-database.ts grants to the owner. Comment lines and blank lines are ignored in the comparison.
ALTER DATABASE hub_database OWNER TO test_owner;
ALTER SCHEMA drizzle OWNER TO test_owner;
ALTER SCHEMA hub OWNER TO test_owner;
ALTER TABLE drizzle.__drizzle_migrations OWNER TO test_owner;
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO test_owner;
ALTER TABLE hub.starts OWNER TO test_owner;
GRANT USAGE ON SCHEMA drizzle TO hub_runtime;
GRANT USAGE ON SCHEMA hub TO hub_runtime;
GRANT SELECT ON TABLE drizzle.__drizzle_migrations TO hub_runtime;
GRANT SELECT,INSERT ON TABLE hub.starts TO hub_runtime;
CREATE ROLE hub_runtime;
ALTER ROLE hub_runtime WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
ALTER ROLE hub_runtime SET statement_timeout TO '10s';
ALTER ROLE hub_runtime SET idle_in_transaction_session_timeout TO '10s';
-- PostgreSQL grants the role that creates hub_runtime (the migration owner) the right to administer it. Neon does the same.
GRANT hub_runtime TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
