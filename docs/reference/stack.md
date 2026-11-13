# Stack

The card derives each unit's skills and reading list from the rows of the packages its folders
use, in the order of "Read first". A row with `Skill: none` is read from its source; memory is
not a source. No report lists the rows it read. This file owns where to read about a piece; the
guides own what we decided about it; [boundaries](boundaries.md) owns what we wrote over it.

`check-docs` refuses a dependency of any workspace without a row here, and a row that names
nothing the repository uses. The version is the one `package.json` and the lockfile pin; "the
reference pins X" marks a reference on another major. "Read first" names, in order, docs or skills
inside `node_modules`, the maintainers' skill, `llms.txt` or `.md` pages, the README. Mastra is
read in `node_modules` at the pin, and its own products (Mastra Code, Factory) at the reference shelf's tag for it; Cloudflare's vibesdk (`github.com/cloudflare/vibesdk`), the main reference
for Cloudflare and the AI build flow, at `9da158d8` from its own checkout; Conexus OS only with `git show e0353c36:<path>`, because a checkout's HEAD
can be another commit (one was at `729bdc5d`).
The pull request that bumps a Mastra pin refreshes the reference shelf and this file in the same
change.

| Piece | Used in | Read first | Skill | Reference | Decides | Trap |
| --- | --- | --- | --- | --- | --- | --- |
| `@mastra/core` | `apps/server/src/builder` | `node_modules/@mastra/core/dist/docs/`; skill; `mastra.ai/llms.txt` | `mastra` | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui/src/ui/domains/chat/services/transcript.ts:152` (`transcriptReducer`); OS `apps/hub/src/builder/conversation.ts` | 0027, 0050, C75, W7 | The shelf is at core 1.82.0, the pin |
| `@mastra/memory` | `apps/server/src/builder` | `node_modules/@mastra/memory/dist/docs/`; skill | `mastra` | OS `apps/hub/src/builder/conversation.ts` | 0010, 0011 | — |
| `@aws-sdk/client-s3` | `apps/server/src/builder/git/copy` | `node_modules/@aws-sdk/client-s3/README.md`; `developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/` | none | — | 0051 | R2 takes `region: 'auto'` and the account's endpoint; each call needs its own `abortSignal` |
| `e2b` | `apps/server/src/builder/machine`, `infra/e2b` | `node_modules/e2b/dist/index.d.ts`; `e2b.dev/docs` | none | vibesdk `worker/services/sandbox/BaseSandboxService.ts` (9da158d) | 0051 | `Sandbox.list` finds paused machines too; a template build is a paid call |
| `@mastra/e2b` | `apps/server/src/builder/machine` | `node_modules/@mastra/e2b/dist/`; skill | `mastra` | Mastra 1.82 (`mastra-1.82`) `mastracode/factory/src/workspace.ts:970-972` (`setOnStart`) | 0051 | `running` precedes `onStart`: gate the first tool on `start()` |
| `@mastra/evals` | `apps/server/src/builder/conversation` | `node_modules/@mastra/evals/dist/docs/`; skill | `mastra` | — | 0050 | Its `checks` need a Mastra with a storage, else Mastra prints a warning the test reporter refuses: give the test `InMemoryStore` |
| `@mastra/pg` | `apps/server/src/builder` | `node_modules/@mastra/pg/dist/docs/`; skill | `mastra` | — | 0010 | — |
| `@mastra/observability` | `apps/server/src/builder/mastra` | `node_modules/@mastra/core/dist/docs/references/` (observability, storage retention); `node_modules/@mastra/observability/dist/`; skill | `mastra` | Mastra Code `mastracode/sdk/src/index.ts:786-844` (`@mastra/core@1.82.0`) | 0068 | `PostgresStoreVNext` prints a raw warning on a pool it shares: the v-next domain goes in by the composite store. A list keeps its first 50 items unless `serializationOptions` says more. A logger of our own reaches the trace only through `__attachObservability` |
| `@mastra/server` | `apps/server/src/builder/conversation` | `node_modules/@mastra/server/dist/docs/`; skill | `mastra` | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui/src/ui/domains/chat/services/runtime.ts`; OS `apps/hub/src/builder/mastra-session-routes.ts` | 0050, S39 | `SERVER_ROUTES` holds every route: the Hub registers only the fixed list (`guard.ts`) |
| `@mastra/fastify` | `apps/server/src/builder/conversation` | `node_modules/@mastra/server/dist/docs/`; README | `mastra` | OS `apps/hub/src/builder/mastra-session-routes.ts` | 0050 | A stream ends only when its request leaves: the Hub's close ends the open ones |
| `@mastra/client-js` | `apps/web/src/builder/conversation` | `node_modules/@mastra/client-js/dist/docs/`; skill | `mastra` | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui/src/ui/domains/chat/services/agentControllerClient.ts` | 0050 | `subscribe` takes no signal: unsubscribe when the screen leaves |
| `ai` | `apps/server/src/builder`, `scripts` | `node_modules/ai/docs/`; `ai-sdk.dev/docs/*.md` | none | vibesdk `worker/agents/think/ask-questions-tool.ts:31` | 0027, T24 | — |
| `@ai-sdk/anthropic` | `apps/server/src/builder` | `node_modules/@ai-sdk/anthropic/docs/05-anthropic.mdx` | none | — | 0049, 0053, T24 | Models think adaptively unless sent `thinking: {type:'disabled'}` (PR 188). The stream sends one text block per cited span (PR 191); the reference line cited before is gone in 1.82, — until a study reopens it |
| `@ai-sdk/openai` | `apps/server/src/builder/model-accounts/openai` | `node_modules/@ai-sdk/openai/docs/03-openai.mdx` | none | Mastra Code `mastracode/sdk/src/providers/openai-codex.ts` (`@mastra/core@1.82.0`) | 0049, T24 | Pinned to 3.0.130, the 3.x whose `@ai-sdk/provider-utils` (4.0.61) is the one `ai` 6.0.309 installs; move it with `ai`. The ChatGPT subscription calls `chatgpt.com/backend-api/codex/responses` through `createOpenAI({ fetch }).responses`, which the Codex endpoint, not the public API, serves |
| `zod` | every workspace, `scripts` | `zod.dev/llms.txt` | none | — | C27, C28, W27 | — |
| `fastify` | `apps/server/src` | `node_modules/fastify/docs/`; skill; `fastify.dev/llms.txt` | `fastify-best-practices` | OS `apps/hub/src` | 0004 | — |
| `@fastify/helmet` | `apps/server/src/platform` | README | none | — | security | — |
| `helmet` | `apps/server/src/platform` | README | none | — | security | — |
| `@fastify/static` | `apps/server/src/platform` | README | none | — | — | — |
| `close-with-grace` | `apps/server/src/platform` | `node_modules/close-with-grace/AGENTS.md` | none | — | — | — |
| `pino` | `apps/server/src/platform` | `node_modules/pino/docs/asynchronous.md`; `node_modules/pino/docs/api.md` | none | — | — | Fastify already brings it; we import it for `pino.destination({ sync: true })`, the one stream the Hub log and the boot log share: `process.stdout` loses lines on `process.exit` with a full pipe |
| `drizzle-orm` | `apps/server/src` | `orm.drizzle.team/llms.txt` (not `llms-full.txt`, 3.7 MB) | none | — | 0005, 0037, data | — |
| `drizzle-kit` | `apps/server` | `node_modules/drizzle-kit/skills/` | `drizzle` (in the package, CLI only) | — | 0037, data | — |
| `pg` | `apps/server/src/platform`, `tests` | `node-postgres.com` | none | — | data | — |
| `@types/pg` | `apps/server` | follows `pg` | none | — | — | — |
| `better-auth` | `apps/server/src/hub`, `tests` | skill; `better-auth.com/docs/llms.txt` | `better-auth-best-practices`, `better-auth-security-best-practices`, `email-and-password-best-practices`, `organization-best-practices` | — | 0013, 0014, 0016, security | — |
| `@better-auth/core` | `apps/server/src/hub` | as `better-auth` | as `better-auth` | — | 0014 | — |
| `@better-auth/drizzle-adapter` | `apps/server/src/hub` | as `better-auth` | as `better-auth` | — | 0014 | — |
| `@neon/sdk` | `apps/server/src/platform` | skill; `neon.com/llms.txt` | `neon:neon`, `neon-postgres-agent-platforms` | — | 0021, 0040, 0048 | — |
| `@neondatabase/serverless` | `apps/server/src/platform`, `apps/edge/src` | skill; `neon.com/llms.txt` | `neon:neon-postgres` | — | 0008, 0009, 0041 | — |
| `libpg-query` | `apps/server/src/platform` | `node_modules/libpg-query/README.md` | none | squawk `4855ff5` (regex, misses `DO`, `GRANT`, `SECURITY DEFINER`); supabase-mcp `5ab9a98` `destructive-sql.ts:64` | data D6 | Load the WASM with `loadModule()` before the first `parseSync`: the Hub awaits it at start |
| `wrangler` | `apps/edge` | skill; `developers.cloudflare.com/workers/llms.txt` | `cloudflare:wrangler`, `cloudflare:workers-best-practices` | vibesdk `worker/index.ts:205` (dispatch), `worker/services/deployer/api/cloudflare-api.ts:131` (deploy), `space/src/space/durable-object.ts:752` (preview, Worker Loader) | 0018, 0042, 0047 | — |
| `react-email` | `apps/server/src/hub` | docs site | none | — | 0017 | — |
| `@react-email/render` | `apps/server/src/hub` | docs site | none | — | 0017 | — |
| `esbuild` | `apps/server` (the invitation e-mail bundle; `@mastra/e2b` imports it at runtime) | README | none | — | 0017 | — |
| `react` | `apps/web/src`, `apps/server/src/hub` | `react.dev/llms.txt` | none | — | web | — |
| `react-dom` | `apps/web/src`, `apps/server` | `react.dev/llms.txt` | none | — | web | — |
| `@types/react` | `apps/web` | follows `react` | none | — | — | — |
| `@types/react-dom` | `apps/web` | follows `react-dom` | none | — | — | — |
| `@tanstack/react-router` | `apps/web/src` | `node_modules/@tanstack/router-core/skills/router-core/`; `tanstack.com/router/latest/llms.txt` | `router-core` skills (in `@tanstack/router-core`) | OS `apps/web/src` | W8, W15, W17, W18, W28 | The installed `react-router` ships no `skills/`; its skills exist only in the TanStack repository |
| `@tanstack/router-plugin` | `apps/web` | `node_modules/@tanstack/router-plugin/skills/` | `router-plugin` (in the package) | — | W8 | — |
| `@tanstack/react-query` | `apps/web/src` | `tanstack.com/query/latest/llms.txt` (232 KB, by section) | none | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui` | W10, W11, W12 | — |
| `@base-ui/react` | `apps/web/src/ui`, `apps/web/src/main.tsx` | `node_modules/@base-ui/react/docs/`; `base-ui.com/llms.txt` | none | Mastra 1.82 (`mastra-1.82`) `packages/playground-ui` | 0033, W21, W22 | — |
| `@shadcn/react` | `apps/web/src/ui` | skill; `ui.shadcn.com/llms.txt` | `shadcn` | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui` chat pieces | 0033, V23 | Fields read `text-base md:text-body`, 16px under `md`, as shadcn's input does (PR 158, V18) |
| `tailwindcss` | `apps/web/src/brand` | `tailwindcss.com/docs` | none | Mastra 1.82 (`mastra-1.82`) `packages/playground-ui` | design | — |
| `@tailwindcss/vite` | `apps/web` | `tailwindcss.com/docs` | none | — | design | — |
| `class-variance-authority` | `apps/web/src/ui` | README | none | — | V23 | — |
| `clsx` | `apps/web/src/ui` | README | none | — | — | — |
| `tailwind-merge` | `apps/web/src/ui` | README | none | — | — | — |
| `lucide-react` | `apps/web/src` | `lucide.dev/llms.txt` | none | — | design | — |
| `react-markdown` | `apps/web/src/builder` | README | none | Mastra 1.82 (`mastra-1.82`) `packages/playground-ui/package.json:216` pins `^9.1.0`; `packages/playground-ui/src/ds/components/MarkdownRenderer/markdown-renderer.tsx` | 0033 | Streaming needs `remend`, tables need `remark-gfm` (PR 192) |
| `remark-gfm` | `apps/web/src/builder` | README | none | Mastra 1.82 (`mastra-1.82`) `markdown-renderer.tsx:5`, `:241` | 0033 | As `react-markdown` |
| `remend` | `apps/web/src/builder` | README | none | Mastra 1.82 (`mastra-1.82`) `packages/playground-ui/src/ds/components/MarkdownRenderer/markdown-renderer.tsx:6`, `:82` | 0033 | As `react-markdown` |
| `mermaid` | `apps/web/src/builder/conversation` | README; the configuration page of the pin | none | Open WebUI `src/lib/utils/index.ts:2155-2165,2305-2313`; LibreChat `client/src/hooks/Mermaid/useMermaid.ts:99-118` | — | `render` puts a `<style>` and `style` attributes on the page to measure, which `style-src 'self'` refuses and which changes the drawing: it runs only in the drawing frame (`diagram-frame.ts`), under its own policy (security S24) |
| `shiki` | `apps/web/src/builder/source` | `shiki.style/guide/regex-engines`; `shiki.style/guide/best-performance` | none | — (the cited line is gone in 1.82; `highlight.ts` there does not use shiki) | V3, C73, W11 | The JavaScript engine, never the wasm default (the page keeps `script-src 'self'`); `codeToTokens` mapped to classes, never `codeToHtml`; a grammar by `import()`, never precompiled |
| `react-hook-form` | `apps/web/src` | `react-hook-form.com/docs` | none | — | W23 | — |
| `@hookform/resolvers` | `apps/web/src/ui`, `packages/app/starter` | README | none | — | W23 | — |
| `@tanstack/react-table` | `packages/app/starter`, `packages/app/skills` | `node_modules/@tanstack/react-table/skills/` | `getting-started`, `table-state`, `migrate-v8-to-v9` (in the package) | — | — | v9: `useTable` and `tableFeatures`; the v8 `useReactTable` and `getCoreRowModel` that models know fail the check |
| `date-fns` | `packages/app/starter`, `packages/app/skills` | `node_modules/date-fns/docs/` | none | — | — | — |
| `react-day-picker` | `packages/app/starter` | README | none | — | — | — |
| `recharts` | `packages/app/starter`, `packages/app/skills` | README | none | — | — | shadcn's `ChartStyle` writes a `<style>` element, which the app's policy blocks |
| `react-resizable-panels` | `apps/web/src/ui`, `apps/web/src/builder` | README | none | OS `apps/web` | — | — |
| `@brazilian-utils/brazilian-utils` | `packages/hub-api`, `apps/web/src/hub` | README | none | — | — | — |
| `vite` | `apps/web` | `vite.dev/llms.txt` | none | — | 0002 | — |
| `@vitejs/plugin-react` | `apps/web` | `vite.dev/llms.txt` | none | — | 0002 | — |
| `vitest` | `apps/web` | `vitest.dev/llms.txt` | none | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui/vitest.config.ts` | 0034 | — |
| `@testing-library/react` | `apps/web` | docs site | none | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui` | T7 | — |
| `@testing-library/dom` | `apps/web` | follows `@testing-library/react` | none | — | T7 | — |
| `jsdom` | `apps/web` (Vitest's environment) | README | none | — | 0034 | — |
| `msw` | `apps/web` | docs site | none | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui`; the reference pins `^2.15.0` (`mastracode/factory-ui/package.json:49`) | 0034, T14 | — |
| `playwright-core` | `tests/e2e`, `apps/web` | `node_modules/playwright-core/lib/tools/skills/` | `playwright-cli` | Mastra 1.82 (`mastra-1.82`) `mastracode/factory-ui/e2e` | T23, T25 (the QA browser when `chrome-devtools-axi` cannot attach) | A library only: no `@playwright/test` |
| `typescript` | every workspace | handbook | `typescript-magician` | — | code | — |
| `@types/node` | every workspace | follows Node | none | — | — | — |
| `@biomejs/biome` | `biome.json`, `scripts/*.grit` | `biome explain <rule>`; `biomejs.dev` | none | — | code | A nursery rule is not stable: review each bump |
| `knip` | `knip.json` | `knip.dev` | none | — | L20 | — |
| `dependency-cruiser` | `.dependency-cruiser.cjs` | `dependency-cruiser.js.org` | none | — | W4, W7 | — |
| `@stryker-mutator/core` | `scripts/quality.ts`, `apps/*/stryker.config.json` | `node_modules/@stryker-mutator/core/README.md`; `stryker-mutator.io/docs` | none | — | L20, C26 | `inPlace` with `tempDirName` on another filesystem fails to restore the files: keep it inside the repository |
| `@stryker-mutator/vitest-runner` | `apps/web/stryker.config.json` | `node_modules/@stryker-mutator/vitest-runner/README.md` | none | — | L20 | It mutates in Node, so code that only a Vite build into a browser runs gets a verdict from the unit tests alone |
| `jscpd` | `scripts/quality.ts`, `.jscpd.json` | `node_modules/jscpd/README.md` | none | — | L20, C26 | Without `--absolute`, the file names are relative to a root that depends on how many paths it reads |
| `yaml` | `scripts` | README | none | — | — | — |
| PostgreSQL | everything; CI and `docs/how-to/local-database.md` | `postgresql.org/docs/18/` | `neon:neon-postgres` (Neon's) | — | 0020, 0037, data | — |
| Node | everything | `nodejs.org/llms.txt` | `node` | — | 0002 | — |
| Docker | `infra/hub.Dockerfile`, `infra/compose.yaml` | `docs.docker.com/llms.txt` | none | — | 0007, 0044 | — |
| cloudflared | `infra/compose.yaml` | `developers.cloudflare.com` Tunnel pages | none | — | 0007 | — |
| CLIProxyAPI | `infra/hub.Dockerfile` | its release's README | none | — | 0049 | — |
