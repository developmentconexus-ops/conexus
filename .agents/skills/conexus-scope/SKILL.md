---
name: conexus-scope
description: "Writes the card of a Conexus roadmap step from the study's answer: the founder's page with what he will do at the end and only his real decisions, the use script, units, acceptance criteria observable from outside, and the study's reference table with each row's unit. Use after the study of a step and before any build."
---

# Scope

## When to use

After [`conexus-study`](../conexus-study/SKILL.md) answered the step's questions, in the same
planning session, never the builder's.

## What it receives

The step's line in [the roadmap](../../../docs/roadmap.md), [the vision](../../../VISION.md), the
study's answers and reference table, [architecture](../../../docs/architecture.md), and the guide
each unit will need.

## Steps

1. Write the sentence of use first and the use script: three to six actions, as a person
   sees them, done by the founder on the cloud installation without a terminal (a vendor's
   console is not one).
2. List what enters and stays out, and why. Estimate each unit's changed lines; past
   the budget of [delivery L2](../../../docs/guides/delivery.md), split the step before the build.
3. Write the acceptance criteria, each observable from outside, refusals included; each refusal
   names the step's route that reaches it. Fill the failure table for every write the step
   adds, with its ambiguous replies and the client's response; each row
   yields criteria.
4. Design from zero (pstack `poteto-mode`). Split the step into units that each end green on their
   own, grouped into pull requests by [delivery L9](../../../docs/guides/delivery.md), usually two
   or three units each: a contract lands with its first implementer, and a migration that changes
   the catalog snapshot lands with the unit that owns `database-grants.sql`.
   Shape a contract that crosses a module with pstack `architect` (`arena` if shapes compete);
   else compare two shapes in writing. Copy the study's reference table and give every row its unit,
   or "fica de fora" with its reason, and its new file ([card](references/card.md)). A row
   without a traced reference goes back to the study; a row departing from its references follows
   [delivery L28](../../../docs/guides/delivery.md).
5. Fill the state matrix: each screen's states, and for each contract field who writes and
   reads it; for a screen, follow [screens](references/screens.md) and [Impeccable's
   rules](../../../docs/reference/impeccable.md), and list its `ui/` pieces, each new one with its
   reference row ([design V62](../../../docs/guides/design.md)). A brought part passes the study's rule.
6. Name, per unit, the one guide beyond [code](../../../docs/guides/code.md) its builder reads; its
   skills come from the `docs/reference/stack.md` rows for its folders, and
   the reference lines it follows.
7. Write the founder's page in Portuguese, as [the template](references/card.md) says: what he
   will do at the end, the vision's lines it serves and only his real decisions. An amendment
   rewrites the page, listing what changed; his words go to the card's file in `docs/approvals/`.
7a. Write each unit's section as its build spec ([card](references/card.md)): its builder reads
   only its unit's top-table rows and that section, so the section lists its reference table rows and
   holds every file, reference line, shape and recording the unit needs, with its order of the work
   in the template's form, each step citing its criteria. One Opus session per unit when the step
   does not fit one context; never the session that will build it.
8. Give the card, at the exact commit the founder will approve, to a reader of another model who
   did not write it, with [the template](references/card.md)'s questions. The reader reads
   the whole card once before any build.

## What it produces

The card in `docs/steps/` ([delivery L24](../../../docs/guides/delivery.md)), from [the
template](references/card.md), in a pull request.

## Stop and ask

- An expensive choice lacks proof: back to the study. A proof needing the founder's
  accounts may move to a named unit, written as such on his page.
- The sentence of use does not fit a few minutes of the founder's time.
- A unit's spec would need a whole file or a second implementation: split the unit.

## When it closes

The founder approves the page, recorded as [delivery L6](../../../docs/guides/delivery.md) says.
