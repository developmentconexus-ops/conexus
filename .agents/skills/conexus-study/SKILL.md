---
name: conexus-study
description: "Studies a Conexus roadmap step before its card is written: answers the step's written questions from the libraries' code and the repository's decisions, says for every part whether it is written new or brought from the old code and what it carries, and runs a small proof when a choice is expensive to undo. Use at the start of every step, including one that brings code."
---

# Study

## When to use

At the start of every roadmap step, before `conexus-scope`, including one that brings code: an
entry sheet is input, not answer.

## What it receives

The step's line in [the roadmap](../../../docs/roadmap.md) and its questions; for brought code,
each part's entry sheet and the old code at its frozen commit, read only; for a screen the old
product had, that product run locally at its frozen commit with its own browser-test doubles.

## Steps

1. Write each question in one sentence.
2. Read what the repository decided: [architecture](../../../docs/architecture.md), the subject's
   decision records, the guide [`docs/index.md`](../../../docs/index.md) names for it, and every
   issue `gh issue list --label next-card` prints.
3. Look for the native way first ([code C75](../../../docs/guides/code.md)) for every mechanism and
   every function the step calls, `main`'s included: in the library's, platform's or database's code
   at the installed version, with file and line. List every option a guarantee rests on, with its
   default, and where the library catches, prints or answers an error itself ([code
   C50](../../../docs/guides/code.md)). For a library, follow [library](references/library.md).
   Ask each reference the report's code-shape questions (section 5).
4. For each part the step touches, say whether it is **new** or **brought**, and fill its row and
   its fields in the report's section 9.
4a. For a step that creates or changes a screen, follow [screens](references/screens.md): run the
   old product, capture its states, read [Impeccable's rules](../../../docs/reference/impeccable.md).
5. The study rule, which every other skill cites. A decision whose only basis is "implemented
   so", "only tested so" or "decided before" is dropped, or defended in writing with a reason of its
   own. A part is brought only if it would be written that way from nothing. Its measure: lines
   brought, lines changed until the criteria pass, old tests passing through the public door
   unchanged, and session hours. Past a third of its brought lines changed, it is written new.
6. Say whether a question is an expensive choice: the Builder's engine, where the product runs,
   who holds the session, data isolation, any ready-made piece holding state or identity or running
   third-party code. If so, follow [proof](references/proof.md).
7. Compare two options at least and recommend one, with its basis.
8. Write how to implement, by unit (report section 8). Run the one fact each unit's design rests
   on, against the boundary it is about ([testing T14](../../../docs/guides/testing.md)), with
   pstack `blast-radius` when present; a fact not run is "not proved", and the card does not rest on
   it. List the blast radius with importers, every write the step adds (for the failure table), and
   for each create the ambiguous replies (a cut reply, a 502, a 503) and the client's response.
9. Separate what was seen from a hypothesis; give every claim its source.

## What it produces

A study report with every section of [the template](references/report.md), kept outside the
repository ([delivery L21](../../../docs/guides/delivery.md)); its code-shape conclusions go down
into the card's contracts. For an expensive choice, a decision record "proposed" with its Criterion.

## Stop and ask

- The answer needs a product choice: ask the founder through firstmate, by what a person sees,
  with an example and a recommendation, one question at a time.
- Two references disagree and the choice changes what a person sees.
- A screen whose old design the step does not bring goes to the founder with the shot.
- A guide rule the step must follow rests only on "implemented so": the founder decides before the
  card is approved.

## When it closes

Every report section is filled, every part has its row, every expensive choice has its Result.
