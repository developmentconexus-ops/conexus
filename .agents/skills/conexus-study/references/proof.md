# A small proof for an expensive choice

Read only when the study finds a one-way door: the Builder's engine, where the product runs, who
holds the session, data isolation, or a ready-made piece holding state or identity or running
third-party code.

## The four steps

1. Write a decision record in `docs/decisions/` with state "proposed" and a **Criterion** section:
   the question, the pass rule of each check, and what is held fixed. It enters `main` before any
   proof code runs. The record, Result included, stays within its ceiling ([delivery
   L24](../../../../docs/guides/delivery.md)); the set-up detail stays with the proof's code.
2. Run the proof on the real service, outside this repository.
3. Write the **Result** against the Criterion, in the same record, in a later commit. The Criterion
   is never edited again; a later note goes under a **Notes** section.
4. The founder decides, with the result explained by what a person sees.

## The Criterion template

```markdown
## Criterion

**Question.** <one sentence>

**Fixed.** <versions, plan, region, data size>

| # | Check | Passes when |
| --- | --- | --- |
| 1 | <what is run> | <observable result> |

**Not covered.** <what a pass would not show>
```

## Limits to state in the result

- The order check proves the Criterion was written before the Result, not that the proof ran after.
- A pass on one setup is not a pass on another: name each setup that ran.
- What was read but not run is labelled "read", never "proved".
