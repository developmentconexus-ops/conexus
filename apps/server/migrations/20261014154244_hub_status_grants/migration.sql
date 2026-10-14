-- Custom SQL: Drizzle cannot generate a grant (data D5).
GRANT USAGE ON SCHEMA hub TO hub_runtime;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE hub.starts TO hub_runtime;
