# Delivery guide

How a step of the roadmap goes from its card to the founder's use. This guide adapts
[Google's engineering practices](https://google.github.io/eng-practices/) (CC BY 3.0) and the
small-batch capability of [DORA](https://dora.dev/capabilities/), within the founder's decisions.
Each rule uses the words of [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must
not** state a requirement; **should** and **should not** need a stated reason to break; **may** is
a free choice. Whether a broken rule holds a merge is the rubric's call (L12), not the word's. Each
rule ends with the machine that refuses a violation, or "review". The steps
inside each stage are the skills' (see [`AGENTS.md`](../../AGENTS.md)). This guide changes only with
the founder's word.

## 1. One step at a time

- **L1.** The roadmap **must** have one step "in construction", and only it **may** have a branch
  with product code. A planning session **may** study and scope the next step beside it, writing no
  product code. [review]
- **L2.** A step **must** be small: something the founder uses within a few days, and about 4,000
  changed lines of code, without tests and generated files, a number to calibrate at step 5. The
  card splits a step above it before the build. Founder, 2026-10-12: "A"; 2026-10-16: "Concordo".
  [review]
- **L3.** Every step **must** pass through five stages: study, scope, build, review, use. [review]
- **L4.** A defect in what is already in `main` **must** become a fix step of its own, at the front of
  the queue, with the same review and merge. [review]

## 2. The card

- **L5.** `docs/steps/` **must** hold one file: the card of the step in construction. The next card
  waits in a draft pull request and enters when the current step closes. [check-docs]
- **L6.** The founder **must** approve the card's page in Portuguese. The roadmap records the
  approval with his words, the date and the commit of the card; CI checks that commit is an ancestor
  of the tip and that the card has not changed since. [CI]
- **L7.** A unit **must** touch only the folders its card's blast radius names and the owner of each
  contract it creates. A file outside them that follows directly from a contract or guard the card
  declares **may** proceed, declared in the build report. A change of what a person sees, or of
  scope, **must** stop the build and return to the card, with the founder's word. Founder,
  2026-10-15: "EA"; 2026-10-16: "Concordo". [review]

**Why.** An approval that cites a commit the card has since left approves nothing. A blast radius
written before the build is what makes a reviewer able to see the build wandered.

**Right.** A failure-table row the card's contract needs goes in the report as declared.

**Wrong.** A column on a table the card does not name, added to make a test pass.

## 3. Build and review

- **L8.** A step **must** be built whole on its own branch, in units. Units that share no folder
  **may** run in parallel, with one commit per unit. [review]
- **L9.** A step **must** have one review of the whole step, after its units are built and CI is
  green, by two models that did not build it, at the exact commit. Each **must** run the refusal
  criteria. After a fix, one model **must** read only the diff since the reviewed commit: is each
  Bloqueia closed, did the fix make a new one. There **must not** be a per-unit review or a review
  robot. A pull request of documents only gets `check-docs` and one reader, once; a card, one whole
  reading, then its diffs. Founder, 2026-10-12, in firstmate's reading (not contested); 2026-10-16:
  "Concordo". [review]
- **L10.** A reviewer **must** read the rules from `main`, never from the branch it reviews. [review]
- **L11.** A finding **must** name its evidence, file and line, and the rule it breaks. The builder
  **must** find the cause before the fix and sweep its class across the whole diff. A third delta
  check that still blocks on the same premise **must** send the step back to its card and the
  founder. [review]
- **L12.** A finding **must** carry one label. **Bloqueia** holds the merge and says "Se for assim
  para produção, <quem> perde <o quê> quando <situação>"; without it the finding is Fechamento.
  **Fechamento** (wording, a name, a citation, a guide amendment) goes on a list in the pull request
  for the closing. **Issue futura** (an improvement outside the card, a scale not yet reached with
  its trigger written, a development tool) goes to a `next-card` or method issue. A finding with no
  rule broken and no defect shown starts with `Nit:`, as Fechamento. Founder, 2026-10-16:
  "Concordo". [review]

**Why.** In October a reading of all the work at once by two models found four defects the batch
reviews and green CI had missed. A pull request that could change its own rules could approve
itself. A fix without its cause comes back.

**Right.** "Symptom: the list shows a deleted Project. Cause: the store reads a column nothing writes.
Fix: the state leaves the type. Breaks D18."

**Wrong.** A review of the whole step after every fix.

## 4. Merge and use

- **L13.** The step's code **must** enter `main` in one merge, by firstmate, after the tests pass and
  the review approves the same commit. Founder, 2026-10-13: "1 ok". The card's pull request, a
  proof's decision record and the closing pull request carry documents only. The merge **must** keep
  the commits, so a cited commit exists on `main`. [firstmate's merge script]
- **L14.** GitHub does not protect `main` in this repository. Nobody but firstmate **may** merge into
  `main`, always through firstmate's merge script, and only after the CI job reported green on that
  exact commit. After the opening commit nobody **may** push to `main` directly. Risk: nothing on
  GitHub refuses a direct push. Founder, 2026-10-13, declining GitHub Pro: "3. Nao vou".
  [firstmate's merge script, review]
- **L15.** CI **must** have one check that fails when any job fails, is skipped or is cancelled;
  firstmate's merge script reads that check. [CI]
- **L16.** CI **must** list every new dependency in the pull request, and the review asks whether one
  is on the list of expensive choices. [CI, review]
- **L17.** After the merge, the step **must** be published on the cloud installation, checked live by
  firstmate, and used by the founder through the card's use script. His words, the date and the
  address go on the step's line in the roadmap, and only then **may** the next step start. Founder,
  2026-10-12. Publishing is a GitHub Release firstmate creates after the merge, with CI green and a
  note of what the step delivers: `v0.N.0` for step N, `v0.N.P` for a fix of it, `v1.0.0` with the
  first company [0035]. A proof **must not** spend a name of this scheme; the card names the
  releases its proof creates. [CI, from the first step's closing]
- **L18.** If the use fails, the step **must** stay open and gain a fix. [review]

**Why.** An approval on an older commit proves nothing about the code that lands, and a squash would
leave approvals pointing at commits that exist on no branch. A green CI is not a person using it.

**Wrong.** A merge after a push that came in after the last verdict.

## 5. Closing a step

- **L19.** The closing pull request **must** write the use line, move into the guides the rules the
  step learned, confirm every acceptance criterion has a test, settle the review's Fechamento list,
  remove from the `next-card` issues the items the step took, and delete the card. [review]
- **L20.** Skills and guides **must** change only in a closing pull request, when no step is in
  construction. A new check **must** land in a pull request of its own before the step that needs
  it, as native configuration first (Biome, TypeScript, knip, dependency-cruiser), a script only
  when none serves. A finding that asks for a change waits in the method queue, an issue with the
  method label. The exception is an emergency label only the founder applies, counted on the step's
  line. Founder, 2026-10-16: "Concordo". [CI for skills and guides, review for checks]
- **L27.** Where the correct native solution conflicts with a rule, the solution **must** stay and
  the conflict **must** go on the closing list for the rule's amendment; the founder is called only
  when what a person sees, or the scope, changes. Founder, 2026-10-16: "Concordo". [review]

**Why.** Five changes of method in seventeen hours left every running session on a different rule.

**Wrong.** A guide edited mid-step so the next unit passes.

## 6. What the repository keeps

- **L21.** The repository **must** keep only what changes what the next agent does: the use line in
  the roadmap, a proof's criterion and result in its decision record, a learned rule in its guide.
  What only proves a stage was done stays in the pull request. [check-docs]
- **L22.** Studies and proofs **must** stay outside this repository; a decision record keeps the
  conclusion. Founder, 2026-10-12. [review]
- **L23.** What the founder reads **must** be in Portuguese: the README, the roadmap, the cards and
  their founder's page, and a how-to the founder follows. `AGENTS.md`, the guides, the
  architecture, the decision records, the skills and the other how-tos **must** be in English.
  Founder, 2026-10-15: "2. A". [review]
- **L24.** A file in `docs/` or `.agents/skills/` **must** have a line in `docs/index.md` and stay
  under its ceiling below; links **must** resolve; rule identifiers **must** be unique and every cited
  one exist; a rule **must** live in one file; retired process names **must not** appear. They are:
  wave, N0 to N5, receipts, Factory as the old review robot, Codex review, `conexus-spec`,
  `conexus-prove`, `conexus-development`, dossier; they appear nowhere else. [check-docs, review]

| File | Ceiling, in words |
| --- | ---: |
| `AGENTS.md` | 400 |
| `docs/index.md` | 500 |
| `docs/roadmap.md` | 1,500 |
| `docs/architecture.md` | 2,500 |
| `docs/guides/code.md` | 3,500 |
| `docs/guides/security.md` | 3,000 |
| `docs/guides/data.md`, `design.md` | 2,500 |
| `docs/guides/testing.md`, `web.md` | 2,000 |
| `docs/guides/delivery.md` | 1,800 |
| `docs/decisions/*.md` | 350 |
| `docs/steps/*.md` | 4,000, the founder's page about 600 |
| `docs/how-to/*.md` | 800 |
| `docs/reference/*.md` | none: one short entry per piece or mechanism |
| `.agents/skills/*/SKILL.md`, body | 600 |
| `.agents/skills/*/references/*.md` | 1,500 |

**Why.** The old repository's specifications reached 94,146 words. A ceiling a machine checks is
the only one that holds.

**Wrong.** A `docs/evidence/` folder of filled checklists.

## 7. Git

- **L25.** A pull request **should** do one thing and open with one line saying what changes, then
  why. Commit titles **should** follow conventional commits. [review]
- **L26.** Nobody **may** reset, clean, stash, force-push or discard work they did not create.
  [review]
