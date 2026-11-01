-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 24.2, U2, waiting for the founder's word
-- (data D11; the approval of the step's card, docs/approvals.md): an automation's run tells its owner
-- on the Hub, so a company's routes write a notification, list the person's own and mark them read.
-- Only read_at ever changes; the row leaves by its foreign keys' cascade, so the Hub never deletes it.
GRANT USAGE ON SCHEMA notifications TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE notifications.notification TO hub_company;
--> statement-breakpoint
GRANT UPDATE (read_at) ON TABLE notifications.notification TO hub_company;
