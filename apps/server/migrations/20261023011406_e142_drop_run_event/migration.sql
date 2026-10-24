-- contract: step 14.2 reads the conversation from Mastra's thread alone; the journal of events, step 14's own unreleased table, has no reader left (data D6).
DROP POLICY "company_all" ON "builder"."run_event";--> statement-breakpoint
DROP TABLE "builder"."run_event";