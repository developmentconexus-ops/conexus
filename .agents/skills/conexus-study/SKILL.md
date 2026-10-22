---
name: conexus-study
description: "Studies a Conexus roadmap step before its card: finds who already does what the step needs, reads and runs them at the versions Conexus installs, asks each the same questions, and only then weighs the repository's own decisions; recommends what the references converge on, marks every own invention, and says for every part whether it is new or brought. Use at the start of every step, including one that brings code."
---

# Study

## When to use

At the start of every roadmap step, before `conexus-scope`, including one that brings code. Entry
sheets, decisions and today's code are input to test.

## What it receives

The step's line in [the roadmap](../../../docs/roadmap.md), the founder's words, the base commit;
for brought code, the entry sheets and the old code at its frozen commit, read only.

## Steps

1. Write each question as what a person sees, in one sentence, with its premise.
2. **Who already does this.** Before reading anything of ours, list three to six closest analogs
   (for the AI build flow, AI app builders first), the native feature and the old product. Name
   where you searched; "none found" counts only with that list.
3. **Read at our version.** For every library the step touches, load its maintainers' skill (parent
   first), read its pages through Context7 or `node_modules`, then its code, at the installed version
   ([sources](references/sources.md)). List every option a guarantee rests on, with its default, and
   where the library handles an error itself ([code C50](../../../docs/guides/code.md)).
4. **Run** the old product for anything it did, and one reference wherever the step changes what a
   person sees; a screen follows [screens](references/screens.md). A one-way door gets a
   [proof](references/proof.md).
5. **Same questions** to every source, in one table; mark each answer consolidated, one product's
   choice, or nobody does it.
6. **Then the repository.** Read [architecture](../../../docs/architecture.md), the subject's
   decision records, the guide [`docs/index.md`](../../../docs/index.md) names, and the `next-card`
   issues. Write the premise of each decision and boundaries entry the step leans on, `main`'s
   included, in one line and test it at the installed version; a premise that fails goes to the
   founder, quoting the decision.
7. **Recommend** what you would write from zero (pstack `poteto-mode`: redesign from first
   principles, subtract before adding), natively where the library serves ([code
   C75](../../../docs/guides/code.md)), and list what of `main` it deletes. Where references
   diverge, the options are theirs, rejected ones kept with their reason. Every option carries its
   **how**: the native primitives and how the vendor's own products (Mastra Code, Factory) do the
   same, with `file:line` at the installed version; without it an option is theory and is not
   brought. An own mechanism no reference has is **invenção**, proved or put to the founder.
8. **Parts.** Say for each whether it is **new** or **brought**, and fill its row in the report.
9. **Verify.** Reopen every line a reader reported, or label it relay.

**The study rule**, which every other skill cites: a decision whose only basis is "implemented so",
"only tested so" or "decided before" is dropped, or defended in writing with a reason of its own. A
part is brought only if it would be written that way from nothing. Its measure: lines brought and
changed until the criteria pass, old tests passing unchanged through the public door, session hours.
Past a third of its brought lines changed, it is written new.

## What it produces

The report ([template](references/report.md)), outside the repository ([delivery
L21](../../../docs/guides/delivery.md)); for a one-way door, a decision record "proposed" with its
Criterion.

## Stop and ask

- A product choice, or references diverging on what a person sees: ask the founder through
  firstmate, by what a person sees, with an example and a recommendation.
- An own mechanism has no reference and no cheap proof.
- A guide rule the step must follow rests only on "implemented so".

## When it closes

When the report's coverage list holds: every analog read or run at its pin, the old product run,
every number sourced, every relay reopened. Not when sections are full.
