# 0055. Apps are written against the platform contract, on a starter the Builder edits

## Context

Until step 13 an app had a rigid frame. The platform keeps what
[0019], [0018] and the dispatcher's CSP guarantee.

## Decision

- The contract owns `shared/operations.ts`, `server/handlers.ts`, the generated client, `worker.js`,
  the check and the packing. The rest is the model's, from an editable starter.
- Contract 1 allows zero or more operations [0019], in Zod, checked by the Worker. The upload sets
  `not_found_handling: 'single-page-application'`, `/api` staying in the Worker.
- No library gate: the model installs what an app needs; the check runs `npm ci --ignore-scripts`
  through the registry [0051] allows. Founder, 2026-10-22: "Como que esses outros aplicativos fazem,
  que já funcionam", then "A".
- `ask_user`, `submit_plan` and `task_*` are on, wrapped [0053]; one mode, the plan a skill.
- A tool row opens on what Mastra keeps, with no secret mask. Founder, 2026-10-22: "quando os
  conectores trouxerem credenciais ... o builder nem vai ver essa credencial".
- The boundary is the Projeto's machine and folder [0051]; fencing the shell was refused.

## Criterion

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Live: the Ana request, Claude once, Gemini 3.8 Flash High three times | The first turn builds; nothing looks outside `/home/user/app` |
| 2 | Live: reload `/encomendas` of a routed app | The screen; `/api` stays the Worker |
| 3 | Live: the E2B template and `wrangler` packing | Size and start time noted |

## Result

2026-10-22, https://github.com/developmentconexus-ops/conexus/pull/255, v0.14.1:

- Row 1 met: Claude once, Gemini three times after the release (founder: "B"); each built in the
  first turn, no path outside the app. Gemini run 2 stopped halfway through the plan and was
  saved as "montou"; cause unproved.
- Rows 2 and 3 met: check 35.3 s cold, version folder equal to the lab's, start 1.3 s.

**Not proved.** The end-of-turn `abort` with `retry`; which directory `list_files`, `file_stat` and
`grep` listed.

## State

Accepted 2026-10-22. Founder: "SIM" on step 14's card.
