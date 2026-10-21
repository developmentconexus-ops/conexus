-- The approved snapshot of the Hub database: owners, grants, default privileges, database settings
-- (pg_dump --create --schema-only) and every role (pg_dumpall --roles-only --no-role-passwords).
-- catalog.test.ts replaces the test database, owner and superuser names by hub_database, test_owner
-- and test_superuser, and leaves out the two roles of the test harness. Comment lines and blank lines
-- are ignored in the comparison.
ALTER DATABASE hub_database OWNER TO test_owner;
ALTER SCHEMA apps OWNER TO test_owner;
ALTER SCHEMA auth OWNER TO test_owner;
ALTER SCHEMA builder OWNER TO test_owner;
ALTER SCHEMA drizzle OWNER TO test_owner;
ALTER SCHEMA hub OWNER TO test_owner;
ALTER SCHEMA operations OWNER TO test_owner;
ALTER SCHEMA projects OWNER TO test_owner;
-- Step 5, provisional until the founder's word (firstmate, 2026-10-17): the operator's administrator
-- check, one SECURITY DEFINER function owned by a role that cannot log in and reads only the
-- administrators' rows; only hub_operator executes it.
-- Step 9, founder 2026-10-18 ("Tudo A"): the companies that have an app, for the repair at start, one
-- SECURITY DEFINER function owned by a role that cannot log in and reads one column of the apps;
-- only hub_runtime executes it.
ALTER FUNCTION apps.companies_with_apps() OWNER TO hub_app_companies;
ALTER FUNCTION auth.is_installation_administrator(person text) OWNER TO hub_administrators;
-- Step 11, founder 2026-10-19 ("2. a", Grant A): a model account's sealed credential, and the
-- companies that hold one, two SECURITY DEFINER functions owned by a role that cannot log in and
-- reads five columns of the accounts; hub_company executes the first, hub_runtime the second.
ALTER FUNCTION builder.companies_with_seals() OWNER TO hub_model_seals;
ALTER FUNCTION builder.sealed_of(account uuid) OWNER TO hub_model_seals;
-- Step 8, founder 2026-10-17 ("Grant A"): a host's Project and company, one SECURITY DEFINER function
-- owned by a role that cannot log in and reads three columns of the Projects; only hub_runtime
-- executes it.
ALTER FUNCTION projects.project_of_host(label text) OWNER TO hub_hosts;
ALTER TABLE apps.app OWNER TO test_owner;
ALTER TABLE apps.app_session OWNER TO test_owner;
ALTER TABLE apps.app_version OWNER TO test_owner;
ALTER TABLE apps.blob OWNER TO test_owner;
ALTER TABLE apps.handoff OWNER TO test_owner;
ALTER TABLE apps.version_file OWNER TO test_owner;
ALTER TABLE auth.account OWNER TO test_owner;
ALTER TABLE auth.company OWNER TO test_owner;
ALTER TABLE auth.invitation OWNER TO test_owner;
ALTER TABLE auth.member OWNER TO test_owner;
ALTER TABLE auth.rate_limit OWNER TO test_owner;
ALTER TABLE auth.session OWNER TO test_owner;
ALTER TABLE auth."user" OWNER TO test_owner;
ALTER TABLE auth.verification OWNER TO test_owner;
ALTER TABLE builder.company_account_kind OWNER TO test_owner;
ALTER TABLE builder.company_model OWNER TO test_owner;
ALTER TABLE builder.company_model_fallback OWNER TO test_owner;
ALTER TABLE builder.conversation OWNER TO test_owner;
ALTER TABLE builder.conversation_turn OWNER TO test_owner;
ALTER TABLE builder.model_account OWNER TO test_owner;
ALTER TABLE builder.model_account_assignee OWNER TO test_owner;
ALTER TABLE builder.model_account_sign_in OWNER TO test_owner;
ALTER TABLE builder.person_model_default OWNER TO test_owner;
ALTER TABLE drizzle.__drizzle_migrations OWNER TO test_owner;
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO test_owner;
ALTER TABLE hub.starts OWNER TO test_owner;
ALTER TABLE operations.client OWNER TO test_owner;
ALTER TABLE projects.company_database OWNER TO test_owner;
ALTER TABLE projects.project OWNER TO test_owner;
-- Step 12, founder 2026-10-19 ("1. A", decision 0010): the Hub's database lets in its own logins only,
-- so Mastra's login is refused at the door.
REVOKE CONNECT,TEMPORARY ON DATABASE hub_database FROM PUBLIC;
GRANT TEMPORARY ON DATABASE hub_database TO PUBLIC;
GRANT CONNECT ON DATABASE hub_database TO hub_runtime;
GRANT USAGE ON SCHEMA apps TO hub_runtime;
GRANT USAGE ON SCHEMA apps TO hub_company;
GRANT USAGE ON SCHEMA apps TO hub_operator;
GRANT USAGE ON SCHEMA apps TO hub_app_companies;
GRANT USAGE ON SCHEMA auth TO hub_runtime;
-- Step 5 (decision 0039): the four scopes a Hub transaction enters, each with the verbs its routes'
-- commands use; UPDATE on one column where a command only locks a row. Founder's word pending on
-- this list (D11).
GRANT USAGE ON SCHEMA auth TO hub_company;
GRANT USAGE ON SCHEMA auth TO hub_person;
GRANT USAGE ON SCHEMA auth TO hub_invitation;
GRANT USAGE ON SCHEMA auth TO hub_operator;
GRANT USAGE ON SCHEMA auth TO hub_administrators;
GRANT USAGE ON SCHEMA builder TO hub_company;
GRANT USAGE ON SCHEMA builder TO hub_operator;
GRANT USAGE ON SCHEMA builder TO hub_model_seals;
GRANT USAGE ON SCHEMA builder TO hub_runtime;
GRANT USAGE ON SCHEMA drizzle TO hub_runtime;
GRANT USAGE ON SCHEMA hub TO hub_runtime;
GRANT USAGE ON SCHEMA operations TO hub_runtime;
GRANT USAGE ON SCHEMA operations TO hub_operator;
GRANT USAGE ON SCHEMA projects TO hub_company;
GRANT USAGE ON SCHEMA projects TO hub_operator;
GRANT USAGE ON SCHEMA projects TO hub_hosts;
GRANT USAGE ON SCHEMA projects TO hub_runtime;
REVOKE ALL ON FUNCTION apps.companies_with_apps() FROM PUBLIC;
GRANT ALL ON FUNCTION apps.companies_with_apps() TO hub_runtime;
REVOKE ALL ON FUNCTION auth.is_installation_administrator(person text) FROM PUBLIC;
GRANT ALL ON FUNCTION auth.is_installation_administrator(person text) TO hub_operator;
REVOKE ALL ON FUNCTION builder.companies_with_seals() FROM PUBLIC;
GRANT ALL ON FUNCTION builder.companies_with_seals() TO hub_runtime;
REVOKE ALL ON FUNCTION builder.sealed_of(account uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION builder.sealed_of(account uuid) TO hub_company;
REVOKE ALL ON FUNCTION projects.project_of_host(label text) FROM PUBLIC;
GRANT ALL ON FUNCTION projects.project_of_host(label text) TO hub_runtime;
-- Step 9, founder 2026-10-18 ("Tudo A"): a company's routes send, list, put back and delete its apps'
-- versions; the Central, deleting a company, reads and deletes them. The Hub's login reaches none.
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE apps.app TO hub_company;
GRANT SELECT,DELETE ON TABLE apps.app TO hub_operator;
GRANT SELECT(company_id) ON TABLE apps.app TO hub_app_companies;
-- Step 8, founder 2026-10-17 ("Grant A"): the Hub's login writes and redeems app handoffs and
-- sessions, with no scope, as it does the Hub's sessions; it never changes one.
GRANT SELECT,INSERT,DELETE ON TABLE apps.app_session TO hub_runtime;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE apps.app_version TO hub_company;
GRANT SELECT,DELETE ON TABLE apps.app_version TO hub_operator;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE apps.blob TO hub_company;
GRANT SELECT,DELETE ON TABLE apps.blob TO hub_operator;
GRANT SELECT,INSERT,DELETE ON TABLE apps.handoff TO hub_runtime;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE apps.version_file TO hub_company;
GRANT SELECT,DELETE ON TABLE apps.version_file TO hub_operator;
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
-- Step 11, founder 2026-10-19 ("2. a", Grant A): a company's routes link, read, order, change, give
-- and remove its model accounts and set its default model, and never read `sealed`; the Central
-- chooses the company's sign-in kinds.
GRANT SELECT ON TABLE builder.company_account_kind TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE builder.company_account_kind TO hub_operator;
GRANT SELECT,INSERT ON TABLE builder.company_model TO hub_company;
GRANT UPDATE(model) ON TABLE builder.company_model TO hub_company;
GRANT UPDATE(effort) ON TABLE builder.company_model TO hub_company;
-- Step 12, founder 2026-10-19 ("1. A"): a company's routes index their own conversations and their
-- messages' keys, and read and write the automatic switch; the queue marks an account limited and
-- holds a token's refresh. The Hub's login reaches none of them.
GRANT SELECT,INSERT ON TABLE builder.company_model_fallback TO hub_company;
GRANT UPDATE(enabled) ON TABLE builder.company_model_fallback TO hub_company;
GRANT UPDATE(chain) ON TABLE builder.company_model_fallback TO hub_company;
GRANT UPDATE(revision) ON TABLE builder.company_model_fallback TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE builder.conversation TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE builder.conversation_turn TO hub_company;
GRANT INSERT,DELETE ON TABLE builder.model_account TO hub_company;
GRANT SELECT(id) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(id) ON TABLE builder.model_account TO hub_model_seals;
GRANT SELECT(company_id) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(company_id) ON TABLE builder.model_account TO hub_model_seals;
GRANT SELECT(person_id) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(person_id) ON TABLE builder.model_account TO hub_model_seals;
GRANT SELECT(kind) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(provider) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(label),UPDATE(label) ON TABLE builder.model_account TO hub_company;
GRANT SELECT("position"),UPDATE("position") ON TABLE builder.model_account TO hub_company;
GRANT SELECT(state),UPDATE(state) ON TABLE builder.model_account TO hub_company;
GRANT UPDATE(sealed) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(sealed) ON TABLE builder.model_account TO hub_model_seals;
GRANT SELECT(key_id),UPDATE(key_id) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(key_id) ON TABLE builder.model_account TO hub_model_seals;
GRANT SELECT(hint) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(linked_by) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(linked_at) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(revision),UPDATE(revision) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(attempt_key) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(limited_until),UPDATE(limited_until) ON TABLE builder.model_account TO hub_company;
GRANT SELECT(refresh_until),UPDATE(refresh_until) ON TABLE builder.model_account TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE builder.model_account_assignee TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE builder.model_account_sign_in TO hub_company;
GRANT SELECT(company_id) ON TABLE builder.model_account_sign_in TO hub_model_seals;
-- Step 12.3, founder 2026-10-20 ("Tudo A", P1, P4): a person reads, writes and clears their own
-- default model and level; the company's default carries a level an owner or an administrator sets.
GRANT SELECT,INSERT,DELETE ON TABLE builder.person_model_default TO hub_company;
GRANT UPDATE(model) ON TABLE builder.person_model_default TO hub_company;
GRANT UPDATE(effort) ON TABLE builder.person_model_default TO hub_company;
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
-- Step 9, founder 2026-10-18 ("Tudo A"): a company's routes record its database's host, and mark a
-- Projeto being deleted, whose mark the host lookup reads.
GRANT UPDATE(host) ON TABLE projects.company_database TO hub_company;
GRANT SELECT,INSERT,DELETE ON TABLE projects.project TO hub_company;
GRANT SELECT,DELETE ON TABLE projects.project TO hub_operator;
GRANT SELECT(id) ON TABLE projects.project TO hub_hosts;
GRANT SELECT(company_id) ON TABLE projects.project TO hub_hosts;
GRANT SELECT(host_label) ON TABLE projects.project TO hub_hosts;
GRANT UPDATE(deleting_since) ON TABLE projects.project TO hub_company;
GRANT SELECT(deleting_since) ON TABLE projects.project TO hub_hosts;
-- Step 12, founder 2026-10-19 ("1. A", decision 0010): Mastra's database, the same dump of its
-- objects, open to Mastra's login alone, which creates its tables there at start.
ALTER DATABASE mastra_database OWNER TO test_owner;
REVOKE CONNECT,TEMPORARY ON DATABASE mastra_database FROM PUBLIC;
GRANT TEMPORARY ON DATABASE mastra_database TO PUBLIC;
GRANT CREATE,CONNECT ON DATABASE mastra_database TO mastra_runtime;
CREATE ROLE hub_administrators;
ALTER ROLE hub_administrators WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_app_companies;
ALTER ROLE hub_app_companies WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
-- Step 5: the scope roles cannot log in, own nothing and pass no row policy.
CREATE ROLE hub_company;
ALTER ROLE hub_company WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_hosts;
ALTER ROLE hub_hosts WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_invitation;
ALTER ROLE hub_invitation WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
-- Step 11: the owner of builder.sealed_of and builder.companies_with_seals.
CREATE ROLE hub_model_seals;
ALTER ROLE hub_model_seals WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_operator;
ALTER ROLE hub_operator WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_person;
ALTER ROLE hub_person WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE hub_runtime;
ALTER ROLE hub_runtime WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
-- Step 12: Mastra's login, which enters only Mastra's database.
CREATE ROLE mastra_runtime;
ALTER ROLE mastra_runtime WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
ALTER ROLE hub_runtime SET statement_timeout TO '10s';
ALTER ROLE hub_runtime SET idle_in_transaction_session_timeout TO '10s';
ALTER ROLE mastra_runtime SET statement_timeout TO '10s';
ALTER ROLE mastra_runtime SET idle_in_transaction_session_timeout TO '10s';
GRANT hub_administrators TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_app_companies TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
-- The Hub's login switches to a scope role for one transaction and inherits nothing from it.
GRANT hub_company TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_company TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
GRANT hub_hosts TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_invitation TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_invitation TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
GRANT hub_model_seals TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_operator TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_operator TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
GRANT hub_person TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT hub_person TO hub_runtime WITH INHERIT FALSE GRANTED BY test_owner;
-- PostgreSQL grants the role that creates hub_runtime (the migration owner) the right to administer it. Neon does the same.
GRANT hub_runtime TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
GRANT mastra_runtime TO test_owner WITH ADMIN OPTION, INHERIT FALSE, SET FALSE GRANTED BY test_superuser;
