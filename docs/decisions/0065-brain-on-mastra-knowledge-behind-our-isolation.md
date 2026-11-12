# 0065. The Brain on Mastra Knowledge, behind our isolation

## Context

The Brain is the company's text for its agents: instructions, rules, what agents learned and a
person reviewed, later documents. Mastra Knowledge 1.82 is alpha and says isolation between scopes
is not guaranteed. The studies of [0064] traced it with n8n, lobe-chat, Dify, Open WebUI and
Palantir. Founder, 2026-11-12: `"A1 B1 C1"`, `"E1"`.

## Decision

- Pages live in Knowledge, from the Assistant's company memory on: scopes `org:`, `ontologia:` (a
  projection the server rebuilds from [0064]), `project:`, `agente:`, `docs:`. Their names are fixed
  by the first card that writes each, since renaming takes `renameScopeDeclaration()`.
- Scopes come only from the server; one module imports Knowledge; its routes are never mounted
  (security S39); attack tests across companies, forged scopes and injected text run at each Mastra
  upgrade (testing T13).
- `B1`: an agent's note for the company waits for review (Knowledge's `contributor` and `editor`); a
  person's own memory counts at once.
- Knowledge keeps no old text: the before and after of each change live in a Hub append-only table,
  and Knowledge is rebuilt from it after a storage schema change.
- `C1`: company documents only with keyword search and those attack tests while Knowledge is alpha.
  `E1`: Conexus redeclares access by folder and area; no source's per-file permissions. Connector data
  never enters the Brain.
- Search by meaning waits for the ten questions of `docs/approvals.md` to fail on keywords.

## Not decided yet

Whether a model's write to company memory at a permitted person's request counts as the person's
write under `B1` (the U9 conflict, raised before U9 builds); document connectors' sign-in [0057];
retention of pages a source deleted.

## Reopens when

Knowledge drops its isolation warning, or a client needs a folder with mixed access (`E2` or `E3`).

## State

Accepted 2026-11-12 (`"A1 B1 C1"`, `"E1"`).

[0057]: 0057-connections-by-oauth.md
[0064]: 0064-company-ontology-in-hub-tables-by-approved-proposals.md
