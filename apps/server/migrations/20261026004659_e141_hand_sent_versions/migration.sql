-- Custom SQL, the founder's call 2 on the version numbers of step 14.1 (2026-10-25, "Dcisão 2
-- Apaga tudo"): the versions sent by hand from the Versões tab, which carry no Builder number and
-- whose numbers a Builder version could meet, leave. Every version before 14.1's release was sent
-- by hand, so every one goes: no app points at one any more, and each is marked for the prune,
-- which the repair at start runs, removing its Worker before its rows, files and bytes. The form
-- stays (data D6). A rollback does not bring them back; the addresses show the example app until
-- the Projeto's next Builder turn.
UPDATE apps.app SET live_version_id = NULL, sending_version_id = NULL, claimed_until = NULL
WHERE live_version_id IS NOT NULL OR sending_version_id IS NOT NULL;
--> statement-breakpoint
UPDATE apps.app_version SET state = 'pruning' WHERE state <> 'pruning';
