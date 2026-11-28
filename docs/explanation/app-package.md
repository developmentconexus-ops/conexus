# The app package

`packages/app` (`@conexus/app`) is everything the Builder writes an app with. It has four parts:
the skills that teach the Builder, the starter every app begins from, the SDK the app's code
imports, and the check that decides whether a version may reach the app's address. This page
explains how each part works. The old Builder's turn, which ran them on a machine, left the
repository in the removal of the old harness; the package stays for the harness that replaces it. The platform side of the same contract, which the
dispatcher and the Hub read, lives in `packages/app-contract`
([the app contract and the dispatcher](app-contract-and-dispatcher.md)).

## Two packages, one contract

`@conexus/app-contract` is what the platform enforces: the `Manifest` schema and
`versionFiles`, `APP_LIMITS` (1,000 files, 10 MiB a version), `APP_CALL_LIMITS`, the page's
content security policy and `serveApp`, the Worker entry every app runs
(`packages/app-contract/src/index.ts`). `@conexus/app` is what the author writes against. Its
`defineOperations` and `defineRoles` only fix types; `query`, `write` and `defineHandlers` are
the server side; `createApi`, `can` and `readCaller` are the screen side
(`packages/app/src/index.ts`).

The same contract code runs in three places. The check validates the manifest with it on the
machine, the Hub validates it again when it receives the version
(`versionFiles` in `packages/app-contract`), and `serveApp` is both the probe the check runs and
the entry of the deployed Worker. An app never supplies its own Worker entry: the check writes
`export default serveApp({ operations, handlers, roles })` for it
(`packages/app/src/check/build.ts`).

## The skills

`packages/app/skills/` holds five skills:

- `conexus-plan-new` plans a new app: explore, find the data, design the screens, interview the
  person, write the plan under `.conexus/plans/` and ask for approval with `submit_plan`.
- `conexus-plan-change` does the same for a change to an existing app, tracing what depends on
  the part that changes.
- `conexus-build` builds an approved plan in small steps, each proved by `conexus_check`, and
  sends a difference the person would notice back to a new plan.
- `conexus-app` is how screens look and are composed: three forms (page, panel, system) and
  complete example pages in `references/`.
- `conexus-data` is the server side: operations in Zod, handlers, roles, connectors, failures
  and migrations.

`readSkills()` reads each folder from the server's own copy of the package
(`packages/app/src/skills.ts`). No agent loads them now; the harness that replaces the Builder
will. A test type-checks every example file in
`references/` against the starter, by the path its first line names
(`packages/app/src/skills.test.ts`), so an example that drifts from the kit fails CI.

## The starter becomes version 0

`packages/app/starter/` is a plain Vite project: React 19, TanStack Router and Query, Tailwind,
a shadcn-style kit on Base UI under `src/components/ui/`, Recharts and TanStack Table. It has its
own `package.json` and lockfile and one route, an empty state that says "Este app ainda está
vazio". It has no `shared/`, no `server/` and no generated client. Two details exist for the
content security policy: `main.tsx` tells Base UI not to write style elements, and
`vite.config.ts` sets `assetsInlineLimit: 0` because the policy allows no `data:` address.

The starter's files were committed as "Start the app" in a Git repository per Project, and a version's number counted the commits after that one, so the starter was version 0; that repository left with the old Builder.

The E2B template runs `npm ci`
on the starter's lockfile once at template build time, so a machine's npm cache already holds the
starter's packages and an install fetches only what the app added (`infra/e2b/template.ts`).

## The check

The template installs the check at `/opt/conexus/check`, read-only for the machine's user, with
copies of `packages/app`, `packages/app-contract` and `packages/connectors`, Wrangler, a headless
Chromium and prebuilt type declarations (`infra/e2b/template.ts`). The model cannot edit the
check or loosen its options. The check's TypeScript programs carry their own compiler options and
ignore the app's `tsconfig.json` (`packages/app/src/check/program.ts`).

It runs six steps in order (`STEP_NAMES` in `packages/app/src/check/report.ts`). A step that
fails skips the rest:

1. `dependências` runs `npm ci`, which refuses a `package.json` that disagrees with the lockfile,
   then copies the three platform packages into `node_modules/@conexus/`. An unreachable
   registry is the platform's failure, not the app's.
2. `manifesto` bundles a small program that imports `shared/operations.ts` and
   `server/handlers.ts` and calls `serveApp`, which refuses an operation without a handler, a
   handler without an operation, and, in an app with roles, an operation without roles. It writes
   `manifest.json` (operations' inputs and outputs must travel as JSON) and regenerates the
   screen client `src/conexus/api.gen.ts` on every run.
3. `tipos` runs two TypeScript programs in child processes: the screens with DOM types, and the
   server and shared code with Worker types only, so a handler that touches `document` fails.
4. `telas` runs the app's own `vite build`.
5. `worker` bundles the `serveApp` entry with `wrangler deploy --dry-run` and assembles the
   version folder `node_modules/.conexus/version/`: `manifest.json`, `worker.js` and `assets/`.
6. `navegador` serves the built screens with the dispatcher's content security policy, opens
   them in Chromium and fails on a policy violation or an empty `#root`. Console errors only
   inform.

The check prints one JSON report and exits 0, or exits 2 when the machine could not check at all
(`packages/app/src/check/main.ts`). The server reads exit 2 as `CHECK_PLATFORM_FAILED`. Each step
has 60 seconds and reports at most 20 problems (`CHECK_LIMITS`). The check never calls an
operation, touches data or looks at a real screen.

## How the check gates a version

The check ran on the Builder's machine, at the model's request and at the end of its turn, and
only a version whose report was `passed` went further. That machinery left the repository in removal of the old harness. What reaches the Hub is a `VersionFolder` of the manifest and base64 files, which the Hub
validates again through `hub.apps.sendFromBuilder`. What happens to the folder next is in
[the Hub side of an app](hub-apps.md).

A version therefore carries no source and no `node_modules`: only `manifest.json` (with the
migrations inline, read from the `migrations` export of `server/handlers.ts`), the minified
`worker.js`, and the built screens under `assets/`.

`scripts/app-pack.ts` is a second packer for hand-written test apps in `tests/apps/`. The
end-to-end tests and the publish workflow use it. It bundles with the
same Wrangler dry run and checks the same `versionFiles` and `APP_LIMITS`, so a test version has
the shape of a version a machine would send.
