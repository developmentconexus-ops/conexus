# Documentation map

One line per document, with the subject it owns; `check-docs` refuses a document without one.

## Overview

- [AGENTS.md](../AGENTS.md): what every agent reads first; which skill for which stage.
- [README.md](../README.md): what this repository is, for a person, in Portuguese.
- [roadmap.md](roadmap.md): the steps in order, the one in construction, each card's approval and each closed step's use line.
- [architecture.md](architecture.md): the system's goals, context, parts, deployment, crosscutting concepts, risks and debt.
- [how-to/hub-server.md](how-to/hub-server.md): preparing the server; publishing and putting back a Hub version.
- [how-to/hub-database-restore.md](how-to/hub-database-restore.md): como restaurar o banco do Hub a um minuto e conferir.
- [how-to/local-database.md](how-to/local-database.md): the disposable PostgreSQL 18 the server tests need.
- [steps/](steps/): the folder of the step card in construction, empty between steps.

## Guides: the rules

- [code](guides/code.md): modules, imports, layers, types, errors, the API, outside calls, state.
- [data](guides/data.md): stores, schema, migrations, database access, apps' data.
- [security](guides/security.md): trust zones, authority, sessions, browser, abuse, secrets, logs.
- [testing](guides/testing.md): test tools, what a test asserts, doubles.
- [delivery](guides/delivery.md): how a step goes from card to use; what the repository keeps; every ceiling.
- [design](guides/design.md): how screens look, move and speak.
- [web](guides/web.md): how the Hub's screens are organized and call the Hub.

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
- [0030](decisions/0030-model-accounts-company-and-person.md) model accounts.
- [0031](decisions/0031-connectors-single-executor.md) connectors.
- [0032](decisions/0032-data-leaving-brazil-told.md) data leaving Brazil.
- [0033](decisions/0033-own-visual-pieces.md) own visual pieces.
- [0034](decisions/0034-vitest-for-screen-files.md) Vitest for screens.
- [0035](decisions/0035-publish-through-a-runner-on-the-server.md) publish a release through a runner.
- [0036](decisions/0036-runner-token-in-one-call-environment.md) runner token in one call's environment.
- [0037](decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md) PostgreSQL 18 and Drizzle 1.0, proposed.

## Skills

- [conexus-study](../.agents/skills/conexus-study/SKILL.md), with [report](../.agents/skills/conexus-study/references/report.md) and [proof](../.agents/skills/conexus-study/references/proof.md): the study of a step; its report template; a small proof.
- [conexus-scope](../.agents/skills/conexus-scope/SKILL.md), with [card](../.agents/skills/conexus-scope/references/card.md): the step's card and its template.
- [conexus-build](../.agents/skills/conexus-build/SKILL.md), with [bring](../.agents/skills/conexus-build/references/bring.md) and [bug](../.agents/skills/conexus-build/references/bug.md): building a unit; bringing old code; a defect.
- [conexus-review](../.agents/skills/conexus-review/SKILL.md), with [checklist](../.agents/skills/conexus-review/references/checklist.md): the review of a step; questions only a reader answers.
- [conexus-explain](../.agents/skills/conexus-explain/SKILL.md), with [questions](../.agents/skills/conexus-explain/references/questions.md): explaining a design to the founder, in Portuguese.
