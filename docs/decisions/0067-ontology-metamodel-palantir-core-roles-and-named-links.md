# 0067. The Ontologia's metamodel: Palantir's core, roles and named links

## Context

[0064] named neither a role nor a flow. A metamodel study (L21) compared Palantir's documentation
and SDKs, Fabric IQ, OCEL 2.0, SAP and schema.org. Founder, 2026-11-12: "1. Sim" (adopt it as the official
reference), and "não quero criar uma solução fraca pensando especificamente nesse caso de exemplo
que é minha empresa".

## Decision

- The core follows Palantir: object type, property, a link type with two sides, a type's status,
  proposals reviewed like a pull request. A code with its meaning stays ours (Twenty's options shape).
- A role takes one of two forms, both generic. A slice of a base concept (Fabric IQ's single-parent
  inheritance, SAP's business partner role): it declares `base`, keeps the base's key, has its own
  proved read, is proved a subset of the base, and inherits neither the base's read nor its links.
  Or a concept with its own key linked to another (SAP's role with its own data). Which form a
  company uses is the Builder's proposal from that company's data and the approver's decision, never
  a product rule.
- A document's links follow OCEL: each side of a link has a name, which is the role in it, and a
  join may link a concept to itself (Palantir's join table).
- A rule in words stays in the Brain, citing the concept by link ([0065]).
- The business state, its transitions and the flow are the next step, "O fluxo da empresa", drawn as
  Palantir's Machinery and read from the documents as OCEL; nothing about it is stored before then.
- Left out: interfaces, shared properties, value types, type groups, the object database, the SDK's
  query library.

## Consequences

The step card gains `base`, the join's second pairs, the subset proof and four criteria.

## Not decided yet

How the flow shows objects; when an interface earns a second reader.

## Reopens when

Two concept types need one shape, or a company's roles fit neither form.

## State

Accepted 2026-11-12 ("1. Sim"). Amends [0064].

[0064]: 0064-company-ontology-in-hub-tables-by-approved-proposals.md
[0065]: 0065-brain-on-mastra-knowledge-behind-our-isolation.md
