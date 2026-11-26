---
name: conexus-connector
description: "The Conexus pattern for connectors: what a connector is, the one-source rule, the kit `@conexus/connectors` piece by piece with the reference each piece follows and where Conexus differs, the live path through the Hub, the lake path the card plans, the steps to add a connector, the review checklist and the known gaps. Use whenever a task adds, rebuilds, changes, studies, scopes or reviews a connector, an operation, a login, a write, a connector skill, a double or anything under `packages/connectors`, even when the task does not say connector."
---

# Connector

## When to use

Any study, card, build or review that touches a connector or the kit. Load it beside the stage
skill ([`conexus-build`](../conexus-build/SKILL.md), [`conexus-review`](../conexus-review/SKILL.md)
or the others); it carries the pattern and the stage skill carries the method.

## What a connector is

A connector is one value of `defineConnector` in `packages/connectors/src/<id>/`: the login, the
operations, the writes, the double and the written part of the skill of one system. The Hub runs
every connector through one executor ([0056](../../../docs/decisions/0056-connectors-kit-and-one-executor.md)),
so a new connector adds a folder and registrations, and no Hub code.

**One source.** The kit is the only place that names a provider
([security S36](../../../docs/guides/security.md),
[0069](../../../docs/decisions/0069-connectors-one-source-the-kit.md)). A provider's id, route,
field, error code or limit never appears in `apps/server`, `apps/web` or a prompt. The live calls
and the lake copy read the same definition
([0071](../../../docs/decisions/0071-connectors-kit-live-copies-singer.md)); Python never
redeclares a system ([0074](../../../docs/decisions/0074-python-for-extraction-in-apps-extraction.md)).

**What is fixed.** Operation ids and the answer `{ linhas, temMais }` are a contract read in five
places ([live](references/live.md)). The founder kept them on 2026-11-24: "Okay, vamos manter então
e continuar o desenvolvimento". Never rename an id or reshape the answer.

## Read in this order

1. [kit](references/kit.md): each piece of `packages/connectors/src/kernel/`, its reference at a
   commit and line, and the difference.
2. [live](references/live.md): the executor, the Assistant, the Builder, published apps, saved
   tools, writes with the approval card, and the five-place contract.
3. [lake](references/lake.md): the table declaration, the Singer adapter and the copy task.
4. [add](references/add.md): the steps to add a connector, from the folder to the docs.
5. [checklist](references/checklist.md): what a review of connector work applies.
6. [gaps](references/gaps.md): what the kit lacks for the next connectors, and where each piece
   gets built.

A build reads 1, 2 and 4, and 3 when the card declares tables. A review reads 5 and the parts it
names. A study or card reads 6 before it promises a system.

## Rules that decide most cases

- Build from `mercado-livre/` and `sankhya/`, the two folders in the pattern. `hubspot/` (reads and a
  note on a contact) still has the shape from before the rebuild.
- Record every provider shape from the real service with invented values; never type one
  ([testing T29](../../../docs/guides/testing.md), [security S40](../../../docs/guides/security.md)).
- A credential is `EXCLUSIVE` until a measurement proves it `SHAREABLE`
  ([0077](../../../docs/decisions/0077-how-a-credential-reaches-the-copy-task.md)).
- A write declares what only its provider knows
  ([0062](../../../docs/decisions/0062-a-write-declares-its-provider-facts.md)), and a person
  approves it.
- A piece the kit lacks enters with the first connector that needs it, on that connector's card,
  in the kit and named for no provider ([gaps](references/gaps.md)).

## Stop and ask

- The system needs a kit piece no card names, such as a second origin or a certificate.
- The class of the credential is unmeasured and something would treat it as shareable.
- A read or write would need the Hub to know a provider fact.
- A recording cannot be made without the founder's access.

Stop means no more code: report the evidence to whoever runs the stage.
