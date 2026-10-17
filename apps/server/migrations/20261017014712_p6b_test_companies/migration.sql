-- Custom SQL, and the one exception to data D6, the founder's answer B to step 4.2's question P6
-- (2026-10-16): the companies created before the Operations Central, those with no row in
-- operations.client, leave with their members and invitations, and no session keeps one active.
-- People, accounts and sessions stay. A rollback does not bring them back.
DELETE FROM auth.invitation AS invitation
WHERE NOT EXISTS (SELECT 1 FROM operations.client WHERE client.company_id = invitation.company_id);
--> statement-breakpoint
DELETE FROM auth.member AS member
WHERE NOT EXISTS (SELECT 1 FROM operations.client WHERE client.company_id = member.company_id);
--> statement-breakpoint
UPDATE auth.session AS session SET active_organization_id = NULL
WHERE session.active_organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM operations.client WHERE client.company_id = session.active_organization_id
  );
--> statement-breakpoint
DELETE FROM auth.company AS company
WHERE NOT EXISTS (SELECT 1 FROM operations.client WHERE client.company_id = company.id);
