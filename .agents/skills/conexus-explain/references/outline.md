# The two explanations of a step

Every step gets two explanations of one form, written in the chat in Portuguese (see Limits in the
skill). Evidence (commands, `file:line` lists, CI links) goes in an appendix outside the budget.

| | A. Before the card is approved | B. After build and review, with the merge ask |
| --- | --- | --- |
| Budget | 1,300 words, 8 to 10 minutes | 1,800 words, 12 to 15 minutes |
| Speaks of | the proposed design, always marked as a proposal | the reviewed commit, with `file:line` |
| Closes with | the decisions the card asks of the founder | the merge ask and the review's verdict |

## The ten parts, in order

1. **One sentence.** What the founder can do at the end of the step. In B: what exists in fact.
2. **The Padaria Sol example.** One question or action of one person (Bruno owns the company, Carla
   administers it, Ana and Diego are members), from screen to database and back, at most 8 steps,
   with one refusal case (Diego gets 404). In B each step names the file that runs it.
3. **Where each part runs.** A simple diagram: browser, Hub process, Hub database, Mastra database,
   company database, provider. In B, "same as the card" when nothing changed since A.
4. **The code architecture.** A table of folder, owner, what it does and a short signature; then at
   most three main types, each with a valid and an invalid case.
5. **Native against ours.** A table: what the library already does, in the installed version with
   `file:line`, and what Conexus wrote over it and why (C75). In B it agrees with
   `docs/reference/boundaries.md`.
6. **Why each choice.** The 3 to 5 main choices, each with the discarded alternative and its cost,
   and what the references do, with commit and line. In B, only what changed since A.
7. **How it was proved and what was not.** A table of acceptance criterion, test and observed
   result (CI on the commit, or live proof), separating proved, proved with a double and not
   proved. Only in B; A lists the proofs still to run.
8. **Where it differs from the card.** Each divergence the build report declared (L7) and those the
   review found; for each, does it change what the person sees? Only in B.
9. **What deserves questioning.** A demonstrated defect apart from a risk or a doubt; invent
   nothing to fill the part. In B, also the review's Bloqueia and Fechamento findings.
10. **Verdict and ask.** "Is this the best form for this step?", answered yes or no with the
    reason; then the decision or the merge asked.

## The founder's five-minute checklist

1. Do the sentence and the example match the use script?
2. Does each "ours" row of part 5 have a reason he accepts? It is where most errors are.
3. Does each criterion have a test with an observed result? May what is "not proved" go to
   production?
4. Does each divergence from the card leave what the person sees unchanged? If not, it returns to
   him (L7).
5. Where does each datum live, process memory or database (C63)? What is lost on a restart?
6. Is there a new dependency (L16) or an open Bloqueia? Both must be zero.

The reviews own style, names, types in detail, line coverage, line citations, what Biome, knip and
dependency-cruiser already refuse, and the security refusal criteria (L9). Do not spend the budget
on them.

## Reading order for B

Write it while CI and the delta finish; it rides on the merge-ask message.

1. A of this step: update parts 1, 3 and 6 only.
2. The card: founder's page, acceptance criteria, the table of what is born new.
3. The build reports: declared divergences.
4. The two review reports: verdict and findings.
5. `git diff --stat` by unit folder, the diff of `boundaries.md` and of `package.json`.
6. CI on the commit, which feeds part 7.
7. Only then the code, and only the files behind table rows.
8. For Mastra and other libraries, the maintainers' skill and the installed version.
