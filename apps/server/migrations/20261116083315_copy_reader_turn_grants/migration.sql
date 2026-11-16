-- Custom SQL: Drizzle cannot generate a grant (data D5). Every setRoleCopies counts its turn on the
-- role's row, and a failed one reads the count before it puts its marks back.
GRANT SELECT, INSERT ON TABLE copies.copy_reader_turn TO hub_company;
--> statement-breakpoint
GRANT UPDATE(turn) ON TABLE copies.copy_reader_turn TO hub_company;
