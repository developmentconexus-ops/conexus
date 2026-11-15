-- Custom SQL: Drizzle cannot generate a grant (data D5). A pergunta respondida com a origem, U10,
-- with the founder's word of 2026-11-15 ("A1"), in a pull request of its own (data D11): a run closes
-- with its system's message, the alert and follower lists are read, added to and removed from, and a
-- notice of a copy is read, created and marked read. The Hub never deletes a notice; it leaves by
-- cascade. Nothing here reaches `whole` of `copy_run`, nor a column of `copy_notice` but `read_at`.
GRANT UPDATE(system_status) ON TABLE copies.copy_run TO hub_company;
--> statement-breakpoint
GRANT UPDATE(system_code) ON TABLE copies.copy_run TO hub_company;
--> statement-breakpoint
GRANT UPDATE(system_message) ON TABLE copies.copy_run TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE notifications.alert_recipient TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON TABLE notifications.copy_follower TO hub_company;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE notifications.copy_notice TO hub_company;
--> statement-breakpoint
GRANT UPDATE(read_at) ON TABLE notifications.copy_notice TO hub_company;
