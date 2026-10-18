# Delivery guide

How a roadmap step moves from its card to the founder's use. This guide adapts
[Google's engineering practices](https://google.github.io/eng-practices/) (CC BY 3.0) and
[DORA's small-batch capability](https://dora.dev/capabilities/), within the founder's decisions.
Each rule uses [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** state
a requirement; **should** and **should not** need a stated reason to break; **may** is free choice.
Brackets name the enforcing machine, or "review". Guidance does not authorize violating an approved
contract, product decision or operational prohibition. L12 decides whether a finding holds merge.
[AGENTS.md](../../AGENTS.md) and its skills own the stages and their procedures. This guide changes
only with the founder's word.

## 1. One step at a time

- **L1.** Product work **should** have one step in construction; study/scope of the next step and
  a draft method change can run beside it without product code. Failure: two stages approve
  incompatible forms of one contract before anyone uses it. [review]
- **L2.** A step **should** be usable within a few days, with about 4,000 changed code lines excluding
  tests/generated files, calibrated at step 5; split before build when it exceeds that budget.
  Founder, 2026-10-12: "A"; 2026-10-16: "Concordo". Failure: a 161-file step multiplies the possible
  samples of review. This is a planning budget, not another merge gate. [review]
- **L4.** A production defect **should** become an explicit fix at the queue's front rather than
  hide in the next scope. Failure: an authorization fix inside an unrelated step makes the release
  that corrected access untraceable. [review]

## 2. The card

- **L5.** `docs/steps/` **must** hold one file: the card of the step in construction. The next card
  waits in a draft pull request and enters when the current step closes. [check-docs]
- **L6.** The founder **must** approve the card's page in Portuguese. The roadmap records the
  approval with his words, the date and the commit of the card; CI checks that commit is an ancestor
  of the tip and that the card has not changed since. [CI]
- **L7.** A unit **should** follow its card's folders and contract owners, declaring direct
  consequences of an approved contract/guard in the build report rather than stopping for a missing
  path. A change to visible behavior or scope returns to the card and founder. Founder,
  2026-10-15: "EA"; 2026-10-16: "Concordo". Failure: omitting a contract owner from the file list
  makes every necessary fix a restart. The radius report lists paths, not semantic permission.
  [review]

## 3. Build and review

- **L9.** Review **should** follow the approved protocol: one whole-step reading after units and
  green CI, by two models that did not build it, at the exact commit, each running refusal criteria;
  after fixes, one reader checks only the delta for closed Bloqueia and newly introduced defects.
  No per-unit review or review robot. Documents-only changes get check-docs and one reader once;
  a card gets one whole reading, then deltas. Founder, 2026-10-12, firstmate's uncontested reading;
  2026-10-16: "Concordo". Failure: rereading everything after each fix samples new rules forever
  instead of converging. [review]
- **L11.** Findings **should** cite evidence, file, line and broken rule; fixes address the cause
  and sweep its class through the whole diff. A third delta check blocking on the same premise
  returns to the card and founder. Failure: fixing one logger key per round leads to six reviews
  of one mechanism. [review]
- **L12.** Findings **should** be classified by reachable cost, not preference. **Bloqueia** holds
  merge and says "Se for assim para produção, <quem> perde <o quê> quando <situação>"; without
  that, the finding is **Fechamento**. Fechamento (wording, name, citation, guide amendment) goes
  on the pull request's closing list. **Issue futura** (outside scope, future scale with a written
  trigger, development tool) goes to a next-card or method issue. With neither broken rule nor
  shown defect, start with `Nit:`, as Fechamento. Founder, 2026-10-16: "Concordo". Failure: a stale
  line citation blocks like a password leak. [review]

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
  note of what the step delivers: `v0.N.0` for step N, `v0.N.P` for a fix of it, `v1.0.0` with
  the first company [0035]. A proof **must not** spend a name of this scheme; the card names the
  releases its proof creates. Failed use leaves the step open for a fix. [CI, from the first step's
  closing]

## 5. Closing a step

- **L19.** Closing **should** follow use and settlement of pending items: write the use line, retain
  learned rules that change the next action, confirm acceptance tests, settle the Fechamento list,
  remove taken items from next-card issues and delete the card. Failure: deleting the card also
  erases an administrator decision nobody preserved. [review]
- **L20.** Skills and guides **must** change only in a closing pull request, when no step is in
  construction. A new check **must** land in a pull request of its own before the step that needs
  it, as native configuration first (Biome, TypeScript, knip, dependency-cruiser), a script only
  when none serves. A finding that asks for a change waits in the method queue, an issue with the
  method label. The exception is an emergency label only the founder applies, counted on the step's
  line. Founder, 2026-10-16: "Concordo". [CI for skills and guides, review for checks]

## 6. What the repository keeps

- **L21.** The repository **must** keep only what changes what the next agent does: the use line in
  the roadmap, a proof's criterion and result in its decision record, a learned rule in its guide.
  Studies and proofs stay outside it; what only proves a stage was done stays in the pull request.
  Founder, 2026-10-12. [check-docs]
- **L23.** What a person uses or decides **should** be in Portuguese: README, roadmap, cards,
  founder's page, operational how-tos and all visible text, accessible names and placeholders,
  with Brazilian presentation of dates/numbers. AGENTS.md, guides, architecture, decisions, skills
  and other how-tos stay in English. Founder, 2026-10-15: "2. A". Failure: an English recovery
  instruction prevents the person following the use script without translation. [review]
- **L24.** A file in `docs/` or `.agents/skills/` **must** have a line in `docs/index.md` and stay
  under its ceiling below; links **must** resolve; rule identifiers **must** be unique and every cited
  one exist; a rule **must** live in one file; retired process names **must not** appear. They are:
  wave, N0 to N5, receipts, Factory as the old review robot, Codex review, `conexus-spec`,
  `conexus-prove`, `conexus-development`, dossier; they appear nowhere else. [check-docs, review]

| File | Ceiling, in words |
| --- | ---: |
| `AGENTS.md` | 400 |
| `docs/index.md` | 500 |
| `docs/roadmap.md` | 1,600 |
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

## 7. Git

- **L26.** Work and commits belonging to others **should** be preserved, with the operational
  prohibitions of AGENTS.md and merge authority of L13/L14 still binding. Failure: a force-push
  removes the commit cited by an approval and invalidates its evidence. This guidance never permits
  reset, clean, stash, force-push or discarding another's work; a local hook cannot protect main.
  [review]
