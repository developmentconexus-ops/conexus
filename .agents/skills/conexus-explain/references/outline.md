# The page of a step

One page of one form, in Portuguese, read on a computer, with a short summary in the chat. The
parts come in this order and none is skipped; a part with nothing to say says so in one line.
Evidence (commands, CI links) goes at the end of the page.

1. **What changes for the person.** The Padaria Sol example (Bruno owns the company, Carla
   administers it, Ana and Diego are members): one action of one person, and one refusal.
2. **End to end.** A diagram of the path (browser, Hub process, databases, provider as the step
   needs), then each hop with its `file:line` and a short real excerpt.
3. **De onde veio.** The reference repositories' real code beside ours, with commit and line; why
   ours is the best form; the discarded alternatives and what each would cost.
4. **Nativo.** What the stack's library does at the installed version, against what Conexus writes
   and why; each remendo row of the reference table (code C75).
5. **Structure.** The folder tree, new, changed and removed, with line counts; the main types and
   functions; the core pseudocode.
6. **Proof.** A table of criterion, test and result, separating proved, proved with a double and
   not proved. A "not proved" row ends as a question to the founder.
7. **Risks and open decisions.** Each with its options and, for each option, the native "how".
   Separate a demonstrated defect from a risk or a doubt; after build, include the reviews'
   Bloqueia and Fechamento findings.
8. **Glossary.** Short, one line per term.

## The founder's checklist

1. Do part 1 and the use script match?
2. Does each remendo row of part 4 have a reason he accepts? It is where most errors are.
3. Does each criterion have a test with an observed result? May what is "not proved" go to
   production?
4. Does each divergence from the card leave what the person sees unchanged? If not, it returns to
   him (delivery L7).
5. Where does each datum live, process memory or database (C63)? What is lost on a restart?
6. Is there a new dependency (L16) or an open Bloqueia? Both must be zero.

The reviews own style, names, line coverage and what Biome, knip and dependency-cruiser already
refuse. Do not spend the page on them.
