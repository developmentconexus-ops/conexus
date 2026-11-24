# Documentation map

One line per document.

## Overview

- [AGENTS.md](../AGENTS.md): read first.
- [README.md](../README.md): repo; [VISION.md](../VISION.md): direction.
- [DESIGN.md](../DESIGN.md): Pauta, values, pieces.
- [roadmap.md](roadmap.md): steps.
- [approvals/](approvals/): one per card.
- [architecture.md](architecture.md): design.
- [explanation/](explanation/): [turn](explanation/builder-turn.md), [harness](explanation/harness.md), [app](explanation/app-package.md), [contract](explanation/app-contract-and-dispatcher.md), [Hub](explanation/hub-apps.md), [agents](explanation/agents-and-automations.md), [Sync](explanation/sync.md).
- [how-to/hub-server.md](how-to/hub-server.md): server; [seal keys](how-to/seal-keys.md); [template](how-to/builder-template.md); [connector](how-to/add-a-connector.md), [subject](how-to/add-a-subject.md); [mail](how-to/hub-mail.md).
- [how-to/apps-edge.md](how-to/apps-edge.md): apps' edge, [token, key](how-to/apps-token-and-key.md), [tools](how-to/apps-tools-host.md).
- [how-to/hub-database-restore.md](how-to/hub-database-restore.md): restore; [Git](how-to/hub-git-restore.md).
- [how-to/hub-company-databases.md](how-to/hub-company-databases.md): companies' Neon key; [lab AWS account](how-to/aws-conta-de-laboratorio.md).
- [how-to/local-database.md](how-to/local-database.md): test PostgreSQL 18; [Builder](how-to/builder-builds.md); [CI health](how-to/ci-health.md).
- [how-to/rastro-de-uma-conversa.md](how-to/rastro-de-uma-conversa.md): traces.
- [steps/](steps/): cards; [Data spec](steps/trilhas/dados-spec/README.md).
- [conhecimento/](conhecimento/): decided, proved, read.
- [reference/boundaries.md](reference/boundaries.md): hand-made mechanisms.
- [reference/stack.md](reference/stack.md): sources, skills, traps.
- [reference/checklist.md](reference/checklist.md): checklist.
- [reference/screens.md](reference/screens.md): screens, floors; [prompt](reference/builder-prompt.md).
- Product layer: [concept](explanation/conceito.md), [map](explanation/mapa.md), [journeys](explanation/jornadas.md), [screens](reference/telas.md), [patterns](reference/catalogo.md), [motion](reference/movimento.md).
- [reference/impeccable.md](reference/impeccable.md): files, commands.

## Guides: the rules

- [code](guides/code.md): modules, imports, layers, types, errors, API, outside calls.
- [data](guides/data.md): stores, schema, migrations, database access, apps' data.
- [security](guides/security.md): trust zones, authority, sessions, browser, abuse, secrets, logs.
- [testing](guides/testing.md): test tools, assertions, doubles.
- [delivery](guides/delivery.md): card to use; what the repository keeps.
- [design](guides/design.md): how screens look, move and speak.
- [web](guides/web.md): how the Hub's screens are organized.

## Decisions: one costly choice per file

- [0001](decisions/0001-new-repository-by-transplant.md) transplant; [0002](decisions/0002-typescript-node-24-run-directly.md) TypeScript, Node, React, Vite; [0003](decisions/0003-repository-shape.md) repository shape; [0004](decisions/0004-fastify-for-the-hub.md) Fastify; [0005](decisions/0005-drizzle.md) Drizzle; [0006](decisions/0006-one-program-hub-and-builder.md) one program; [0007](decisions/0007-one-server-compose-tunnel.md) server, Compose, Tunnel; [0008](decisions/0008-neon-as-provider.md) Neon; [0009](decisions/0009-neon-free-plan-database-asleep.md) free plan, sleeping database.
- [0010](decisions/0010-mastra-tables-own-database.md) Mastra's database; [0011](decisions/0011-builder-space-in-hub-database.md) Builder's space; [0012](decisions/0012-company-column-row-policy-later.md) company column; [0013](decisions/0013-who-holds-the-hub-session.md) Hub session; [0014](decisions/0014-better-auth-for-passwords.md) Better Auth; [0015](decisions/0015-where-companies-members-invitations-live.md) company tables; [0016](decisions/0016-closed-sign-up.md) closed sign-up; [0017](decisions/0017-invitation-email-cloudflare.md) invitation e-mail; [0018](decisions/0018-apps-on-workers-for-platforms.md) Workers for Platforms; [0019](decisions/0019-handler-contract.md) handler contract.
- [0020](decisions/0020-one-statement-one-transaction.md) one statement, one transaction; [0021](decisions/0021-one-neon-project-per-company.md) project per company; [0022](decisions/0022-app-logins-as-dispatcher-secrets.md) app logins; [0023](decisions/0023-second-domain-for-apps.md) second domain; [0024](decisions/0024-app-address-one-host-per-app.md) host per app; [0025](decisions/0025-published-apps-stop-with-server.md) apps stop with server; [0026](decisions/0026-release-and-publish-one-act.md) release and publish; [0027](decisions/0027-mastra-builder-engine.md) Mastra engine; [0028](decisions/0028-e2b-build-machine.md) E2B; [0029](decisions/0029-git-on-server-disk.md) Git on disk.
- [0030](decisions/0030-model-accounts-company-and-person.md) old accounts; [0031](decisions/0031-connectors-single-executor.md) connectors; [0033](decisions/0033-own-visual-pieces.md) own visual pieces; [0034](decisions/0034-vitest-for-screen-files.md) Vitest for screens; [0035](decisions/0035-publish-through-a-runner-on-the-server.md) publish by runner; [0036](decisions/0036-runner-token-in-one-call-environment.md) runner token; [0037](decisions/0037-postgresql-18-and-drizzle-1-for-the-hub-database.md) PostgreSQL 18, Drizzle 1.0; [0038](decisions/0038-database-logins-by-sql-checked-by-a-catalog-snapshot.md) SQL logins, catalog; [0039](decisions/0039-company-scope-and-row-policy-in-the-hub.md) row policy.
- [0040](decisions/0040-company-database-through-neon.md) Neon; [0041](decisions/0041-app-session-check-through-workers-vpc.md) Workers VPC; [0042](decisions/0042-cloudflare-token-in-one-call-environment.md) publish token; [0043](decisions/0043-app-logins-derived-from-one-key.md) derived logins; [0044](decisions/0044-release-image-built-on-a-github-hosted-machine.md) hosted image; [0045](decisions/0045-app-reads-by-query-writes-by-one-batch.md) one batch; [0046](decisions/0046-version-worker-first-migrations-in-one-transaction.md) Worker first; [0047](decisions/0047-one-call-limits-in-the-dispatcher.md) call limits; [0048](decisions/0048-company-neon-project-named-by-nickname-and-id.md) Neon; [0049](decisions/0049-model-accounts-keys-sign-ins-queues.md) accounts.
- [0050](decisions/0050-conversation-on-the-agent-controller.md) conversation; [0051](decisions/0051-builder-machine-git-and-copy-in-r2.md) machine; [0052](decisions/0052-one-tracing-path-builder-to-grafana.md) tracing; [0053](decisions/0053-builder-tools-run-without-asking.md) no approval; [0054](decisions/0054-model-defaults-and-served-models.md) defaults; [0055](decisions/0055-apps-on-the-platform-contract.md) contract; [0056](decisions/0056-connectors-kit-and-one-executor.md) connectors kit; [0057](decisions/0057-connections-by-oauth.md) OAuth; [0058](decisions/0058-provider-limits-and-queues.md) limits; [0059](decisions/0059-assistant-machine-reaches-package-registries.md) registries.
- [0060](decisions/0060-openai-subscription-sign-in.md) OpenAI; [0061](decisions/0061-turn-carries-its-activation-as-a-scope.md) scope; [0062](decisions/0062-a-write-declares-its-provider-facts.md) writes; [0063](decisions/0063-copy-models-proof.md) proofs; [0064](decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md) Ontologia; [0065](decisions/0065-brain-on-mastra-knowledge-behind-our-isolation.md) Brain; [0067](decisions/0067-ontology-metamodel-palantir-core-roles-and-named-links.md) metamodel; [0068](decisions/0068-mastra-tracing-in-its-own-database.md) traces; [0069](decisions/0069-connectors-one-source-the-kit.md) sources.
- [0070](decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) lake on AWS; [0071](decisions/0071-connectors-kit-live-copies-singer.md) Singer copies; [0072](decisions/0072-the-lab-aws-account-is-provisional.md) lab account; [0073](decisions/0073-platform-by-cdk-one-stack-per-company.md) CDK, stacks; [0074](decisions/0074-python-for-extraction-in-apps-extraction.md) Python; [0075](decisions/0075-how-the-hub-reaches-aws.md) Hub to AWS; [0076](decisions/0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md) copy task; [0077](decisions/0077-how-a-credential-reaches-the-copy-task.md) run credential; [0078](decisions/0078-how-the-lake-knows-who-reads.md) who reads; [0079](decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md) agent reads the lake.
- [0080](decisions/0080-copy-declared-per-table-raw-appends.md) copy declaration; [0081](decisions/0081-publish-on-the-merge-of-a-release-note.md) note publish; [0082](decisions/0082-the-lake-holds-tables-and-files.md) files.

## Skills

- [conexus-study](../.agents/skills/conexus-study/SKILL.md), [report](../.agents/skills/conexus-study/references/report.md), [proof](../.agents/skills/conexus-study/references/proof.md), [screens](../.agents/skills/conexus-study/references/screens.md), [sources](../.agents/skills/conexus-study/references/sources.md), [lens](../.agents/skills/conexus-study/references/lens.md): study, with its references.
- [conexus-scope](../.agents/skills/conexus-scope/SKILL.md), [card](../.agents/skills/conexus-scope/references/card.md), [pattern card](../.agents/skills/conexus-scope/references/pattern-card.md), [screens](../.agents/skills/conexus-scope/references/screens.md): cards.
- [conexus-build](../.agents/skills/conexus-build/SKILL.md), [bring](../.agents/skills/conexus-build/references/bring.md), [bug](../.agents/skills/conexus-build/references/bug.md), [screen](../.agents/skills/conexus-build/references/screen.md), [brief](../.agents/skills/conexus-build/references/brief.md): building a unit, old code, defects, screens, the brief.
- [conexus-qa](../.agents/skills/conexus-qa/SKILL.md): screens QA.
- [conexus-connector](../.agents/skills/conexus-connector/SKILL.md), [references](../.agents/skills/conexus-connector/references/): connectors.
- [conexus-review](../.agents/skills/conexus-review/SKILL.md), [compare](../.agents/skills/conexus-review/references/compare.md), [screen](../.agents/skills/conexus-review/references/screen.md): a step's review; a screen.
- [conexus-eval](../.agents/skills/conexus-eval/SKILL.md), [rounds](../.agents/skills/conexus-eval/references/rounds.md): evals.
- [conexus-explain](../.agents/skills/conexus-explain/SKILL.md), [outline](../.agents/skills/conexus-explain/references/outline.md): explaining a step.
