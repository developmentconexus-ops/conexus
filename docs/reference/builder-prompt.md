# The Builder's prompt against Conexus OS

The Builder's system prompt is Conexus OS's `builder.md` at `e0353c36`, adapted only where the
architecture changed (step 14, U7; founder, 2026-10-21). This file owns the verdict on each line of
the OS prompt, in the test's words, and the architecture's reason for it; `apps/server/src/builder/conversation/test-prompt.ts`
holds each line's expected text, so CI never reads the OS. A step that changes the prompt changes this
table in the same pull request.

| OS lines | Verdict | Reason |
| --- | --- | --- |
| 1, 2, 5, 7 to 11, 19, 21, 23 to 27, 29 to 42, 44 to 47, 49, 50, 56 to 59, 63, 68 to 75 | `igual` | 0051 (19); `ask_user` and `task_*` on since step 14 U5; observational memory (`builder.ts:97`); `AGENTS.md` and `.conexus/memory/` read from `main` |
| 3, 6, 22 | `adaptada` | the Prévia sentences are back since step 14.1 (U4); no Integrações until step 19; line 6 says the person sees the reasoning and every tool row, since step 14.2 (V39) |
| 13 | `adaptada` | "The packages, the way screens call the server and the visual system are fixed" becomes "the platform contract is fixed; the starter is yours to change; prefer the starter's libraries" (0055; founder 2026-10-22, no library gate); `conexus-server` becomes `conexus-data` |
| 15 | `adaptada` | no Conexões until step 19: keeps "never invent data"; "Integrações" becomes "connectors, later" |
| 17 | `adaptada` | "Conexões" becomes "connectors"; plus step 13's security sentences (`instructions.ts:16-20`) |
| 43 | `adaptada` | no "Conexão" until step 19 |
| 51 | `condicional` | only while `main` is the starter |
| 52 | `adaptada` | the facts of step 14 U4's template |
| 53 | `adaptada` | the Conversa, the Prévia and the Código; no Diff tab (Alterações) and no Integrações, which return with their steps |
| 54, 61 | `adaptada` | "after four, Conexus saves the code as not built" (P3 A); with "updates the Prévia"; "a message closes an open question and continues this run" (step 14 criterion 18) |
| 64 to 66 | `tirada` | returns with step 19 |
| `prompt.ts:82-88` | `tirada` | `@mastra/code-sdk` is not in the Hub; step 13 does not merge on the machine (0051) |
