# 0055. Apps are written against the platform contract, on a starter the Builder edits

## Context

Until step 13 a generated app had a rigid frame: one to 32 operations and a fixed tree. The
founder found it too tight: a pricing page needs no server. The platform keeps what [0019], [0018]
and the dispatcher's CSP guarantee.

## Decision

- The contract owns `shared/operations.ts` and `server/handlers.ts` (the manifest comes from them),
  the generated client, `worker.js`, the check and the packing. The rest is the model's, from an
  editable starter.
- Contract 1 allows 0 to 32 operations; every manifest that exists stays valid [0019]. The packing
  generates `worker.js`. The upload sets `not_found_handling: 'single-page-application'`, `/api`
  staying in the Worker.
- Operations are written in Zod. A library beyond the starter's and Conexus OS's five is asked of
  the person; the grant is kept per Project, installed exact with `npm ci --ignore-scripts` through
  the registry [0051] allowed.
- The browser step fails only on a CSP violation or an empty `#root`.
- `ask_user`, `submit_plan` and `task_*` are on, wrapped [0053]; one mode, the plan a skill.

## Criterion

**Question.** Does an app written this way build, check, pack and run?

**Fixed.** `@mastra/core` 1.78.0, `zod` 4.6.5.

Proved already: the machine and its network ([0051]); step 13's use script. Read, not run: the SPA
mode leaves `/api` to the Worker.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Step 14 criteria 2 to 25, 32, in CI | Green |
| 2 | Live: the Ana request, four runs | The first turn builds; nothing looks outside `/home/user/app` |
| 3 | Live: `npm ci --ignore-scripts` of a granted library | Installs |
| 4 | Live: reload `/encomendas` of a routed app | The screen; `/api` stays the Worker |
| 5 | Live: the E2B template and `wrangler` packing | Size and start time noted |

## State

Proposed 2026-10-21. Founder: "SIM" on step 14's card, then "Sim, seguindo nossa metodologia e
optima implementação". Rows 2 to 5 await the live runs.
