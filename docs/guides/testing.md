# Testing guide

What counts as proof. This guide adapts the automated testing section of the
[Microsoft Code With Engineering Playbook](https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/automated-testing)
(CC BY 4.0). Rules read as the opening of the [delivery guide](delivery.md) says. [0034] owns the
choice of test tools.

## 1. The tools and where tests live

- **T3.** Every run **must** have a global timeout. [CI]
- **T4.** A skipped test **must** state why, starting with `opt-in:`; a suite that ran zero tests
  **must** fail; and a test **must not** pass silently when the service it needs is missing. [CI]

## 2. What a test asserts

- **T5.** A test **must** enter through the server's public door and **must not** import the inside
  of the server, except the test database, `platform/test-neon.ts` and `hub/identity/test-hub.ts`.
  [lint]
- **T6.** Tests **should** exercise observable consumer behavior beside its owner, comparing a
  result that distinguishes the failure rather than only existence. For a route, assert literal
  HTTP status and body; fake replies follow the contract. Generated artifacts are parsed or run,
  with expected output refreshed by their generator, not hand-edited. Browser checks of the built
  app live at its root; end-to-end scripts in `tests/e2e` exercise a real Hub. Failure:
  `assert.ok(result)` passes for `{ ok: false }`, or a text match approves an unusable artifact.
  Auxiliary existence assertions are not forbidden. [review]
- **T7.** A test **should** observe behavior, using roles and visible text on screens rather than
  implementation classes or production-source spelling. Failure: searching for `timeout` passes
  even when the command ignores it. A lint tool may plant source because source is its real input.
  [review]
- **T9.** A type rule **must** have a file that fails to compile.
  [TypeScript]

## 3. Refusals

- **T10.** Refusals **should** exercise unauthorized as well as authorized consumers: another
  company/Project, expired or revoked session, missing or foreign Origin, and foreign ids. Keep
  each negative case linked to its protection when replacing tests; remove it only with that
  protection or equivalent proof. Failure: a return-address guard has no case attempting a foreign
  origin, so its removal goes unnoticed. [review]
- **T12.** Registered mandatory protections **must** be proved by removal with `npm run removals`.
  The registry keeps only security protections. Founder, 2026-10-24 (`1a98660`).
  [`scripts/removals.ts`]
- **T13.** Isolation boundaries **should** be proved by a direct attack on the real Worker, build
  machine or data path with other layers disabled, when authorized. Failure: an outer layer
  refuses first and the test never reaches the wall it claims to prove. [review]

## 4. Doubles and real services

- **T14.** A proof **should** claim only the boundary actually exercised. Real provider, model,
  E2B, Neon and Cloudflare claims need authorized evidence from that service; serving, bundling
  and integration claims run on the Hub. Read files, modes and users the setup/deploy script
  actually creates, not values planted by the test. A Builder claim needs a real authorized turn,
  model and E2B machine; a generated-app gate needs a Portuguese request, generated source, check,
  Preview, browser use and negative case. Failure: a test plants a file's mode and then claims
  setup produced it, or a scripted model is presented as a Builder proof. A simulation does not
  close the real use required by [delivery L17](delivery.md). This guide grants no service access.
  No test reaches a third-party service: a double stands in, or the host is blocked (the leaked-password
  service, step 6 review). [review]
- **T24.** A double of a model provider **must** send what the installed provider adapter
  receives from the real service: recorded wire bodies (server-sent events, JSON) entering
  through a fake `fetch`, so that the installed SDK and Mastra build the parts. Each recording
  names the provider, the API, the SDK version and the date beside it, and carries invented
  content only (security S40). A part typed in the shape a screen wants is not a provider
  double. Any turn the screen draws from a stream is also read back after it ends, and the
  test asserts the two are equal. A double plays every tool the model is offered, not only
  those a card names, and the tests and QA read each tool's row on the screen. [review]
- **T26.** A test that feeds our code a shape a library emits (Mastra's controller events, stored
  messages, tool results; vibesdk's preview events) **must** load it with `nativeRecording(scenario)`
  (`test-recordings.ts`) from a recording that `npm run record` (`scripts/record.ts`) made from the
  installed library in `apps/server/src/platform/recordings/mastra/<scenario>.jsonl`, its first line
  naming library, version, source and date, and carrying invented content only (security S40). A
  literal of such a shape in a test is refused. Failure: every 14.2 screen Bloqueia passed on
  hand-made `suspended`, `result.action` and event orders Mastra never produces. [GritQL
  `scripts/library-shapes.grit`; review]
- **T17.** Tests **should not** change authority to pass. Failure: a test-only header still accepted
  in production bypasses the session. [code C67](code.md) restricts `NODE_ENV`, not every possible
  bypass spelling. [review]

## 5. Services, time and files

- **T19.** Each suite **should** create its own uniquely named disposable database from migrations,
  without superuser, and drop it. The approved exception remains: `migrate.test.ts` reads
  `pg_authid` as its test container's superuser to prove [data D32](data.md), skipping with an
  `opt-in:` reason without `CONEXUS_TEST_DATABASE_CONTAINER`. Founder, 2026-10-14: "2. A".
  Failure: one suite changes a shared role's password and breaks another suite. [review]
- **T20.** Tests **should** wait for an observable event, bind port 0 and isolate and clean up
  resources even after assertion failure. The approved acceptance-race observation through
  `pg_locks` remains (founder, 2026-10-16: "2. a"). Failure: without `finally`, a test leaves a
  role without its password. A blind ban on timers would not prove reliable waiting. [review]
- **T21.** Test files **must** obey the same size limits as code. [Biome]
- **T23.** Screen changes and their transitions **should** be looked at in a real browser, including
  narrow widths, both themes and a keyboard pass through focus stops. Captures are taken at 1366 and
  390 px; 320 px is the automated overflow check's. Look at captures and observe submit, redirect
  and refresh transitions; record a trace when a still image misses the state. Stable measurements
  become tests in the existing browser check. Failure: text and console inspection approve a login
  column only 8 px wide. The full matrix of captures belongs to T25's QA report; a builder looks at
  the states its unit changes, and a reviewer drives the browser where it doubts one. An expected
  refusal shown by the screen is not an uncaught error. [review]
- **T25.** A step that changes a screen **must** have a QA report at its candidate commit by an
  agent that did not build the step, following
  [`conexus-qa`](../../.agents/skills/conexus-qa/SKILL.md). Horizontal overflow and a phone field
  under 16px are the browser checks' (`layout.test.ts`, `fields.layout.test.ts`), not captures to
  read; a new screen state joins their sweep. [review]
- **T27.** Lines a change adds **must** be mutation-tested with the tests that own them, and every
  surviving mutant accounted for: a test that kills it, or a line in the report naming it
  equivalent, style-only or owned by a named test elsewhere. There is no score threshold: a score
  pushes tests to assert classes of output against T7. Failure: a guard tested with one file passes
  when the code checks "all files" instead of "any file". [`npm run quality`; review]

## 6. From change to proof

| Change | Proof |
| --- | --- |
| A function or module | Observable behavior beside its owner (T6) |
| A store or migration | Disposable PostgreSQL and an authorized real-service rehearsal when the card requires it (T14, T19) |
| A route | HTTP status/body and negative cases (T6, T10) |
| A screen | Screen test beside it, real browser and transitions (T23), end-to-end path when it crosses the Hub |
| A Builder change | Real turn when authorized (T14) |
| A security rule | Negative cases, isolation attack, registered removal proof (T10, T12, T13) |
