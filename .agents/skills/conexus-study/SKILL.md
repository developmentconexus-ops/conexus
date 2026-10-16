---
name: conexus-study
description: "Studies a Conexus roadmap step before its card is written: answers the step's written questions from the libraries' code and the repository's decisions, says for every part whether it is written new or brought from the old code and what it carries, and runs a small proof when a choice is expensive to undo. Use at the start of every step, including one that brings code."
---

# Study

## When to use

At the start of every roadmap step, before `conexus-scope`, including one that brings code: the
Hub study's entry sheet is its input, not its answer.

## What it receives

The step's line in [the roadmap](../../../docs/roadmap.md) and its questions; for brought code,
each part's entry sheet from firstmate and the old code at its frozen commit, read only.

## Steps

1. Write each question in one sentence.
2. Read what the repository decided: [architecture](../../../docs/architecture.md), the
   decision records of the subject, the guide [`docs/index.md`](../../../docs/index.md) names
   for it, and every open issue `gh issue list --label next-card` prints.
3. Look for the native way first ([code C75](../../../docs/guides/code.md)) for every mechanism, a
   machine a guide requires included, and every function the step calls, code already on `main`
   included: in the library's, platform's or database's code, at the installed version, with file
   and line. List every option a guarantee rests on, with its default,
   and where the library catches, prints or answers an error by itself ([code
   C50](../../../docs/guides/code.md)).
4. For each part the step touches, say whether it is **new** or **brought**, and fill its row and
   its fields in the report's section 9.
5. The study rule, which every other skill cites. A decision whose only basis is "implemented
   so", "only tested so" or "decided before" is dropped, or defended in writing with a reason of its
   own. A part is brought only if it would be written that way from nothing. Its measure: lines
   brought, lines changed until the criteria pass, old tests passing through the public door
   unchanged, and session hours. When its changed lines pass a third of its brought lines, it is
   written new.
6. Say whether a question is on the list of expensive choices: the Builder's engine, where the
   product runs, who holds the session, data isolation, and any ready-made piece that holds state
   or identity or runs third-party code. If it is, follow [proof](references/proof.md).
7. Compare at least two options and recommend one, with its basis in words.
8. Write how to implement, by unit, as the report's section 8 asks. Prove by running the one fact
   each unit's design rests on, against the boundary the claim is about ([testing
   T14](../../../docs/guides/testing.md)), with pstack `blast-radius` when present; a fact not run is listed as not proved, and the card does not rest
   on it. List the blast radius with each file's importers, and every write the step adds, its own
   or a library's, for the card's failure table, and for each create the ambiguous network
   replies (a cut reply, a 502, a 503) and what the client does with each.
9. Separate what was seen from a hypothesis, and give every claim its source.

## What it produces

A study report with every section of [the template](references/report.md), within its ceiling,
for the planning session, kept outside the repository ([delivery
L22](../../../docs/guides/delivery.md)). For an expensive choice, a decision record in state
"proposed" with its Criterion.

## Stop and ask

- The answer needs a product choice: put it to the founder through firstmate, by what a person
  sees, with an example and a recommendation, one question at a time.
- Two references disagree and the choice changes what a person sees.
- A guide rule the step must follow rests only on "implemented so": the founder decides it before
  the card is approved.

## When it closes

Every section of the report is filled, every part has its row, and every expensive choice has its
Result against its Criterion.
