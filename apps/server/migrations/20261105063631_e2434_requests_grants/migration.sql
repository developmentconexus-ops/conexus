-- Custom SQL: Drizzle cannot generate a grant (data D5). Step 24.3.4, U2, with the founder's word on
-- the step's card (data D11, "2. Aprovo"): a company's routes read, create and change the state of a
-- request to publish, and read, create and mark read what a request tells. A request leaves by its
-- foreign keys' cascade, never by the Hub, and so does its notice.
GRANT USAGE ON SCHEMA requests TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE requests.request TO hub_company;
--> statement-breakpoint
GRANT UPDATE (state, decided_by, reason) ON TABLE requests.request TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE notifications.request_notice TO hub_company;
--> statement-breakpoint
GRANT UPDATE (read_at) ON TABLE notifications.request_notice TO hub_company;
