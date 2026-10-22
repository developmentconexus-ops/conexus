-- contract: step 14's own unreleased table: the founder dropped the library gate (2026-10-22, "A"), so no grant is kept; no data of a released version changes (data D6).
DROP POLICY "company_all" ON "builder"."package_grant";--> statement-breakpoint
DROP TABLE "builder"."package_grant";