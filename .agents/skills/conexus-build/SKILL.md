---
name: conexus-build
description: Builds one unit of an approved Conexus step card as one commit of the step's pull request, or fixes a defect. Use when instructions name a step card and a unit, or a defect to fix.
---

# Build

The card says what to build; this skill says how to work. The session that wrote the card never
builds it.

## The goal

One commit per unit ([delivery L9](../../../docs/guides/delivery.md)) in which every criterion is
green by a test that fails without the change, every reference row is used as its verdict says
([code C75](../../../docs/guides/code.md)), and `main` ends no more complex than the card requires.
CI is the full gate (L15); locally, prove only what the unit touches.

## Before code

- Read the unit's section of the card and load the skills it names, pstack `poteto-mode` and
  `typescript-best-practices`.
- Before using a reference row, open its `file:line` at the installed version. A shape a library
  emits comes from a `npm run record` recording
  ([testing T26](../../../docs/guides/testing.md)), never typed.
- Brought code follows [bring](references/bring.md), a defect [bug](references/bug.md), a screen
  [screen](references/screen.md), a connector [`conexus-connector`](../conexus-connector/SKILL.md).

## How to work

- Delete before adding. What the card removes leaves with every caller; no shim, parallel path or
  temporary shape.
- Native first. A nativo row uses the named API as is, an embrulhado row adds only its line, and a
  remendo row keeps the card's proof beside its [boundaries](../../../docs/reference/boundaries.md)
  entry. A screen starts from `ui/` and the showcase ([design V62](../../../docs/guides/design.md)).
- Write each criterion's test first, through the public door (T5) with negative cases (T10) and
  recorded doubles (T24, T29), and see it fail for the reason the criterion names.
- For each guard or branch the unit adds, break it once and watch its test go red (T27). A
  survivor gets a test, or leaves as dead code. Do it inside the test loop, not as a later pass.
- Comment only a reason the code cannot show (C70).
- Run only the test files the unit touches; a long server set runs in the background while you
  keep working.

## Guardrails

- Never invent a product rule, value or boundary to turn a test green, and never weaken a test,
  assertion or authority to pass (T17). A test or criterion you believe is wrong is a stop.
- Touch nothing outside the card's folders unless L7 allows it and the report declares it, and
  nothing the unit does not need.
- Do not run what CI owns: full suites, the full typecheck, Stryker, `processo` gates.
- Never sit in a loop waiting on your own background job; work beside it or end the turn.

## Stop and ask

Stop coding and report the evidence when a decision is missing, a criterion cannot turn green
without changing the card, a guide and the card contradict each other, the unit changes what a
person sees or outgrows the card's estimate (L7), or the code needs a file, shape, behaviour or row
the section does not name.

## Before the push

`npm run check:local -- --unit U<k> --card <card> [test files]` passes on the commit (L29). It is
your one typecheck; name only tests not yet green since your last edit, and run it in the background.
The section's proofs are green and a changed screen was looked at in the states it changes (T23).

## The report

What ran, with each result, and what was not proved; each criterion with its test, each row with
its file; each mutation in one line; brought line counts; files outside the card's folders; the
screens seen by state, width and theme, or "no screen touched". A red criterion is fixed, never
handed to the review.

## The fix round

One front per finding's cause, its class swept (L11), one commit to the same branch.
