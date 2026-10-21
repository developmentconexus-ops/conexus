---
name: conexus-review
description: "Reviews a whole Conexus roadmap step at its exact commit, as one of two models that did not build it: reads the rules from main, tries to break every acceptance criterion, runs the refusal criteria, asks of every line whether it exists only because the old code had it, labels each finding Bloqueia, Fechamento or Issue futura, and gives one verdict with file and line. Also checks a fix's delta. Use when instructions name a step to review."
---

# Review

## When to use

Pass 1, once per step, after its units are built and CI is green, at an exact commit, by each of
[delivery L9](../../../docs/guides/delivery.md)'s two reviewers. Later passes are a delta check
(step 9).

## What it receives

The pull request, its head commit and the card; nothing from the builders' conversation.

## Steps

1. Read the rules from `main`: `AGENTS.md`, this skill, [the
   checklist](../../../docs/reference/checklist.md), the card, [code](../../../docs/guides/code.md)
   and the card's guides. Record the files read and the commit.
2. Read the step's whole diff against `main`, at the exact commit.
3. Try a counterexample to every acceptance criterion.
4. Run the refusal criteria against the published step or a real database, saying what you ran
   (a claim not run is "read"). Look at a changed screen as [testing
   T23](../../../docs/guides/testing.md) says; name the screenshots.
5. A file outside the card's folders and contract owners is a finding unless it follows from a
   contract or guard the card declares and the build report declares it (L7). Check each part
   against the card's table and the study rule ([`conexus-study`](../conexus-study/SKILL.md) step
   5): brought parts land in the named file with only the listed old decisions. A line existing only
   because the old code had it is a finding unless the study defended it. When two findings fall on
   one mechanism, ask whether it should exist.
6. Walk the checklist, sweeping each class across the whole diff, and fill its sweep table (a row
   per rule marked review: search made, result). With pstack, also `interrogate` the whole diff. A screen: [screen](references/screen.md).
7. Label every finding ([delivery L12](../../../docs/guides/delivery.md)). **Bloqueia**: wrong
   behavior on a reachable path; a security failure; lost, duplicated or corrupted data; a limit
   reached at the card's scale; a hand-made piece where the native one exists and rests on an
   undocumented API; a divergence from the card's contract; a "must" test that cannot fail (T12);
   two owners of one rule that can diverge; red CI. **Fechamento**: wording, a comment, a citation,
   a name, a tidy-up hiding no defect, a guide amendment. **Issue futura**: work outside the
   card, a scale not yet reached (with its trigger), a development tool. On the border, ask: does
   someone lose something in this step's use script or operation (Bloqueia)? Is it the first file
   of its kind, wrong, and copied next (Bloqueia)? Does the loss appear only when the
   code later changes (Fechamento, unless two owners can diverge)? Every Fechamento
   about code shape goes on the closing list, checked as done.
8. Write one verdict.
9. A delta check reads `git diff <reviewed>..<new>` and the earlier Bloqueia findings: is each
   closed, did the fix create one. The pull request body counts it ("conferência 1 de no máximo 3").

## What it produces

One verdict, posted on the pull request:

```markdown
Rules read: <files> at <main commit>. Reviewed: <head commit>.

## Ran
<command or action, and what it showed>

## Sweep table
<the checklist's table>

## Findings
1. <Bloqueia | Fechamento | Issue futura> <symptom>. Evidence: <file:line or output>. Breaks:
   <rule id or criterion>. Cost (Bloqueia only): Se for assim para produção, <quem> perde <o quê>
   quando <situação>.

## Verdict
approve | request changes: <one line why>
```

"Request changes" needs a Bloqueia with its cost sentence; Fechamento and Issue futura go to the
closing and never hold the merge.

## Stop and ask

The card and a guide contradict each other: report both lines, choose neither.

## When it closes

The verdict names the commit it judged. A missing approval or label is no finding: firstmate checks
those before the merge ([delivery L13](../../../docs/guides/delivery.md)).
