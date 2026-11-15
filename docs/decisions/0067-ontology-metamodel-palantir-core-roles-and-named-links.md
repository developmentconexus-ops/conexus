# 0067. The Ontologia's metamodel: Palantir's core, roles and named links

## Context

[0064] named neither a role nor a flow. Two studies (L21) compared Palantir's documentation and
SDKs, Fabric IQ, OCEL 2.0, SAP and schema.org, and tested it on six kinds of company.
Founder, 2026-11-12: "1. Sim" (the official reference).

## Decision

- The core follows Palantir: object type, property, a link type with two sides, a type's status,
  proposals reviewed as pull requests. A code with its meaning stays ours (Twenty's options shape).
- A role takes one of two generic forms. A slice of a base concept (Fabric IQ's single-parent
  inheritance, SAP's business partner role): it declares `base`, keeps the base's key, has its own
  proved read, is a proved subset, and inherits neither the base's read nor its links.
  Or a concept with its own key linked to another (SAP's role with its own data). The Builder
  proposes the form from a company's data and the approver decides; never a product rule.
- A document's links follow OCEL: each side of a link has a name, which is the role in it, and a
  join may link a concept to itself (Palantir's join table).
- A rule in words stays in the Brain, citing the concept by link ([0065]).
- The business state, transitions and flow are the next step, "O fluxo da empresa", drawn as
  Palantir's Machinery: a passage is read from the documents as OCEL or from the system's change
  history, one concept may have several flows (a process hierarchy), and each passage states in words
  what moves it. Nothing is stored yet.
- Left out: interfaces, shared properties, value types, type groups, the object database, the SDK's
  query library.

## Consequences

The step card gains roles, second join pairs and the subset proof.

## Not decided yet

How the flow shows objects; when an interface earns a second reader.

## Reopens when

Two concept types need one shape, or a company's roles fit neither form.

## State

Accepted 2026-11-12 ("1. Sim"); amended the same day (change history). Amends [0064].

[0064]: 0064-company-ontology-in-hub-tables-by-approved-proposals.md
[0065]: 0065-brain-on-mastra-knowledge-behind-our-isolation.md
