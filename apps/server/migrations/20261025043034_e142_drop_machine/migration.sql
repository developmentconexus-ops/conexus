-- contract: nothing reads or writes builder.machine any more (step 14.2, topic 6, M5.1). A conversation's machine is found by its name at the provider and killed by name when the conversation is released, so the table and its policy leave in this one step (data D30: no company data, only machine ids). Needs the founder's word (data D11): the drop takes hub_company's grant on the table with it ("4, confirmo", after "3aproco").
DROP POLICY "company_all" ON "builder"."machine";--> statement-breakpoint
DROP TABLE "builder"."machine";
