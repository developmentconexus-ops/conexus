-- Custom SQL: Drizzle cannot generate a data migration (data D5). O Sync de qualquer conector, U3: each
-- copy of today gets its one source, its connection with that connection's account, and the pass, its
-- start, its position (the last key written becomes a KEY position) and its watermark as the copy kept
-- them. A second run inserts nothing.
INSERT INTO copies.copy_source (company_id, copy_id, connector_id, connection_id, account_ref, pass, pass_started_at, position, watermark, created_at)
SELECT c.company_id, c.id, c.connector_id, c.connection_id, n.account_ref, c.pass, c.pass_started_at,
  CASE WHEN c.position IS NULL THEN NULL ELSE jsonb_build_object('kind', 'KEY', 'after', c.position) END,
  c.watermark, c.created_at
FROM copies.copy c
JOIN connectors.connection n ON n.company_id = c.company_id AND n.connector_id = c.connector_id AND n.id = c.connection_id
WHERE NOT EXISTS (SELECT 1 FROM copies.copy_source s WHERE s.copy_id = c.id);
