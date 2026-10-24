-- contract: step 14.2 reads the conversation from Mastra's thread alone; the journal of events, made in step 13 (20261021045259_e13_runs_machine), has no reader left (data D6).
DROP POLICY "company_all" ON "builder"."run_event";--> statement-breakpoint
DROP TABLE "builder"."run_event";