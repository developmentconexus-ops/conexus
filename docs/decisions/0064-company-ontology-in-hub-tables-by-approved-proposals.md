# 0064. The company's Ontologia in Hub tables, grown by approved proposals

## Context

Six studies (L21) traced references and ran a real ERP demand. Founder, 2026-11-12:
`"A1 B1 C1"`, `"F1"`, "D Aprovado".

## Decision

- One Ontologia per company, a Hub module like the copies, never inside an app: concepts, fields,
  codes with their meaning, relations, one source per concept with its proving query, proposals and
  revisions, with the row policy [0039]. Names and codes, never values. Not in Knowledge (no typed
  fields) nor Mastra's database [0010].
- `P1`: each element is an immutable version written by a revision; the current one is a view. The
  Hub only inserts, but a proposal's state, an item's decision and the inventory, replaced by run.
- An agent, app or Projeto gets a narrowing slice: read tools generated as data (Twenty's
  `DatabaseToolProvider`), run through the connector's door [0056].
- `B1`: nothing counts before a person approves it by a route (Palantir's proposals). `Q1`: any
  member proposes. The first revision is the owner's (D); `L1`: later ones, a "Conceitos da empresa"
  permission (owner, administrator). `R1`: a proposer may approve; the revision keeps both.
- `F1`: linking a system runs a mechanical inventory (a Mastra workflow, no model); a demand brings
  the proposals. No starter concepts. A weekly cheap-model review only proposes.
- A person's state stays apart from the machine's health (append-only proofs); the machine detects;
  people decide.
- `A1`: after the Sync, before Capacity 4. `M`: apps read concepts after the Builder's harness and
  capacities.

## Consequences

Notebook notes become proposals to prove again; the notebook leaves (D6). Roles, named links and
the flow: [0067]. G4's questions, answered: no learned fact expires for now ("D Por agora não");
people and areas are not concepts (E1a, E1b, E2a, E2b).

## Not decided yet

Health thresholds; write actions bound to concepts; two sources per concept; a cross-company shape.

## Reopens when

Knowledge stores typed, isolated records, or approvals fall behind proposals.

## State

Accepted 2026-11-12; amended 2026-11-12 ("L1", "P1", `M`, "Q1 / R1", G4; [0067]).

[0010]: 0010-mastra-tables-own-database.md
[0039]: 0039-company-scope-and-row-policy-in-the-hub.md
[0056]: 0056-connectors-kit-and-one-executor.md
[0067]: 0067-ontology-metamodel-palantir-core-roles-and-named-links.md
