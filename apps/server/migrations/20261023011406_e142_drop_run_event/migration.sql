-- contract: step 14.2 reads the conversation from Mastra's thread alone; the journal of events, the table step 13 made, whose rows are test runs and no company's data (data D30), has no reader left (data D6).
DROP POLICY "company_all" ON "builder"."run_event";--> statement-breakpoint
DROP TABLE "builder"."run_event";