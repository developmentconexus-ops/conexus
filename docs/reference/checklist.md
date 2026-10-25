# Checklist

Questions only a reader can answer, asked by the reviewer on the whole step. Answer an item by
sweeping its class across the whole diff, not by fixing the instance first seen, and fix every
occurrence. A tool refuses only what its marked rule names: sweep each item for what the tool does
not reach. Each question cites the rule it checks. Native before custom is the reference table's
walk ([code C75](../guides/code.md)), not a question here.

## Patterns the Hub study found

1. State that assumes one process: does every new module-level value pass C63?
2. A promise larger than the code (C70): does a comment, tool description or skill claim more
   than its mechanism and tests prove?
3. Written and never read, read and never written (D18): for each new column and contract field,
   who writes and who reads it, as the card's matrix says? A query without a column list reads all.
4. A test that checks text, not behaviour (T6, T7).
5. A lock held while calling outside (D22), or a session-level lock (D25).
6. An owner reading another owner's table through hand-written SQL (C8).

## Reader-only rules

7. Is this the first file of its kind in the repository? Then it is the pattern every agent will
   repeat: is it the pattern to repeat?
8. Does the step state a rule that another file already owns, in other words?
9. Does every outside call have its deadline (C57)?
10. Did a negative test leave without its protection or equivalent proof (T10)?
11. Does every acceptance criterion have a test, and does the step's main path run unfaked (T14)?
    Is there a write in the diff, the step's or a library's, with no row in the card's failure table
    ([card template](../../.agents/skills/conexus-scope/references/card.md))?
12. Did the step add something that runs alone? Then the sleeping-database test ran again (D27).

## The sweep table

The reviewer's verdict ends with one table, a row for every rule of [code](../guides/code.md)
marked review (also review beside a tool rule), plus every rule of another guide the card cites:

| Rule | Search made (command or files read) | Result (nothing, or findings with file and line) |
| --- | --- | --- |

A rule with no row means it was not swept.
