# Conexus: instructions for agents

Conexus lets a person in a company ask an agent, the Builder, for a business app in Portuguese, and
runs that app for the company. This repository holds the server program (Hub and Builder), the
Hub's screens, the Cloudflare edge and the shared contracts. The design is
[docs/architecture.md](docs/architecture.md); the map of every document and the subject it owns is
[docs/index.md](docs/index.md).

## Which skill for which stage

Every roadmap step passes through these stages. Load the skill before any work.

| Stage | Skill |
| --- | --- |
| Study a step | [`conexus-study`](.agents/skills/conexus-study/SKILL.md) |
| Write the step's card | [`conexus-scope`](.agents/skills/conexus-scope/SKILL.md) |
| Build a unit of the card, or fix a defect | [`conexus-build`](.agents/skills/conexus-build/SKILL.md) |
| Test a step's screens as a person would | [`conexus-qa`](.agents/skills/conexus-qa/SKILL.md) |
| Review the whole step | [`conexus-review`](.agents/skills/conexus-review/SKILL.md) |
| Explain a design to the founder, read only | [`conexus-explain`](.agents/skills/conexus-explain/SKILL.md) |

One artifact crosses the stages: the reference table ([code C75](docs/guides/code.md)). The study
writes it, the card carries it, the build follows its rows and the review walks them. The founder
closes each step by using it; that stage has no skill.

## Commands

The root `package.json` lists every command. Run the tests a change touches before each commit.

## Rules for every task

- Read only what your skill and your card name. A guide owns its subject; cite its rules by
  identifier and never restate them.
- How to use a library is its maintainers' skill at the installed version; the guides decide only
  what it leaves open, and native before custom is code C75.
- Only the step of each track in [docs/steps/](docs/steps/) is in construction (delivery L1). Work
  outside it needs a card. A one-line correction stays a fix; a fix that adds a file, a script, a
  filter or a new state is a unit of a short card (reference table, criteria, a founder's page of a
  few lines).
- A missing decision stops the work: report it with evidence. Never invent a product rule, a
  boundary or a value to make a test pass.
- Delivery L13, L14 and L26 (merge, `main`, shared history); security S40 (no company data,
  secret or machine path).
- The old repository is read only, at its frozen commit `e0353c36`
  (`e0353c3608651ad3573dc921fd8230cb318eb543`); code enters only as its card says.
- Delivery L23 (language).
