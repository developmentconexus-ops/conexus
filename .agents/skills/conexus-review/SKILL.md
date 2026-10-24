---
name: conexus-review
description: "Reviews a whole Conexus roadmap step at its exact commit, as one of two models that did not build it: reads the rules from main, tries to break every acceptance criterion, runs the refusal criteria, asks of every line whether it exists only because the old code had it, labels each finding Bloqueia, Fechamento or Issue futura, and gives one verdict with file and line. Also checks a fix's delta. Use when instructions name a step to review."
---

# Review

## When to use

Pass 1, once per step, by each of [delivery L9](../../../docs/guides/delivery.md)'s two
reviewers, beside QA, at the commit where CI turned green. Later passes are a delta check (step 9).

## What it receives

The pull request, its head commit and the card; nothing from the builders' conversation.

## Steps

1. Read the rules from `main`: `AGENTS.md`, this skill, [the
   checklist](../../../docs/reference/checklist.md), the card, [code](../../../docs/guides/code.md)
   and the card's guides. Record the files and skills read and the commit; a skill that did not
   load is read from its `stack.md` docs column, and said so.
2. Read the step's whole diff against `main` and against each unit's section, at the exact commit.
3. Try a counterexample to every acceptance criterion.
4. The Claude reviewer (L9) runs the refusal criteria against the published step or a real
   database, saying what it ran (a claim not run is "read"), and reads every CI job's log; when the
   change touches the test selector, its inputs or a dependency, it confirms the plan ran
   everything. Both drive the browser where in doubt, and read QA's report if it is posted; never
   wait for it.
5. A file outside the card's folders and contract owners is a finding unless it follows from a
   contract or guard the card declares and the build report declares it (L7). Run the native
   candidate of every "nosso" or "embrulhado" row at the installed version, and list each in the
   verdict's Ran; one that serves, or lacks the comparison and justification, is a Bloqueia (C75). When two findings fall on one mechanism, ask whether it should exist and
   whether a library already holds that fact.
6. Walk the checklist, sweeping each class across the whole diff, and fill its sweep table (a row
   per rule marked review: search made, result). A screen: [screen](references/screen.md).
7. Label every finding by [delivery L12](../../../docs/guides/delivery.md). On the border, ask
   [labels](references/labels.md). Every Fechamento about code shape goes on the closing list,
   checked as done.
8. Write one verdict. A step you could not finish is no verdict: finish it.
9. A delta check reads one front's `git diff <reviewed>..<new>` and its earlier Bloqueia findings:
   is each closed, did the fix create one. The pull request body counts it ("conferência 1 de no
   máximo 3").

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

Only a Bloqueia holds the merge ([delivery L12](../../../docs/guides/delivery.md)).

## Stop and ask

The card and a guide contradict each other: report both lines, choose neither.

## When it closes

The verdict names the commit it judged. A missing approval or label is no finding: firstmate checks
those before the merge ([delivery L13](../../../docs/guides/delivery.md)).
