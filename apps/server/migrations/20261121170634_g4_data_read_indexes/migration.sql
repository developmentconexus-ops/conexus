-- contract: the Registro's page reads newest first by (company, at, id) and its cut by person (R.11); the old (company, at) index is covered by the first
DROP INDEX "data"."data_read_company_at_idx";--> statement-breakpoint
CREATE INDEX "data_read_company_newest_idx" ON "data"."data_read" ("company_id","at" DESC,"id" DESC);--> statement-breakpoint
CREATE INDEX "data_read_person_newest_idx" ON "data"."data_read" ("company_id","person_id","at" DESC,"id" DESC);