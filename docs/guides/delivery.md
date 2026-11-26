# Delivery guide

How a roadmap step moves from its card to the founder's use. This guide adapts
[Google's engineering practices](https://google.github.io/eng-practices/) (CC BY 3.0) and
[DORA's small-batch capability](https://dora.dev/capabilities/).
[AGENTS.md](../../AGENTS.md) and its skills own each stage's procedure.

In every guide, each rule uses [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and
**must not** state a requirement; **should** and **should not** need a stated reason to break;
**may** is free choice. Brackets name the enforcing machine, "rule to write" for a promised check,
or "review": a Biome or GritQL mark names the exact rule that refuses the case, and a rule no tool
refuses in full also carries "review". Guidance does not authorize violating an approved contract,
product decision, security boundary or operational prohibition.

## 1. One step at a time

- **L1.** Product work **must** go to the track owning its folders, **Dados**, **Agentes e
  Apps** or **Redesenho** (only the Hub's shell and pieces). Each track **should** have one step in construction and at
  most one open study. The platform is maintenance, not a track: a defect there follows L4 in the
  track that found it. Once the contract file lands, Agentes e Apps reaches company data
  only through it, changed through an issue labelled `contrato`. A unit touching another track's file waits for
  its units on it. Study, scope and a draft method change can run beside it without product code. A sibling step builds
  only after the previous one merges, but once a card is approved (L6), its units touching none of
  the previous step's fixes' files may start, built from that card's pull request, beside its
  use, fixes and closing. A small change that
  [AGENTS.md](../../AGENTS.md) exempts from a card is not a step. [review]
- **L2.** A step **should** be usable within a few days, with about 4,000 changed code lines excluding
  tests/generated files; split before build past that budget.
  [review]
- **L4.** A production defect **should** become an explicit fix at the queue's front rather than
  hide in the next scope. [review]

## 2. The card

- **L5.** `docs/steps/` **must** hold one file per track: the card in construction. A track's
  page in `docs/steps/trilhas/` is not a card. The next card of a track waits in its own draft pull request, its units built on branches once
  approved, and enters when the track's step closes; the `processo` check stays red on it only when the pull request is not a draft. [processo]
- **L6.** The founder **must** approve the card's page in Portuguese, with his words, the date and
  the card's commit in its approval file, named as the card in `docs/approvals/`, with its
  amendments, his mid-step decisions (no new approval) and the use line. Firstmate
  decides a reversible technical call on every track, except L28, with its evidence and how to undo it; the
  founder keeps product, spend, security, table permissions, live use, merge words and his own
  decisions. Firstmate **must** write his other decisions on a track the same day, with words and
  date, on the track's page in `docs/steps/trilhas/` or `docs/approvals/fora-de-uma-etapa.md`.
  [processo, review]
- **L7.** A unit **should** follow its card's folders and contract owners, declaring direct
  consequences of an approved contract/guard in the build report rather than stopping for a missing
  path. A change to visible behavior or scope returns to the card and founder.  
  [review]
- **L28.** A piece departing from the references **must** go to the founder as a decision,
  researched in them first; what they leave open names the platform test that would close it.
  Founder, 2026-11-15. [review]

## 3. Build and review

- **L9.** Review **should** follow the approved protocol. The build groups units into the fewest pull
  requests L2 allows, usually two or three, one commit per unit; each costs a CI run, a review and
  a merge, so a unit never spans two and a group splits only past L2, never to run in parallel what
  one builder builds. From its opening, beside CI, one Opus reviewer
  reads it commit by commit; a changed commit gets a delta. After the last unit, QA
  ([testing T25](testing.md)) and one whole-step reviewer start together: Claude on Opus, no builder
  of the step, following [`conexus-review`](../../.agents/skills/conexus-review/SKILL.md). It reads only
  what no unit review could see: the whole reference table row by row ([code C75](code.md)) and the
  seams between pull requests, and never rereads an approved diff.
  Nobody waits for QA; a review left incomplete is finished by its reviewer. QA and review findings
  form one fix round, split into fronts that share no file, built at once, one commit each, as one
  pull request into `main`; a Bloqueia that needs a contract the card lacks follows L7, then is one
  more front with its own delta. One reader checks each front's delta for closed Bloqueia and new
  defects, while QA reruns the screens it touched. Founder, 2026-10-25: "2. A", "3. A"; 2026-11-15.
  Documents-only changes get check-docs and one reader once; a card gets one whole reading, then
  deltas. [review]
- **L11.** Findings **should** cite evidence, file, line and broken rule; fixes address the cause
  and sweep its class through the whole diff. A third delta check blocking on the same premise
  returns to the card and founder. [review]
- **L12.** Findings **should** be classified by reachable cost, not preference. **Bloqueia** holds
  merge and says "Se for assim para produção, <quem> perde <o quê> quando <situação>"; without that,
  the finding is **Fechamento**. Bloqueia includes a security failure; lost data; a limit hit at the
  card's scale; a break of the card's contract; a hand-made piece on an undocumented API; a "must"
  test that cannot fail; two owners of one rule; a change `VISION.md` refuses, by its quoted line;
  red CI. Fechamento (wording, name, citation, guide amendment) goes on the pull request's closing list. **Issue futura** (outside scope, future
  scale with a written trigger, development tool) goes to a next-card or method issue. A trigger
  that the step's use script or its first live turn reaches is not future: that finding is Bloqueia
  unless the step proves it does not happen. With neither broken rule nor shown defect, start with
  `Nit:`, as Fechamento. On the border, a loss in the use script or operation is Bloqueia; a loss only after a later code change is Fechamento unless two owners
  can diverge. [review]
- **L29.** Before a push, `npm run check:local` **must** be green on the commit; the full typecheck
  and the suites are CI's (L15). [review]

## 4. Merge and use

- **L13.** Each build pull request **must** enter `main` as one merge, by firstmate, after the tests
  pass and its review approves the same commit. The card's pull request and a proof's decision record carry
  documents only. One founder merge word
  covers a step's units; review and CI still gate each.
  The merge **must** keep the commits, so a cited commit exists on `main`. [firstmate's merge script]
- **L14.** GitHub does not protect `main` in this repository. Nobody but firstmate **may** merge into
  `main`, always through firstmate's merge script, and only after the `ci` and `processo` checks reported green on that
  exact commit. After the opening commit nobody **may** push to `main` directly.
  [firstmate's merge script, review]
- **L15.** CI **must** have one check, `ci`, that fails when any job of the code fails, is skipped or is cancelled. A second check, `processo`, always present, holds the gates of L5, L6 and L20.
  A pull request **must not** wait on CI while CONFLICTING: it starts no `pull_request` run.
  [CI, review]
- **L16.** CI **must** list every new dependency in the pull request, and the review asks whether one
  is on the list of expensive choices. [CI, review]
- **L17.** After the merge, the step **must** be published on the cloud installation, checked live by
  firstmate item by item through the card's use script before the founder is told, then used by him
  through it. His words, the date and the address go in the
  card's approval file (L6), and only then **may** the next step start, but for the units of L1.
  Publishing is the merge of a pull request that changes only releases/note.md, whose first line
  names the version; Publish then creates the tag and the Release with the note on the merge commit
  and puts it live, in one run. It **may** leave at once when the green run of the merged head, its suites run, tested
  `main`'s tip at the merge as the base of its test merge; if `main` moved, it waits for green CI on `main`.
  Founder, 2026-11-15. Its names: `v0.N.0` for step N, `v0.N.P` for a fix of
  it, `v1.0.0` with the first company [0035]. A proof **must not** spend a name of this scheme; the card names the
  releases its proof creates. Failed use leaves the step open for a fix. [CI for the names and the note alone,
  firstmate's publish step for the wait]

## 5. Closing a step

- **L19.** Closing **should** fold into the step's last pull request, on every track: retain
  learned rules that change the next action, confirm acceptance tests, settle the Fechamento list,
  the founder's text review and the reviews' follow-ups, remove taken items from next-card issues,
  move each remendo row of the reference table into [boundaries](../reference/boundaries.md) with
  its package version; the card leaves with the use line, after the use (L17). Each week, an agent
  that built none of the week's steps runs the [CI health review](../how-to/ci-health.md) and sends
  firstmate its findings. [review]
- **L20.** Skills and guides **must** change only in a step's closing, or in the week's one
  documents-only pull request of method changes with the founder's word, between two steps of the track it affects; a
  step in flight keeps the rules it started with. A rule contradicted by an installed library or by a reference at the pinned version is corrected at once in a documents-only pull request, with the founder's word, without waiting for a closing. A new check **must** land in a pull request of its own before the step that needs
  it, as native configuration first (Biome, TypeScript, knip, dependency-cruiser), a script only
  when none serves. A finding that asks for a change waits in the method queue, an issue with the
  method label. A pull request answers for the tracks it touches (the track of a card it changes, or of a product file), and for all of them when it touches only the method. The exception is an emergency label only the founder applies, counted on the step's
  line. Founder, 2026-10-16: "Concordo". [CI for skills and guides, review for checks]

## 6. What the repository keeps

- **L21.** The repository **must** keep only what changes what the next agent does: the use line in
  the card's approval file, a proof's criterion and result in its decision record, a learned rule in its
  guide, the study's reference table in the card and its line in `docs/conhecimento/`. Study reports and proofs stay in `conexus-estudos`, at `estudos/<folder>/`; what
  only proves a stage was done stays in the pull request. Founder, 2026-10-12. [check-docs]
- **L23.** What a person uses or decides **should** be in Portuguese: README, roadmap, cards,
  founder's page, operational how-tos and all visible text, accessible names and placeholders,
  with Brazilian presentation of dates/numbers. AGENTS.md, guides, architecture, decisions, skills
  and other how-tos stay in English. [review]
- **L24.** A file in `docs/` or `.agents/skills/` **must** have a line in `docs/index.md` and stay
  under its ceiling below, when it has one; links **must** resolve; rule identifiers **must** be
  unique and every cited one exist; a rule **must** live in one file; retired process names **must
  not** appear. They are: wave, N0 to N5, receipts, Factory as the old review robot, Codex review,
  `conexus-spec`, `conexus-prove`, `conexus-development`, dossier; they appear nowhere else. A card's
  words outside the founder's page, divided by its units, stay under 2,500; L21 guards the page and
  `docs/approvals/`. [check-docs, review]

| File | Ceiling, in words |
| --- | ---: |
| `AGENTS.md` | 400 |
| `VISION.md` | 1,600 |
| `docs/index.md` | 500 |
| `docs/roadmap.md` | 1,600 |
| `docs/approvals/*.md` | none (L21) |
| `docs/architecture.md` | 2,500 |
| `docs/guides/code.md` | 3,500 |
| `docs/guides/security.md` | 3,000 |
| `docs/guides/data.md`, `design.md` | 2,500 |
| `docs/guides/testing.md`, `web.md` | 2,000 |
| `docs/guides/delivery.md` | 2,200 |
| `docs/decisions/*.md` | 350 |
| `docs/steps/*.md` | 2,500 per unit (review), none (L21) on the founder's page |
| `docs/how-to/*.md` | 800 |
| `docs/conhecimento/*.md` | 3,000 |
| `docs/reference/*.md` | none: one short entry per piece or mechanism |
| `.agents/skills/*/SKILL.md`, body | 600 |
| `.agents/skills/*/references/*.md` | 1,500 |

## 7. The light method

- **L27.** After its first milestone, the Dados track **must** use the light method of
  [the pattern card](../../.agents/skills/conexus-scope/references/pattern-card.md): a card from
  that template (2,000 words at most, no separate card reader), one Opus unit review, one delta at most, one step review with QA for screens. Dados owns
  `packages/connectors/src/<provider>/` and its fakes, and a change to a shared contract
  (`packages/hub-api`, migrations, `docs/index.md`, guides) **must** be read by the Agentes e Apps track.
  [review]

## 8. Git

- **L26.** Work and commits belonging to others **should** be preserved; this never permits
  reset, clean, stash, force-push or discarding another's work.
  [review]
