---
name: conexus-study
description: "Studies a Conexus roadmap step before its card: writes the reference table, one row per piece the use script touches, with main's file, how the references do it at the versions Conexus installs, and a verdict nativo, embrulhado or remendo; runs the references and records their native shapes; tests the repository's own decisions against them; recommends what they converge on. Use at the start of every step, including one that brings code."
---

# Study

## When to use

At the start of every roadmap step, before `conexus-scope`. Entry
sheets, decisions and today's code are input to test.

## What it receives

The step's line in [the roadmap](../../../docs/roadmap.md), the founder's words, the base commit;
for brought code, the entry sheets and the old code at its frozen commit.

## Steps

1. Write each question as what a person sees, one sentence, with its premise.
2. **The reference table** ([report](references/report.md), section 3; verdicts by
   [code C75](../../../docs/guides/code.md)). One row per piece the use script touches. Fill
   "Hoje no main" first: every file of `main` the use script runs through, inherited ones included.
   Then "Referência": three to six closest analogs (for the AI build flow, AI app builders first),
   the library's own products, the native feature and the old product, read at the installed
   version ([sources](references/sources.md)), with the options a guarantee rests on, their
   defaults, and the errors the library handles itself (code C50). Name where you searched; "none
   found" counts only with that list.
3. **Run** the old product for anything it did, and one reference wherever the step changes what a
   person sees; a screen follows [screens](references/screens.md). A one-way door gets a
   [proof](references/proof.md). For every stream, stored row or tool result of a library that the
   step's code will read, run the native flow once and keep what it emits, with `npm run record`
   ([testing T26](../../../docs/guides/testing.md)).
4. **Verdicts.** Each row nativo, embrulhado or remendo. A remendo row without its proof goes back
   to research, never to the founder as theory.
5. **Then the repository.** Read [architecture](../../../docs/architecture.md), the subject's
   decision records, the guide [`docs/index.md`](../../../docs/index.md) names, and the `next-card`
   issues. Test the premise of each decision and boundaries entry the step leans on, `main`'s
   included, against its row at the installed version; a failed one goes to the founder, quoting
   the decision.
6. **Recommend** what you would write from zero (pstack `poteto-mode`), and list what of `main` it
   deletes. Where references diverge, the options are theirs, each with its how
   ([report](references/report.md), section 4); without it, it is not brought.
7. **Verify.** Reopen every line a reader reported, or label it relay.

**The study rule**: a decision whose only basis is "implemented so",
"only tested so" or "decided before" is dropped, or defended in writing with a reason of its own. A
part is brought only if it would be written that way from nothing. Its measure: lines brought and
changed until the criteria pass, old tests passing unchanged through the public door, session hours.
Past a third of its brought lines changed, it is written new.

## What it produces

The report ([template](references/report.md)), outside the repository ([delivery
L21](../../../docs/guides/delivery.md)), whose reference table the card copies; for a one-way door,
a decision record "proposed" with its Criterion.

## Stop and ask

- A product choice, or references diverging on what a person sees: ask the founder through
  firstmate, with an example and a recommendation.
- A remendo row has no cheap proof.
- A guide rule the step must follow rests only on "implemented so".

## When it closes

When every cell of the reference table is filled at a pin and the report's coverage list holds.
Not when sections are full. A study opened after the card's approval reopens the card before any
unit it touches builds.
