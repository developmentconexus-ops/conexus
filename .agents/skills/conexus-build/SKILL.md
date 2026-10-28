---
name: conexus-build
description: "Builds one unit of an approved Conexus step card as its own pull request on `main`: deletes before adding, brings old code only as the card's transplant measure says, builds each reference table row as its verdict says, tests through the server's public door, runs the result and reports what ran and what was not proved. Also fixes a defect. Use when instructions name a step card and a unit, or a defect to fix."
---

# Build

## When to use

To build one unit of the step in construction, or the next ([delivery L1](../../../docs/guides/delivery.md)), from its approved card, or to fix a defect; never by
the session that wrote the card.

## What it receives

The card in `docs/steps/` (or its own pull request, for the next step) and the unit's name. It reads the card's top tables and its unit's
section, which is its spec. Nothing else is pasted in: a ruling not in the card is not built.

It reads [`AGENTS.md`](../../../AGENTS.md), this skill, [code](../../../docs/guides/code.md) and the
unit's one named guide, and loads the card's maintainers' skills, pstack `poteto-mode` and
`typescript-best-practices` before writing code; [bring](references/bring.md) for brought code,
[bug](references/bug.md) for a defect.

## Steps

1. Read the unit's criteria, its reference table rows and its section.
2. Every type, contract and value the unit needs exists on `main` or comes from this
   unit; if not, stop.
2a. Build each of the unit's reference table rows as its verdict says
   ([code C75](../../../docs/guides/code.md)): a nativo row uses the named API, an embrulhado row
   adds only its line. Fix a defect at its root cause: name the first wrong state, fix there,
   sweep its class.
3. Delete before adding: remove what the card removes and move every caller. No shim, no parallel
   old path, no temporary shape.
4. Bring old code only as the card's transplant measure says: into the named file, refactored as
   listed, carrying only the old decisions listed. Past the study rule's measure
   ([`conexus-study`](../conexus-study/SKILL.md)), stop.
5. Test through the server's public door, negative cases included, with provider doubles per
   [T24](../../../docs/guides/testing.md). Screen texts come from the card's state matrix.
6. Run the result for real: the server, the route, the migration on a disposable database, and a
   changed screen looked at per [T23](../../../docs/guides/testing.md), through a
   verification skill when one exists ([screen](references/screen.md)). A state fix reruns
   A→B→A, a layout fix the card's failure states, and a new
   security guard gets its removal row (T12). A remendo row keeps the card's proof beside its
   [boundaries](../../../docs/reference/boundaries.md) entry. Run pstack `deslop`, `no-comments` and
   `npm run quality` ([T27](../../../docs/guides/testing.md)): answer every survivor; code C70 and
   C73 decide what leaves.
7. One pull request for the unit, its commits kept; the tests and proofs its section names are green
   locally ([delivery L9](../../../docs/guides/delivery.md)).

## What it produces

The commit and a report: what I ran, saw and did not prove; each table row with the file that
builds it; the line counts of each brought part; every criterion with its test, none red; each
declared file outside the card's folders ([delivery L7](../../../docs/guides/delivery.md)); the
screenshots looked at, by state, width and theme, or "no screen touched". A criterion known to fail
is never handed to the review: fix it, or stop.

## Stop and ask

- A decision is missing, a criterion cannot turn green without changing the card, or a guide and
  the card contradict each other.
- The unit changes what a person sees, or the scope, beyond the card ([delivery
  L7](../../../docs/guides/delivery.md)).
- The unit outgrows the card's estimate.
- The code needs a file, shape, behaviour or table row the unit's section does not name, or a
  ruling arrives that the card does not carry: stop; the card takes it as a delta first.
- A test needs a library shape no recording holds: stop; record it with `npm run record`, load it with
  `nativeRecording` (T26), never type it.

Stop means no more code: report evidence and question.

## When it closes

Step 7 holds. In the fix round you build one front ([delivery
L9](../../../docs/guides/delivery.md)): each finding's cause and its class (L11), one commit to the
same branch.
