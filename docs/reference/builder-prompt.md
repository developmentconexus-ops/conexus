# The Builder's prompt against Conexus OS

The Builder's system prompt is Conexus OS's `builder.md` at `e0353c36`, adapted only where the
architecture changed (step 14, U7; founder, 2026-10-21). This file owns the verdict on each line of
the OS prompt and the architecture's reason for it; `apps/server/src/builder/conversation/test-prompt.ts`
holds each line's expected text, so CI never reads the OS. A step that changes the prompt changes this
table in the same pull request.

| OS lines | Verdict | Reason |
| --- | --- | --- |
| 1, 2, 5, 7 to 11, 19, 21, 23 to 27, 29 to 42, 44 to 47, 49, 50, 56 to 59, 63, 68 to 75 | same | 0051 (19); `ask_user` and `task_*` on since step 14 U5; observational memory (`builder.ts:97`); `AGENTS.md` and `.conexus/memory/` read from `main` |
| 3, 6, 22 | adapted | no Prévia until step 14.1, which brings the sentences back; no Integrações until step 19 |
| 13 | adapted | "The packages, the way screens call the server and the visual system are fixed" becomes "the platform contract is fixed; the starter is yours to change; ask before adding a package" (0055); `conexus-server` becomes `conexus-data` |
| 15 | adapted | no Conexões until step 19: keeps "never invent data"; "Integrações" becomes "connectors, later" |
| 17 | adapted | "Conexões" becomes "connectors"; plus step 13's security sentences (`instructions.ts:16-20`) |
| 43 | adapted | no "Conexão" until step 19 |
| 51 | same, conditional | only while `main` is the starter |
| 52 | adapted | the facts of step 14 U4's template |
| 53 | adapted | the Conversa and Código; step 14.1 adds Prévia and Alterações |
| 54, 61 | adapted | "after four, Conexus saves the code as not built" (P3 A); without "updates the Prévia"; "a message closes an open question and continues this run" (step 14 criterion 18) |
| 64 to 66 | dropped | returns with step 19 |
| `prompt.ts:82-88` | dropped | `@mastra/code-sdk` is not in the Hub; step 13 does not merge on the machine (0051) |
