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
   names the step's route that reaches it. Fill the failure table for every write the step
   adds, with its ambiguous replies (a cut reply, a 502, a 503) and the client's response; each row
   yields criteria.
4. Design from zero (pstack `poteto-mode`: first principles, subtract before adding). Split the step into units that each end green on their own: a contract lands with its first
   implementer, and a migration that changes the catalog snapshot lands with the unit that owns
   `database-grants.sql`. Shape a contract that crosses a module with pstack `architect` (`arena`
   for competing shapes); else compare two shapes in writing.
   Map every finding and decision of the study to the unit that owns it, or to "Fica de fora" with
   its reason ([card](references/card.md), "O mapa do estudo").
5. Fill the state matrix: each screen's states, and for each contract field who writes and who
   reads it; for a screen, follow [screens](references/screens.md) and [Impeccable's
   rules](../../../docs/reference/impeccable.md). Copy the study's table of parts, every column
   filled, each part new or brought by the study rule ([`conexus-study`](../conexus-study/SKILL.md)).
6. Name, per unit, the one guide beyond [code](../../../docs/guides/code.md) its builder reads; its
   skills come from the rows of `docs/reference/stack.md` for its folders, never from memory.
7. Write the founder's page in Portuguese, one decision at a time, with an example. A guide rule
   the study found resting only on "implemented so" is one of them.
7a. Write each unit's section as its build spec ([card](references/card.md)): its builder reads
   only the card's top tables and that section, so the section holds every file, reference line,
   shape, step and recording the unit needs. One Opus session per unit when the step does not fit
   one context; never the session that will build it.
8. Give the card, at the exact commit the founder will approve, to a reader of another model who
   did not write it, with [the template](references/card.md)'s questions. The reader reads
   the whole card once, opening every cited reference line at the installed version; a later
   commit, as its diff only.

## What it produces

The card in `docs/steps/` ([delivery L24](../../../docs/guides/delivery.md)), from [the
template](references/card.md), in a pull request: whole files are never in it; the start of the
code of a non-obvious step is. Firstmate takes the founder's page to him; he approves only that.

## Stop and ask

- An expensive choice is left without proof: go back to the study. A proof needing the founder's
  accounts may move to a named unit, written as such on his page.
- The sentence of use does not fit a few minutes of the founder's time.
- A unit's spec would need a whole file or a second implementation: split the unit.

## When it closes

The founder approves the page, and the ledger records his words, the date and the commit of the
card ([delivery](../../../docs/guides/delivery.md)).
