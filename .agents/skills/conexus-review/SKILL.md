---
name: conexus-review
description: "Reviews a whole Conexus roadmap step at its exact commit, as the one Opus reviewer that did not build it: reads the rules from main, reads every file of the diff and compares each built piece with the reference's own code, walks the card's reference table row by row, tries to break every acceptance criterion, runs the refusal criteria, asks of every line whether it exists only because the old code had it, labels each finding Bloqueia, Fechamento or Issue futura, and gives one verdict with file and line. Also checks a fix's delta. Use when instructions name a step to review."
---

# Review

## When to use

Pass 1, once per step, by [delivery L9](../../../docs/guides/delivery.md)'s one reviewer, beside
QA, at `main` once the last unit is merged and CI is green there. The same skill reviews each unit
commit by commit. Later passes are a delta check (step 9).

## What it receives

The pull request, its head commit and the card; nothing from the builders' conversation.

## Steps

1. Read the rules from `main`: `AGENTS.md`, this skill, [the
   checklist](../../../docs/reference/checklist.md), the card, [code](../../../docs/guides/code.md)
   and the card's guides; load pstack `poteto-mode` and, for code, `typescript-best-practices`.
   Record the reads and the commit; an unloaded skill is read from its `stack.md` docs column.
2. Read every file of the step's diff, not only the card's rows: `main` at the last group's merge
   against the step's first commit, and against each unit's section, at the exact commit; a unit review reads its commit.
3. Try a counterexample to each acceptance criterion.
4. Run the refusal criteria against the published step or a real database, saying what you ran (a
   claim not run is "read"), and read every CI job's log; when the change touches the test
   selector, its inputs or a dependency, confirm the plan ran everything. Drive the browser in
   doubt; read QA's report if posted, never wait. Rerun `npm run quality` at
   the head and list it under Ran; a survivor the build called equivalent or style-only that one test
   kills is a finding (L12).
5. Walk the card's reference table against the diff ([code C75](../../../docs/guides/code.md)): a
   nativo row uses the named API; an embrulhado row adds only its line; a remendo row's native
   candidate runs at the installed version, listed in Ran, and one that serves is a Bloqueia. A
   changed file no row or contract explains is a Bloqueia (C75), outside the card's folders unless
   the build report declares it (L7). A defect fix walks its report's rows. Then compare each built
   piece with the reference's code ([compare](references/compare.md)). Two findings on one mechanism: should it exist, or
   does a library hold it?
6. Walk the checklist, sweeping each class across the diff, and fill its sweep table (a row
   per review rule: search, result). A screen: [screen](references/screen.md).
7. Label every finding by [delivery L12](../../../docs/guides/delivery.md). Every Fechamento about
   code shape goes on the closing list, checked as done.
8. Write one verdict; an unfinished step is no verdict.
9. A delta check reads one front's `git diff <reviewed>..<new>` and its earlier Bloqueia findings:
   is each closed, did the fix create one; the pull request body counts it ("conferência 1 de no
   máximo 3").

## What it produces

One verdict, posted on the pull request:

```markdown
Rules read: <files> at <main commit>. Reviewed: <head commit>.

## Reference table
<each row: its verdict held, or the finding>

## Comparação com as referências
<one line per built piece: reference `file:line` opened, same | differs (why the card
records it, or the finding)>

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
