-- Custom SQL: Drizzle cannot generate a role or a grant (data D5). The four scopes a Hub transaction
-- enters (decision 0039): none logs in, owns anything or passes a row policy; the Hub's login only
-- switches to one for a transaction, and inherits nothing from it.
-- Roles belong to the whole server and tests create many databases on one, so an existing role is
-- kept, and the attributes its owner may set are applied either way.
DO $$
DECLARE
  scope text;
BEGIN
  FOREACH scope IN ARRAY ARRAY['hub_company', 'hub_person', 'hub_invitation', 'hub_operator'] LOOP
    BEGIN
      EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE NOBYPASSRLS',
        scope);
    EXCEPTION WHEN duplicate_object OR unique_violation THEN
      NULL;
    END;
    EXECUTE format('ALTER ROLE %I NOLOGIN NOINHERIT NOCREATEDB NOCREATEROLE', scope);
  END LOOP;
END
$$;
--> statement-breakpoint
GRANT hub_company, hub_person, hub_invitation, hub_operator TO hub_runtime WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
GRANT USAGE ON SCHEMA auth TO hub_company, hub_person, hub_invitation, hub_operator;
--> statement-breakpoint
GRANT USAGE ON SCHEMA operations TO hub_operator;
--> statement-breakpoint
-- COMPANY, a company's routes: reads its company, members and people; invites, cancels and renews.
-- UPDATE on the company, a member, a person and a session is the row lock each command takes.
GRANT SELECT, UPDATE ON TABLE auth.company, auth.member TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE auth.invitation TO hub_company;
--> statement-breakpoint
GRANT SELECT, UPDATE ON TABLE auth."user", auth.session TO hub_company;
--> statement-breakpoint
-- PERSON, the person's companies and the pace of what they sent: reads only.
GRANT SELECT ON TABLE auth.company, auth.member, auth.invitation, auth."user" TO hub_person;
--> statement-breakpoint
-- INVITATION, the invitation's link: reads it, sets the password, declines or accepts. Accepting
-- adds the member and points the session at the company; the password creates the person, their
-- credential and one-use link, and signs them in.
GRANT SELECT, UPDATE ON TABLE auth.company TO hub_invitation;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE auth.member TO hub_invitation;
--> statement-breakpoint
GRANT SELECT, UPDATE ON TABLE auth.invitation TO hub_invitation;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE auth."user", auth.session TO hub_invitation;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE auth.account TO hub_invitation;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE auth.verification TO hub_invitation;
--> statement-breakpoint
-- OPERATOR, the Operations Central: registers, corrects and deletes a client and its company, and
-- invites its first owner. Only this role deletes a company, its members and invitations, and a
-- client (step 5, Q6).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auth.company, auth.invitation TO hub_operator;
--> statement-breakpoint
GRANT SELECT, DELETE ON TABLE auth.member TO hub_operator;
--> statement-breakpoint
GRANT SELECT, UPDATE ON TABLE auth."user" TO hub_operator;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE operations.client TO hub_operator;
