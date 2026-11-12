# 0064. The company's Ontologia in Hub tables, grown by approved proposals

## Context

Four studies (2026-11-11 and 12, outside the repository, L21)
traced Twenty, Budibase, Airbyte, Palantir Foundry and Mastra 1.82. Founder,
2026-11-12: `"A1 B1 C1"`, `"F1"`, "D Aprovado".

## Decision

- One Ontologia per company, in the Hub database: concepts, fields, relations, each source with the
  query that proved it, proposals and immutable revisions, with the company column and row policy
  [0039]. Names and codes, never values. Not in Knowledge (no typed fields) nor in Mastra's database
  [0010].
- An agent, app or Projeto gets a slice that only narrows the company's. Each approved concept
  becomes read tools generated as data (Twenty's `DatabaseToolProvider`), run by the one executor
  [0056]; writes only through a connector's declared write.
- `B1`: nothing counts before a person approves it. Agents propose with a proof; the approval is a
  route, never a prompt (Palantir's proposals). The company's first revision is the owner's (D).
- `F1`: linking a system makes a mechanical inventory (a Mastra workflow, no model, no approval:
  names, types, codes, counts); a proposal is born with a demand, cut by it (HyperAuto, Airbyte's
  catalog, Twenty's "propose less").
- State (a person's: experimental, active, deprecated) stays apart from health (the machine's,
  derived from append-only proof runs). The machine detects; a person decides; nothing is deleted or
  replaced by the machine (Palantir, Airbyte).
- No starter concepts per connector or segment. A weekly review with a cheap model comes after the
  review queue, proposing only.
- `A1`: the Ontologia enters after the Sync, before Capacity 4, whose person-to-seller link becomes a
  person-to-concept link.

## Consequences

The connection notebook becomes the first proofs, then leaves by D6.

## Not decided yet

Columns and failure codes (each card); health thresholds; the actor of a job with no person; write
actions bound to concepts; a shape shared across companies.

## Reopens when

Knowledge stores typed, isolated records, or the approval queue cannot keep pace with proposals.

## State

Accepted 2026-11-12 (`"A1 B1 C1"`, `"F1"`, "D Aprovado").

[0010]: 0010-mastra-tables-own-database.md
[0039]: 0039-company-scope-and-row-policy-in-the-hub.md
[0056]: 0056-connectors-kit-and-one-executor.md
