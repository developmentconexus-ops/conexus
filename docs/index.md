# Documentation map

One line per document (`check-docs`).

## Overview

- [AGENTS.md](../AGENTS.md): what every agent reads first; skill per stage.
- [README.md](../README.md): this repository.
- [roadmap.md](roadmap.md): steps in order, approvals, use lines.
- [architecture.md](architecture.md): goals, parts, deployment, risks, debt.
- [how-to/hub-server.md](how-to/hub-server.md): the server; publishing and rolling back the Hub; [seal keys](how-to/seal-keys.md).
- [how-to/apps-edge.md](how-to/apps-edge.md): the apps' edge, [token and key](how-to/apps-token-and-key.md).
- [how-to/hub-mail.md](how-to/hub-mail.md): the mail token and addresses.
- [how-to/hub-database-restore.md](how-to/hub-database-restore.md): restaurar o banco do Hub.
- [how-to/hub-company-databases.md](how-to/hub-company-databases.md): companies' Neon key.
- [how-to/local-database.md](how-to/local-database.md): the disposable PostgreSQL 18 for tests.
- [steps/](steps/): the card in construction.
- [reference/boundaries.md](reference/boundaries.md): each mechanism Conexus writes over its library's.
- [reference/components.md](reference/components.md): screen pieces and their tokens (design V23).
- [reference/checklist.md](reference/checklist.md): questions for readers.
- [reference/screens.md](reference/screens.md): each screen and its floor.
- [reference/impeccable.md](reference/impeccable.md): Impeccable's files and commands.

## Guides: the rules

- [code](guides/code.md): modules, imports, layers, types, errors, API, outside calls.
- [data](guides/data.md): stores, schema, migrations, database access, apps' data.
- [security](guides/security.md): trust zones, authority, sessions, browser, abuse, secrets, logs.
- [testing](guides/testing.md): test tools, assertions, doubles.
- [delivery](guides/delivery.md): how a step goes from card to use; what the repository keeps.
- [design](guides/design.md): how screens look, move and speak.
- [web](guides/web.md): how the Hub's screens are organized.

## Decisions: one choice expensive to undo per file

- [0001](decisions/0001-new-repository-by-transplant.md) transplant.
- [0002](decisions/0002-typescript-node-24-run-directly.md) TypeScript, Node, React, Vite.
- [0003](decisions/0003-repository-shape.md) repository shape.
- [0004](decisions/0004-fastify-for-the-hub.md) Fastify.
- [0005](decisions/0005-drizzle.md) Drizzle.
- [0006](decisions/0006-one-program-hub-and-builder.md) one program.
- [0007](decisions/0007-one-server-compose-tunnel.md) server, Compose, Tunnel.
- [0008](decisions/0008-neon-as-provider.md) Neon.
- [0009](decisions/0009-neon-free-plan-database-asleep.md) free plan, sleeping database.
- [0010](decisions/0010-mastra-tables-own-database.md) Mastra's database.
- [0011](decisions/0011-builder-space-in-hub-database.md) Builder's space.
- [0012](decisions/0012-company-column-row-policy-later.md) company column.
- [0013](decisions/0013-who-holds-the-hub-session.md) Hub session, reopened.
- [0014](decisions/0014-better-auth-for-passwords.md) Better Auth.
- [0015](decisions/0015-where-companies-members-invitations-live.md) company tables, reopened.
- [0016](decisions/0016-closed-sign-up.md) closed sign-up.
- [0017](decisions/0017-invitation-email-cloudflare.md) invitation e-mail.
- [0018](decisions/0018-apps-on-workers-for-platforms.md) Workers for Platforms.
- [0019](decisions/0019-handler-contract.md) handler contract.
- [0020](decisions/0020-one-statement-one-transaction.md) one statement, one transaction.
- [0021](decisions/0021-one-neon-project-per-company.md) project per company.
- [0022](decisions/0022-app-logins-as-dispatcher-secrets.md) app logins.
- [0023](decisions/0023-second-domain-for-apps.md) second domain.
- [0024](decisions/0024-app-address-one-host-per-app.md) host per app.
- [0025](decisions/0025-published-apps-stop-with-server.md) apps stop with server.
- [0026](decisions/0026-release-and-publish-one-act.md) release and publish.
- [0027](decisions/0027-mastra-builder-engine.md) Mastra engine.
- [0028](decisions/0028-e2b-build-machine.md) E2B.
- [0029](decisions/0029-git-on-server-disk.md) Git on disk.
- [0030](decisions/0030-model-accounts-company-and-person.md) old accounts.
- [0031](decisions/0031-connectors-single-executor.md) connectors.
- [0032](decisions/0032-data-leaving-brazil-told.md) data leaving Brazil.
- [0033](decisions/0033-own-visual-pieces.md) own visual pieces.
- [0034](decisions/0034-vitest-for-screen-files.md) Vitest for screens.
- [0035](decisions/0035-publish-through-a-runner-on-the-server.md) publish by runner.
- [0036](decisions/0036-runner-token-in-one-call-environment.md) runner token.
- [0037](decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md) PostgreSQL 18, Drizzle 1.0.
- [0038](decisions/0038-database-logins-by-sql-checked-by-a-catalog-snapshot.md) SQL logins, catalog.
- [0039](decisions/0039-company-scope-and-row-policy-in-the-hub.md) row policy.
- [0040](decisions/0040-company-database-through-neon.md) Neon.
- [0041](decisions/0041-app-session-check-through-workers-vpc.md) Workers VPC.
- [0042](decisions/0042-cloudflare-token-in-one-call-environment.md) publish token.
- [0043](decisions/0043-app-logins-derived-from-one-key.md) derived logins.
- [0044](decisions/0044-release-image-built-on-a-github-hosted-machine.md) hosted image.
- [0045](decisions/0045-app-reads-by-query-writes-by-one-batch.md) one batch.
- [0046](decisions/0046-version-worker-first-migrations-in-one-transaction.md) Worker first.
- [0047](decisions/0047-one-call-limits-in-the-dispatcher.md) call limits.
- [0048](decisions/0048-company-neon-project-named-by-nickname-and-id.md) Neon name.
- [0049](decisions/0049-model-accounts-keys-sign-ins-queues.md) accounts.
- [0050](decisions/0050-conversation-on-the-agent-controller.md) conversation.
- [0052](decisions/0052-one-tracing-path-builder-to-grafana.md) one tracing path.
- [0053](decisions/0053-builder-tools-run-without-asking.md) tools without asking.

## Skills

- [conexus-study](../.agents/skills/conexus-study/SKILL.md), with [report](../.agents/skills/conexus-study/references/report.md), [proof](../.agents/skills/conexus-study/references/proof.md), [screens](../.agents/skills/conexus-study/references/screens.md), [library](../.agents/skills/conexus-study/references/library.md): the study; report; proof; screens; libraries.
- [conexus-scope](../.agents/skills/conexus-scope/SKILL.md), with [card](../.agents/skills/conexus-scope/references/card.md), [screens](../.agents/skills/conexus-scope/references/screens.md): the card; a screen's card.
- [conexus-build](../.agents/skills/conexus-build/SKILL.md), with [bring](../.agents/skills/conexus-build/references/bring.md) and [bug](../.agents/skills/conexus-build/references/bug.md), [screen](../.agents/skills/conexus-build/references/screen.md): building a unit; old code; a defect; a screen.
- [conexus-qa](../.agents/skills/conexus-qa/SKILL.md): QA of a step's screens.
- [conexus-review](../.agents/skills/conexus-review/SKILL.md), [screen](../.agents/skills/conexus-review/references/screen.md): the review of a step; a screen.
- [conexus-explain](../.agents/skills/conexus-explain/SKILL.md), with [questions](../.agents/skills/conexus-explain/references/questions.md), [outline](../.agents/skills/conexus-explain/references/outline.md): explaining a step to the founder.
