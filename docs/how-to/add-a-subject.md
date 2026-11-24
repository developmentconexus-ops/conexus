# Add a subject to the Hub

A subject is a folder that holds one product theme ([0003](../decisions/0003-repository-shape.md)):
its routes, tables, tests and a `public.ts`. This page lists what a new Hub subject with tables, an
agent tool and a screen touches, in order, and which part of the repository refuses a missing
step. Start from `apps/server/src/hub/lake/`, a complete one. `apps/server/src/hub/ontology/`
shows a subject that stops at the tables.

A step that says "nothing refuses it" is held by the review alone. Nothing refuses a subject
that has no `public.ts`, no explanation page or no line in [the architecture](../architecture.md), so
write those.

## Steps

1. **The card.** A step card in `docs/steps/` ([delivery L5](../guides/delivery.md)).
2. **The decision.** A record in `docs/decisions/` for a choice that is costly to undo, and its line in
   `docs/index.md`. `npm run docs` refuses a document with no line in the index.
3. **The contract.** `packages/hub-api/src/<subject>.ts`, each route by `defineOperation`
   (`packages/hub-api/src/operation.ts`), exported from `packages/hub-api/src/index.ts`. `npm run
   openapi` emits the contract, and `apps/server/src/openapi-contract.test.ts` compares the routes with it.
4. **The tables.** `apps/server/src/hub/<subject>/tables.ts`, with `pgSchema` and a row policy. Drizzle
   finds every `tables.ts` by the glob in `apps/server/drizzle.config.ts`. Run `npm run generate -w
   @conexus/server` to write the migration. `npm run migrations` checks it.
5. **The grants.** The role and grant list changes in a pull request of its own, with the founder's
   word ([data D11](../guides/data.md)), and `apps/server/database-grants.sql` follows. The catalog
   snapshot test `apps/server/src/platform/catalog.test.ts` fails when they differ.
6. **The isolation test.** One test that two companies never read each other's rows, as
   `platform/isolation-ontology.test.ts` does. Nothing refuses its absence.
7. **The door.** `hub/<subject>/public.ts` exports what other subjects may use, and
   `public-tables.ts` only when another owner needs a foreign key to a table
   (`identity/public-tables.ts`). dependency-cruiser refuses an import that goes around them
   (`subject-only-through-public`, `table-door-only-for-foreign-keys-and-schema`).
8. **The wiring.** `apps/server/src/main.ts` makes the subject and hands its door to the others. A job
   or a workflow is registered in `apps/server/src/conversations-of.ts` (`workflows`, `releaseFirst`).
   dependency-cruiser refuses a wiring that goes around the doors.
9. **The Builder's part.** `apps/server/src/builder/<subject>/`, the only place `@mastra/*` may be
   imported (`mastra-only-in-builder`). The tools are bound in `builder/conversation/builder.ts`,
   `builder/assistant/assistant.ts` and `builder/conversation/permissions.ts`, with their text in the
   prompt. The prompt tests and the recorded-model tests prove them.
10. **The screens.** `apps/web/src/hub/<subject>/`, its routes in `apps/web/src/routes/`, its lines in
    [the screens list](../reference/screens.md) and its layout tests. `web-tree-shape` refuses a folder
    in the wrong place, and `conexus-qa` walks the screens.
11. **The boundary.** A mechanism written by hand, past what a library does, gets a section in
    [boundaries](../reference/boundaries.md), and `npm run boundaries` checks it.
12. **The explanation.** A page in `docs/explanation/` for how the subject works, indexed in
    `docs/index.md`, and a short entry in `docs/architecture.md`.

## Check it

Run `npm run deps`, `npm run docs`, `npm run migrations` and `npm run check`.
