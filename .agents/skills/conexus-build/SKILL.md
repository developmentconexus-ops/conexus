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
unit's one named guide, and loads the card's maintainers' skills before writing code. With
pstack, it also loads `poteto-mode` and `typescript-best-practices`. [bring](references/bring.md)
only when the unit brings code; [bug](references/bug.md) only for a defect.

## Steps

1. Read the card's criteria for the unit, its table of parts, its blast radius, its contracts and
   its order of work.
2. Check that every type, contract and value the unit needs exists on the step branch or is
   created by this unit; if not, stop.
3. Delete before adding: remove what the card removes and move every caller. No shim, no parallel
   old path, no temporary shape for a later unit to replace.
4. Bring old code only as the card's table says: into the named file, refactored as listed,
   carrying only the old decisions listed with their basis. A line the table does not justify is
   not brought. Keep the measure of the study rule ([`conexus-study`](../conexus-study/SKILL.md)
   step 5) as you go; when a part passes its limit, stop and report.
5. Write the tests through the server's public door, with the negative cases, and provider doubles
   per [testing T24](../../../docs/guides/testing.md). Write each screen text from the card's state
   matrix.
6. Run the result for real: the server, the route, the migration on a disposable database, and a
   changed screen looked at as [testing T23](../../../docs/guides/testing.md) says, through the
   repository's verification skill when one exists (a screen: [screen](references/screen.md)). A fix
   that touches state reruns the A→B→A case, a fix that moves a layout reruns the card's failure
   states, and a new guard gets its removal row (T12).
   Then answer [the checklist](../../../docs/reference/checklist.md) item by item, sweeping each
   class across the whole diff, and fill its sweep table in the integration request, saying which
   file each pattern was copied from. Run pstack `deslop` and `no-comments`; code C70 and C73
   decide what leaves. Without pstack: reread the diff and remove what a careful engineer would not
   write.
7. One commit for the unit on the step branch. The tests the unit touches are green.

## What it produces

The commit and a report: what I ran, saw and did not prove; the line counts of each brought part;
every criterion with its test, none red; each declared file outside the card's folders ([delivery
L7](../../../docs/guides/delivery.md)); the screenshots looked at, by state, width and theme, or "no
screen touched". A criterion known to fail is never a finding handed to the review: fix it, or
stop.

## Stop and ask

- A criterion cannot turn green without changing the card.
- A decision is missing, or a guide and the card contradict each other.
- The unit changes what a person sees, or the scope, beyond the card ([delivery
  L7](../../../docs/guides/delivery.md)).
- The unit grows past what the card expects, or a brought part passes the third.

Stop means no more code: report the evidence and the question.

## When it closes

The unit's commit is on the step branch, its tests are green, and the report says what ran. In
the fix round you build one front ([delivery L9](../../../docs/guides/delivery.md)): fix each
finding's cause and its class (L11), and push one commit to the same branch.
