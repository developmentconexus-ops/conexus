# Review checklist

Questions only a reader can answer. A machine already refuses the rules marked with a tool in the
guides; do not spend the review on them. Each question cites the rule it checks.

## The old code

1. Which line exists only because the old code had it? Is every old decision the step carries in
   the card's table, and does it pass the study rule ([`conexus-study`](../../conexus-study/SKILL.md)
   step 5)?
2. Was anything brought that the target design removes the need for? Compare with the card's
   table and the part's entry sheet.

## Patterns the Hub study found

3. State that assumes one process: does every new module-level value pass C63?
4. A promise larger than the code (C70): where a comment, a tool description or a skill says
   "always", "only" or "never", show the line that enforces it and its test.
5. Written and never read, read and never written (D18): for each new column, who writes and who
   reads it? A query without a column list reads all.
6. Hand-made where the native one serves (C75): was the library's own way read at its installed
   version? Is every hand-made exception recorded with the library's line?
7. A test that checks text, not behaviour (T6, T7).
8. A lock held while calling outside (D26), or a session-level lock (D25).
9. An owner reading another owner's table through hand-written SQL (C8).

## Reader-only rules

10. Is this the first file of its kind in the repository? Then it is the pattern every agent will
    repeat: is it the pattern to repeat?
11. Does the step state a rule that another file already owns, in other words?
12. Does every outside call have its deadline (C57)?
13. Did a negative test leave without its protection (T11)?
14. Is any new dependency on the list of expensive choices (L16)? Does it have its decision record?
15. Does every acceptance criterion have a test, and does the step's main path run unfaked (T16)?
    Is there a write in the diff, the step's or a library's, with no row in the card's failure table
    ([card template](../../conexus-scope/references/card.md))?
16. Did the step add something that runs alone? Then the sleeping-database test ran again (D27).
17. Does the diff touch `.agents/skills/` or `docs/guides/` while the step is in construction (L20)?
