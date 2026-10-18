-- The approved snapshot of the Hub database: owners, grants, default privileges, database settings
-- (pg_dump --create --schema-only) and every role (pg_dumpall --roles-only --no-role-passwords).
-- catalog.test.ts replaces the test database, owner and superuser names by hub_database, test_owner
-- and test_superuser, and leaves out the two roles of the test harness. Comment lines and blank lines
-- are ignored in the comparison.
ALTER DATABASE hub_database OWNER TO test_owner;
ALTER SCHEMA apps OWNER TO test_owner;
ALTER SCHEMA auth OWNER TO test_owner;
ALTER SCHEMA drizzle OWNER TO test_owner;
ALTER SCHEMA hub OWNER TO test_owner;
ALTER SCHEMA operations OWNER TO test_owner;
ALTER SCHEMA projects OWNER TO test_owner;
-- Step 5, provisional until the founder's word (firstmate, 2026-10-17): the operator's administrator
-- check, one SECURITY DEFINER function owned by a role that cannot log in and reads only the
-- administrators' rows; only hub_operator executes it.
ALTER FUNCTION auth.is_installation_administrator(person text) OWNER TO hub_administrators;
-- Step 8, founder 2026-10-17 ("Grant A"): a host's Project and company, one SECURITY DEFINER function
-- owned by a role that cannot log in and reads three columns of the Projects; only hub_runtime
-- executes it.
ALTER FUNCTION projects.project_of_host(label text) OWNER TO hub_hosts;
ALTER TABLE apps.app_session OWNER TO test_owner;
ALTER TABLE apps.handoff OWNER TO test_owner;
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
ALTER TABLE projects.company_database OWNER TO test_owner;
ALTER TABLE projects.project OWNER TO test_owner;
GRANT USAGE ON SCHEMA apps TO hub_runtime;
GRANT USAGE ON SCHEMA auth TO hub_runtime;
-- Step 5 (decision 0039): the four scopes a Hub transaction enters, each with the verbs its routes'
-- commands use; UPDATE on one column where a command only locks a row. Founder's word pending on
-- this list (D11).
GRANT USAGE ON SCHEMA auth TO hub_company;
GRANT USAGE ON SCHEMA auth TO hub_person;
GRANT USAGE ON SCHEMA auth TO hub_invitation;
GRANT USAGE ON SCHEMA auth TO hub_operator;
GRANT USAGE ON SCHEMA auth TO hub_administrators;
GRANT USAGE ON SCHEMA drizzle TO hub_runtime;
GRANT USAGE ON SCHEMA hub TO hub_runtime;
GRANT USAGE ON SCHEMA operations TO hub_runtime;
GRANT USAGE ON SCHEMA operations TO hub_operator;
GRANT USAGE ON SCHEMA projects TO hub_company;
GRANT USAGE ON SCHEMA projects TO hub_operator;
GRANT USAGE ON SCHEMA projects TO hub_hosts;
GRANT USAGE ON SCHEMA projects TO hub_runtime;
REVOKE ALL ON FUNCTION auth.is_installation_administrator(person text) FROM PUBLIC;
GRANT ALL ON FUNCTION auth.is_installation_administrator(person text) TO hub_operator;
REVOKE ALL ON FUNCTION projects.project_of_host(label text) FROM PUBLIC;
GRANT ALL ON FUNCTION projects.project_of_host(label text) TO hub_runtime;
-- Step 8, founder 2026-10-17 ("Grant A"): the Hub's login writes and redeems app handoffs and
-- sessions, with no scope, as it does the Hub's sessions; it never changes one.
GRANT SELECT,INSERT,DELETE ON TABLE apps.app_session TO hub_runtime;
GRANT SELECT,INSERT,DELETE ON TABLE apps.handoff TO hub_runtime;
-- Step 3, founder 2026-10-14 ("0 Aprovo"): the Hub never deletes a person or a stored password.
GRANT SELECT,INSERT,UPDATE ON TABLE auth.account TO hub_runtime;
GRANT SELECT,INSERT ON TABLE auth.account TO hub_invitation;
-- Step 4, founder 2026-10-15 (decision 8, "Aprovo"): the Hub never deletes a company, a member or an
-- invitation.
-- Step 5, second phase (U7): the Hub's login keeps no grant on a company's tables; each scope's role
-- reaches them. Founder's word pending on this list (D11).
GRANT SELECT ON TABLE auth.company TO hub_company;
GRANT SELECT ON TABLE auth.company TO hub_person;
GRANT SELECT ON TABLE auth.company TO hub_invitation;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.company TO hub_operator;
GRANT UPDATE(created_at) ON TABLE auth.company TO hub_company;
GRANT UPDATE(created_at) ON TABLE auth.company TO hub_invitation;
-- Step 8, founder 2026-10-17 ("Grant A"): a company's routes record its nickname.
GRANT UPDATE(nickname) ON TABLE auth.company TO hub_company;
GRANT SELECT,INSERT,UPDATE ON TABLE auth.invitation TO hub_company;
GRANT SELECT ON TABLE auth.invitation TO hub_person;
GRANT SELECT,UPDATE ON TABLE auth.invitation TO hub_invitation;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.invitation TO hub_operator;
-- Step 6, founder 2026-10-17 ("Aprovo"): a company's routes delete a member and change its role, and
-- the invitation link deletes the invited person's sessions.
GRANT SELECT,DELETE ON TABLE auth.member TO hub_company;
GRANT SELECT ON TABLE auth.member TO hub_person;
GRANT SELECT,INSERT ON TABLE auth.member TO hub_invitation;
GRANT SELECT,DELETE ON TABLE auth.member TO hub_operator;
GRANT UPDATE(role) ON TABLE auth.member TO hub_company;
GRANT UPDATE(created_at) ON TABLE auth.member TO hub_company;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.rate_limit TO hub_runtime;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.session TO hub_runtime;
GRANT SELECT ON TABLE auth.session TO hub_company;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.session TO hub_invitation;
GRANT UPDATE(updated_at) ON TABLE auth.session TO hub_company;
GRANT SELECT,INSERT,UPDATE ON TABLE auth."user" TO hub_runtime;
GRANT SELECT ON TABLE auth."user" TO hub_company;
GRANT SELECT ON TABLE auth."user" TO hub_person;
GRANT SELECT,INSERT ON TABLE auth."user" TO hub_invitation;
GRANT SELECT ON TABLE auth."user" TO hub_operator;
GRANT SELECT(id) ON TABLE auth."user" TO hub_administrators;
GRANT UPDATE(name) ON TABLE auth."user" TO hub_invitation;
GRANT UPDATE(email_verified) ON TABLE auth."user" TO hub_invitation;
GRANT UPDATE(updated_at) ON TABLE auth."user" TO hub_company;
GRANT UPDATE(updated_at) ON TABLE auth."user" TO hub_invitation;
GRANT UPDATE(updated_at) ON TABLE auth."user" TO hub_operator;
GRANT SELECT(role) ON TABLE auth."user" TO hub_administrators;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE auth.verification TO hub_runtime;
GRANT SELECT,INSERT,DELETE ON TABLE auth.verification TO hub_invitation;
GRANT SELECT ON TABLE drizzle.__drizzle_migrations TO hub_runtime;
GRANT SELECT,INSERT ON TABLE hub.starts TO hub_runtime;
-- Step 4.2, founder 2026-10-16 ("Aprovo", option A): the Hub never deletes a client.
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE operations.client TO hub_operator;
-- Step 7, founder 2026-10-17 ("A"): a company's routes read, create and delete Projects, and read,
-- create and mark ready the company's database; the Central, deleting a company, reads and deletes
-- both of that company's.
GRANT SELECT,INSERT ON TABLE projects.company_database TO hub_company;
GRANT SELECT,DELETE ON TABLE projects.company_database TO hub_operator;
GRANT UPDATE(state) ON TABLE projects.company_database TO hub_company;
GRANT UPDATE(neon_project_id) ON TABLE projects.company_database TO hub_company;
GRANT UPDATE(claimed_until) ON TABLE projects.company_database TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE projects.project TO hub_company;
GRANT SELECT,DELETE ON TABLE projects.project TO hub_operator;
GRANT SELECT(id) ON TABLE projects.project TO hub_hosts;
GRANT SELECT(company_id) ON TABLE projects.project TO hub_hosts;
GRANT SELECT(host_label) ON TABLE projects.project TO hub_hosts;
CREATE ROLE hub_administrators;
ALTER ROLE hub_administrators WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
-- Step 5: the scope roles cannot log in, own nothing and pass no row policy.
CREATE ROLE hub_company;
ALTER ROLE hub_company WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_hosts;
ALTER ROLE hub_hosts WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_invitation;
ALTER ROLE hub_invitation WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_operator;
ALTER ROLE hub_operator WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_person;
ALTER ROLE hub_person WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_runtime;
ALTER ROLE hub_runtime WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
ALTER ROLE hub_runtime SET statement_timeout TO '10s';
ALTER ROLE hub_runtime SET idle_in_transaction_session_timeout TO '10s';
GRANT hub_administrators TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
-- The Hub's login switches to a scope role for one transaction and inherits nothing from it.
GRANT hub_company TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_company TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
GRANT hub_hosts TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_invitation TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_invitation TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
GRANT hub_operator TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_operator TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
GRANT hub_person TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_person TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
-- PostgreSQL grants the role that creates hub_runtime (the migration owner) the right to administer it. Neon does the same.
GRANT hub_runtime TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
