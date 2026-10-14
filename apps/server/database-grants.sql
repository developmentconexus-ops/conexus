-- Owners, grants and default privileges of the Hub database (pg_dump --schema-only)
ALTER SCHEMA drizzle OWNER TO conexus_owner;
ALTER SCHEMA hub OWNER TO conexus_owner;
ALTER TABLE drizzle.__drizzle_migrations OWNER TO conexus_owner;
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO conexus_owner;
ALTER TABLE hub.starts OWNER TO conexus_owner;
GRANT USAGE ON SCHEMA drizzle TO hub_runtime;
GRANT USAGE ON SCHEMA hub TO hub_runtime;
GRANT SELECT ON TABLE drizzle.__drizzle_migrations TO hub_runtime;
GRANT SELECT,INSERT ON TABLE hub.starts TO hub_runtime;

-- Roles of the Hub (pg_dumpall --roles-only --no-role-passwords)
CREATE ROLE hub_runtime;
ALTER ROLE hub_runtime WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
ALTER ROLE hub_runtime SET statement_timeout TO '10s';
ALTER ROLE hub_runtime SET idle_in_transaction_session_timeout TO '10s';
GRANT hub_runtime TO conexus_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY postgres;
GRANT hub_runtime TO conexus_owner WITH INHERIT TRUE GRANTED BY conexus_owner;
