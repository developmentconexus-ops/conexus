-- contract: nothing writes or reads builder.conversation_turn any more; Mastra receives the sent message since M2 (step 14.2), so the table and its policy leave in this one step (data D30: no company data, only message keys). Needs the founder's word (data D11): the drop takes hub_company's grant on the table with it ("Pode", 2026-10-25, asked whether the old turns table could be deleted).
DROP POLICY "company_all" ON "builder"."conversation_turn";--> statement-breakpoint
DROP TABLE "builder"."conversation_turn";
