---
name: conexus-scope
description: "Writes the card of a Conexus roadmap step from the study's answer: the founder's page with what he will do at the end, the use script, units, acceptance criteria observable from outside, and for every brought part where it lands and which old decisions it carries. Use after the study of a step and before any build."
---

# Scope

## When to use

After [`conexus-study`](../conexus-study/SKILL.md) answered the step's questions, in the same
planning session. Never by the session that will build the step.

## What it receives

The step's line in [the roadmap](../../../docs/roadmap.md), the study's answers and its table of
parts, [architecture](../../../docs/architecture.md), and the guide each unit will need.

## Steps

1. Write first the sentence of use and the use script: three to six actions, written as what a
   person sees, done by the founder on the cloud installation without a terminal; a vendor's
   console, such as Neon's, is not a terminal.
2. List what enters and what stays out, and why.
3. Write the acceptance criteria, each observable from outside, with the refusals included; each
   refusal names the route of this step that reaches it. Fill the template's failure table for every
   write the study listed; each row is a criterion.
4. Split the step into units that each end green on their own: a contract lands with its first
   implementer, and a migration that changes the catalog snapshot lands with the unit that owns
   `database-grants.sql`. Name the folders of each; units that share no folder may run in
   parallel. For each unit write the blast radius (each file created, changed or deleted, and who
   imports or calls it), the contracts it creates by signature only (with pstack `architect`, and
   `arena` for competing shapes, when a contract crosses a module; without pstack, compare two shapes
   in writing), the order of the work with the
   guide rules by identifier and the library functions and options the study listed, at the
   installed version, and the test of
   each criterion with its level.
5. Copy the study's table of parts into the card. Every part is new or brought, by the study rule
   ([`conexus-study`](../conexus-study/SKILL.md) step 5). A brought part has the file of the new
   tree where it lands, what is refactored as it enters, the study's count of the lines that
   refactor changes (past a third, the part is new), and each old decision it carries with its basis
   in words.
6. Check that no expensive choice is left without its proof. A proof that needs the founder's
   accounts may move to a named unit, written as such on the founder's page.
7. Name, for each unit, the one guide beyond [code](../../../docs/guides/code.md) its builder reads,
   and the maintainers' skills it loads.
8. Write the founder's page in Portuguese, one decision at a time, with an example. A guide rule
   the study found resting only on "implemented so" is one of them.
9. Give the card to a reader of another model, who did not write it, at the exact commit the founder
   will approve, with the reader's questions of [the template](references/card.md); a later commit
   of the card is read again before it reaches him.

## What it produces

The card in `docs/steps/`, within its ceiling ([delivery L24](../../../docs/guides/delivery.md)),
from [the template](references/card.md), in a pull request. It never carries function bodies or full
code. Firstmate takes its founder's page to him.

## Stop and ask

- An expensive choice is left without proof: go back to the study.
- The sentence of use does not fit something the founder can do in a few minutes.
- The card would need function bodies, full code or a second implementation: the card names
  files, signatures and rules, and the build writes the code.

## When it closes

The founder approves the page, and the roadmap records his words, the date and the commit of the
card ([delivery](../../../docs/guides/delivery.md)).
