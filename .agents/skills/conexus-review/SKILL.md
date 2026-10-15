---
name: conexus-review
description: "Reviews a whole Conexus roadmap step at its exact commit, as one of two models that did not build it: reads the rules from main, tries to break every acceptance criterion, runs the refusal criteria, asks of every line whether it exists only because the old code had it, and gives one verdict with file and line. Use when instructions name a step to review."
---

# Review

## When to use

Once per step, after all its units are built, on the step's pull request at an exact commit, by
each of the two reviewers [delivery L9](../../../docs/guides/delivery.md) names.

## What it receives

The pull request, its head commit and the card. Nothing from the builders' conversation.

## Steps

1. Read the rules from `main` (L10): `AGENTS.md`, this skill,
   [the checklist](references/checklist.md), the card, [code](../../../docs/guides/code.md) and the
   guides the card names. Write which files you read and at which commit.
2. Read the whole diff of the step against `main`, at the exact commit.
3. For every acceptance criterion, try a counterexample.
4. Run the refusal criteria against the published step or a real database, and say what you ran.
   A claim you did not run is labelled "read". A step that changes a screen is looked at as
   [testing T23](../../../docs/guides/testing.md) says, and the verdict names the screenshots.
5. A file changed outside the card's blast radius is a finding (L7). For every part, check it
   against the card's table and the study rule ([`conexus-study`](../conexus-study/SKILL.md) step
   5): brought parts land in the named file and carry only the listed old decisions. Ask of every
   line of the step which one exists only because the old code had it; each such line is a finding
   unless the study defended it in writing. When two findings fall on one mechanism, ask whether
   the mechanism should exist, not only where its hole is.
6. Walk the checklist. With pstack, also run `interrogate` over the whole diff; without it, these
   steps stand alone. A skill the card names for a unit that the build report does not list as loaded
   is a finding.
7. Write one verdict.

## What it produces

One verdict, posted on the pull request:

```markdown
Rules read: <files> at <main commit>. Reviewed: <head commit>.

## Ran
<command or action, and what it showed>

## Findings
1. <symptom>. Evidence: <file:line or output>. Breaks: <rule id or criterion>.

## Verdict
approve | request changes: <one line why>
```

Any broken rule, failed criterion or correctness defect is "request changes"; a preference follows
L12.

## Stop and ask

The card and a guide contradict each other: report both lines and do not choose.

## When it closes

The verdict names the commit it judged. A missing approval, label or approval line is not a
finding: firstmate checks those before the merge ([delivery L13](../../../docs/guides/delivery.md)).
A recheck after fixes reads the earlier findings and answers each one.
