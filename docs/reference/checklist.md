# Checklist

Questions only a reader can answer, one list for two readers. The builder answers every item on the
unit before its commit; the reviewer answers them on the whole step. Answer an item by sweeping its
class across the whole diff, not by fixing the instance first seen, and fix every occurrence. A
tool refuses only what its marked rule names: sweep each item for what the tool does not reach.
Each question cites the rule it checks.

## The old code

1. Which line exists only because the old code had it? Is every old decision the step carries in
   the card's table, and does it pass the study rule
   ([`conexus-study`](../../.agents/skills/conexus-study/SKILL.md) step 5)?
2. Was anything brought that the target design removes the need for? Compare with the card's
   table and the part's entry sheet.

## Patterns the Hub study found

3. State that assumes one process: does every new module-level value pass C63?
4. A promise larger than the code (C70): does a comment, tool description or skill claim more
   than its mechanism and tests prove?
5. Written and never read, read and never written (D18): for each new column and contract field,
   who writes and who reads it, as the card's matrix says? A query without a column list reads all.
6. Hand-made where the native one serves (C75): was the library's own way read at its installed
   version? Is a hand-made exception justified beside its implementation? Without both, Bloqueia (C75).
7. A test that checks text, not behaviour (T6, T7).
8. A lock held while calling outside (D22), or a session-level lock (D25).
9. An owner reading another owner's table through hand-written SQL (C8).

## Reader-only rules

10. Is this the first file of its kind in the repository? Then it is the pattern every agent will
    repeat: is it the pattern to repeat?
11. Does the step state a rule that another file already owns, in other words?
12. Does every outside call have its deadline (C57)?
13. Did a negative test leave without its protection or equivalent proof (T10)?
14. Is any new dependency on the list of expensive choices (L16)? Does it have its decision record?
15. Does every acceptance criterion have a test, and does the step's main path run unfaked (T14)?
    Is there a write in the diff, the step's or a library's, with no row in the card's failure table
    ([card template](../../.agents/skills/conexus-scope/references/card.md))?
16. Did the step add something that runs alone? Then the sleeping-database test ran again (D27).
17. Does the diff touch `.agents/skills/` or `docs/guides/` while the step is in construction (L20)?

## Code shape

18. Is each lifecycle a union on one literal field with one owner of its transitions, every
    `switch` ending in `satisfies never` (C21)? Are there loose yes/no fields, or `''`, `0` or
    `null` standing for "not there" where the domain has a genuine absence (C22)?
19. Does each id in a signature, port and prop carry its brand and arrive by parsing, including
    those a rule does not reach: web, packages, aliases of `string` (C23)?
20. For each list, code, phrase, constant and state name: who owns it, and does any second file
    repeat it instead of deriving it (C26)?
21. Does each outside input pass one Zod schema at its boundary, with no hand check beside it
    (C27)?
22. Is each failure code in the failure table, not in an `Error` message, a variable or a compared
    sentence; does a screen read words by code (C48, C49)?
23. Does each `catch` and `.catch` rethrow, log or map to a typed result, even when its body is
    more than a lone literal (C53)?
24. Does any code parse or rewrite another library's message text, map its words by hand, or hide a
    state the library shows legitimately, where its native data or a verbatim display would serve
    (C52, C75)? A checklist sweep, not a gate.

## The sweep table

The builder's integration request and each reviewer's verdict end with one table, a row for every
rule of [code](../guides/code.md) marked review (also review beside a tool rule), plus every rule
of another guide the card cites:

| Rule | Search made (command or files read) | Result (nothing, or findings with file and line) |
| --- | --- | --- |

A rule with no row means it was not swept. The builder also names the file it copied each new
pattern from, and whether that file meets C21, C23 and C26.
