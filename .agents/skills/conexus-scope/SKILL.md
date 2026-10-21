---
name: conexus-scope
description: "Writes the card of a Conexus roadmap step from the study's answer: the founder's page with what he will do at the end, the use script, units, acceptance criteria observable from outside, and for every brought part where it lands and which old decisions it carries. Use after the study of a step and before any build."
---

# Scope

## When to use

After [`conexus-study`](../conexus-study/SKILL.md) answered the step's questions, in the same
planning session; never by the session that will build the step.

## What it receives

The step's line in [the roadmap](../../../docs/roadmap.md), the study's answers and parts table, [architecture](../../../docs/architecture.md), and the guide each unit will need.

## Steps

1. Write first the sentence of use and the use script: three to six actions, written as what a
   person sees, done by the founder on the cloud installation without a terminal (a vendor's
   console is not one).
2. List what enters and what stays out, and why. Estimate each unit's changed lines; past the budget
   of [delivery L2](../../../docs/guides/delivery.md), split the step before the build.
3. Write the acceptance criteria, each observable from outside, refusals included; each refusal
   names the route of this step that reaches it. Fill the failure table for every write the study
   listed; each row yields criteria.
4. Split the step into units that each end green on their own: a contract lands with its first
   implementer, and a migration that changes the catalog snapshot lands with the unit that owns
   `database-grants.sql`. Units that share no folder may run in parallel. For each unit write the
   blast radius (its folders, with who imports or calls them, and the owner of each contract it
   creates), the contracts it creates by signature and the shape of each state, id, shared fact and
   outside input ([card](references/card.md)); use pstack `architect`, and `arena` for competing
   shapes, when a contract crosses a module, else compare two shapes in writing. Add the order of
   the work with guide rules by identifier and the study's library functions and options at the
   installed version, and each criterion's test with its level.
5. Fill the state matrix: each screen's states, and for each contract field who writes and who
   reads it; for a screen, follow [screens](references/screens.md) and [Impeccable's
   rules](../../../docs/reference/impeccable.md). Copy the study's table of parts into the card.
   Every part is new or brought, by the study rule ([`conexus-study`](../conexus-study/SKILL.md)
   step 5). A brought part has its file in the new tree, what is refactored as it enters, the
   study's count of changed lines (past a third, it is new), and each old decision it carries, with
   its basis.
6. Name, per unit, the one guide beyond [code](../../../docs/guides/code.md) its builder reads, and
   the maintainers' skills it loads.
7. Write the founder's page in Portuguese, one decision at a time, with an example. A guide rule
   the study found resting only on "implemented so" is one of them.
8. Give the card to a reader of another model, who did not write it, at the exact commit the founder
   will approve, with the reader's questions of [the template](references/card.md). The reader reads
   the whole card once; a later commit, as its diff only.

## What it produces

The card in `docs/steps/`, within its ceiling ([delivery L24](../../../docs/guides/delivery.md)),
from [the template](references/card.md), in a pull request, never with function bodies or full
code. Firstmate takes the founder's page to him.

## Stop and ask

- An expensive choice is left without proof: go back to the study. A proof needing the founder's
  accounts may move to a named unit, written as such on his page.
- The sentence of use does not fit a few minutes of the founder's time.
- The card would need function bodies, full code or a second implementation: it names files,
  signatures and rules; the build writes the code.

## When it closes

The founder approves the page, and the roadmap records his words, the date and the commit of the
card ([delivery](../../../docs/guides/delivery.md)).
