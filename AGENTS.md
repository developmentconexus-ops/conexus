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

The founder closes each step by using it; that stage has no skill.

## Commands

The root `package.json` lists every command. Run the tests a change touches before each commit.

## Rules for every task

- Read only what your skill and your card name. A guide owns its subject; cite its rules by
  identifier and never restate them.
- How to use a library is its maintainers' skill, checked against the installed version. The
  guides decide only what those skills leave open.
- Only the step in [docs/steps/](docs/steps/) is in construction. Work outside it needs a card.
- A missing decision stops the work: report it with evidence. Never invent a product rule, a
  boundary or a value to make a test pass.
- Delivery L13, L14 and L26 (merge, `main`, shared history); security S40 (no company data,
  secret or machine path).
- The old repository is read only, at its frozen commit `e0353c36`
  (`e0353c3608651ad3573dc921fd8230cb318eb543`); code enters only as its card says.
- Delivery L23 (language).
