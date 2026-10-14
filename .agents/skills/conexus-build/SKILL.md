---
name: conexus-build
description: "Builds one unit of an approved Conexus step card on the step's branch: deletes before adding, brings old code only as the card's table of parts says, tests through the server's public door, runs the result and reports what ran and what was not proved. Also fixes a defect. Use when instructions name a step card and a unit, or a defect to fix."
---

# Build

## When to use

To build one unit of the step in construction, from its approved card, or to fix a defect. The
session that wrote the card does not build it.

## What it receives

The card in `docs/steps/` and the unit's name. Nothing else is pasted in: the card is the contract.

It reads [`AGENTS.md`](../../../AGENTS.md), this skill, the card, [code](../../../docs/guides/code.md) and the
one guide the card names for the unit, and loads the maintainers' skills the card names for it
before writing code. With pstack, it also loads `poteto-mode` and `typescript-best-practices`;
without pstack, it skips only those two, and everything above stays required.
[bring](references/bring.md) only when the unit brings code; [bug](references/bug.md) only for a
defect.

## Steps

1. Read the card's criteria for the unit, its table of parts, its blast radius, its contracts and
   its order of work.
2. Check that every type, contract and value the unit needs exists on the step branch or is
   created by this unit. If not, stop.
3. Delete before adding: remove what the card removes and move every caller. No shim, no parallel
   old path, no temporary shape for a later unit to replace.
4. Bring old code only as the card's table says: into the named file, refactored as listed,
   carrying only the old decisions listed with their basis. A line the table does not justify is
   not brought. Keep the measure of the study rule ([`conexus-study`](../conexus-study/SKILL.md)
   step 5) as you go; when a part passes its limit, stop and report.
5. Write the tests through the server's public door, with the negative cases
   ([testing](../../../docs/guides/testing.md)).
6. Run the result for real: the server, the route, the screen, the migration on a disposable
   database, through the repository's verification skill when one exists, kept current with pstack
   `maintain-verification-skill`. Then run pstack `deslop` and `no-comments`; code C70 and C73
   decide what leaves, so a comment that states a why the code cannot show stays. Without pstack:
   reread the diff and remove what a careful engineer would not write.
7. One commit for the unit on the step branch. The tests the unit touches are green.

## What it produces

The commit and a report: what I ran, what I saw, what I did not prove, the brought and changed line
counts of each brought part, and every criterion of the card with the test that covers it. It lists
every file changed outside the unit's blast radius and every departure from the card, each with the
stop it raised, or "none"; and the maintainers' skills and pstack skills loaded. No pull
request per unit and no review per unit: the step gets one review when its units are built
([delivery](../../../docs/guides/delivery.md)).

## Stop and ask

- A criterion cannot turn green without changing the card.
- A decision is missing, or a guide and the card contradict each other.
- The unit needs a file outside its blast radius: that is a change of scope ([delivery
  L7](../../../docs/guides/delivery.md)).
- The unit grows past what the card expects, or a brought part passes the third.

Stop means no more code: report the evidence and the question.

## When it closes

The unit's commit is on the step branch, its tests are green, and the report says what ran. A
review finding comes back as a message: find its cause before fixing, and push the fix to the same
branch.
