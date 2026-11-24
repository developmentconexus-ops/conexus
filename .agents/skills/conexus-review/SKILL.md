---
name: conexus-review
description: "Reviews a Conexus roadmap step at its exact commit, as the one Opus reviewer that did not build it: reads the rules from main, reads every file of a unit's diff and compares each built piece with the reference's own code; checks the diff against the vision and that no piece of main stays without the founder's decision or a reference behind it; for the whole step, reads only the card's reference table row by row and the seams between pull requests, never an approved diff again; tries to break every acceptance criterion, runs the refusal criteria, asks of every line whether it exists only because the old code had it, labels each finding Bloqueia, Fechamento or Issue futura, and gives one verdict with file and line. Also checks a fix's delta. Use when instructions name a step to review."
---

# Review

## When to use

Each unit commit by commit from its pull request's opening, and the whole step once beside QA, by
[delivery L9](../../../docs/guides/delivery.md)'s reviewer. Later passes run step 10's delta
check.

## What it receives

The pull request, its head commit and the card; nothing from the builders' conversation.

## Steps

1. Read the rules from `main`: `AGENTS.md`, [the vision](../../../VISION.md), this skill, [the
   checklist](../../../docs/reference/checklist.md), the card, [code](../../../docs/guides/code.md)
   and the card's guides; load pstack `poteto-mode`, for code
   `typescript-best-practices`, for connectors [`conexus-connector`](../conexus-connector/SKILL.md).
   An unloaded skill is read from its `stack.md` docs column.
2. A unit review reads every file of its commit against its section; the step review reads only
   what L9 names, in steps 5 and 6.
3. Try a counterexample to each acceptance criterion.
4. Run the refusal criteria against the published step or a real database, saying what you ran (a
   claim not run is "read"), and read every CI job's log; when the change touches the test
   selector, its inputs or a dependency, confirm the plan ran everything. Drive the browser in
   doubt; read QA's report if posted. Never run Stryker locally. Hand-mutate the key lines, listed
   under Ran ([T27](../../../docs/guides/testing.md)); one no test kills is a finding (L12).
5. Walk the card's reference table against the diff ([code C75](../../../docs/guides/code.md)): a
   nativo row uses the named API; an embrulhado row adds only its line; a remendo row's native
   candidate runs at the installed version, listed in Ran, and one that serves is a Bloqueia. A
   changed file no row or contract explains is a Bloqueia (C75), outside the card's folders unless
   the build report declares it (L7). A row on a reference not **mesma situação** in the study's
   [verification pass](../conexus-study/references/sources.md), or keeping a piece of `main` the
   [study rule](../conexus-study/SKILL.md) takes out, is a finding. A defect fix walks its report's
   rows. Then compare each built piece with the reference's code
   ([compare](references/compare.md)). Two findings on one mechanism: should it exist, or does a
   library hold it?
6. Fill the checklist's sweep table. A screen: [screen](references/screen.md), with
   [design V62](../../../docs/guides/design.md).
7. Label every finding by [delivery L12](../../../docs/guides/delivery.md). Each code-shape Fechamento
   goes on the closing list, checked as done.
8. **The vision.** Per vision section the diff touches: alinha, deve ser recusada (L12) or não
   toca. Only its lines count, never the roadmap's; a refusal its text does not carry goes to the
   founder as a change to it.
9. Write one verdict; an unfinished step is no verdict.
10. A delta check reads one front's `git diff <reviewed>..<new>` and its earlier Bloqueia findings:
   is each closed, did the fix create one; the pull request body counts it ("conferência 1 de no
   máximo 3").

## What it produces

One verdict, posted on the pull request:

```markdown
Rules read: <files> at <main commit>. Reviewed: <head commit>.

## Reference table
<each row: its verdict held, or the finding>

## Comparação com as referências
<one line per built piece ([compare](references/compare.md))>

## Ran
<command or action, and what it showed>

## Sweep table
<the checklist's table>

## Visão
<step 8, one line per section>

## Findings
1. <Bloqueia | Fechamento | Issue futura> <symptom>. Evidence: <file:line or output>. Breaks:
   <rule id or criterion>. Cost (Bloqueia only): L12's sentence.

## Verdict
approve | request changes: <one line why>
```

## Stop and ask

The card contradicts a guide: report both lines, choose neither. A piece departs from the
references: bring it to the founder as [delivery L28](../../../docs/guides/delivery.md) says.

## When it closes

The verdict names the commit it judged. A missing approval or label is no finding: firstmate checks
those before the merge ([delivery L13](../../../docs/guides/delivery.md)).
