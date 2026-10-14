# Testing guide

What counts as proof. This guide adapts the automated testing section of the
[Microsoft Code With Engineering Playbook](https://github.com/microsoft/code-with-engineering-playbook/tree/main/docs/automated-testing)
(CC BY 4.0). Each rule uses the words of [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119):
**must** and **must not** are defects in review; **should** and **should not** need a stated reason
to break; **may** is a free choice. Each rule ends with the machine that refuses a violation, or
"review". How to use a test runner is its maintainers' skill.

## 1. The tools and where tests live

- **T1.** Logic and server tests **must** run on `node:test`, directly on the `.ts` file. Screen
  files (`.tsx`) **must** be tested with Vitest, Testing Library and MSW, and nothing else **may**
  use Vitest [0034]. [review]
- **T2.** A test **must** sit next to the file it tests: `x.test.ts` beside `x.ts`, `x.test.tsx`
  beside a screen. End-to-end scripts, few, **must** live in `tests/e2e` and run against a real Hub.
  [review]
- **T3.** Every run **must** have a global timeout: `node:test` has only a per-test one, so the CI
  job's `timeout-minutes` is the global one. [CI]
- **T4.** A skipped test **must** state why, starting with `opt-in:`; a suite that ran zero tests
  **must** fail; and a test **must not** pass silently when the service it needs is missing. [CI]

**Why.** The Fastify and Node maintainers' skills assume `node:test` and the Workers skill assumes
Vitest; this guide decides. A skipped test reports green and proves nothing, and a hung test without
a timeout names nothing.

**Right.** `test.skip('opt-in: needs a real E2B key')`.

**Wrong.** A database test that returns early when no database is configured.

## 2. What a test asserts

- **T5.** A test **must** enter through the server's public door: an HTTP request to a route, or the
  module's `public.ts`. It **must not** import the inside of the server. [lint]
- **T6.** A test **must** call the code the way its user does and compare the result with a literal
  value, never only "exists" or "truthy". It **should** follow arrange, act, assert, with one
  behaviour per test. [review]
- **T7.** A test **must** check behaviour, not text: it **must not** read production source, and a
  screen test **must** find by role and visible text, never by class. [review]
- **T8.** A route change **must** have an HTTP test that asserts the literal status and body. [review]
- **T9.** A type rule **must** have a file that fails to compile, such as forging a proof value.
  [TypeScript]

**Why.** A test that reads the source, checks only truthiness or reaches past the public door still
passes when the behaviour breaks, and breaks when the inside is refactored.

**Right.** `assert.deepEqual(await grant(input), { ok: false, reason: 'FORBIDDEN' })`; a `POST` with
a malformed id asserting 404 and its `code`.

**Wrong.** `assert.ok(source.includes('FORBIDDEN'))`, or a test that calls the handler function and
skips the route.

## 3. Refusals

- **T10.** Each refusal **must** have a negative test: another company, another Project, an expired
  or revoked session, a missing or foreign `Origin`. Isolation **must** also be tested by removing a
  `where` on purpose and by passing another company's id. [review]
- **T11.** A negative test **must** leave only together with the protection it proves. [review]
- **T12.** A protection **must** be proved by removal: take it out, and its test fails. [review]
- **T13.** An escape test for an app Worker, the build machine or the data path **must** try the
  direct path with the other layers off, on the real configuration. [review]

**Why.** A test of only the allowed path cannot fail when the check is removed.

**Right.** A member of another company reads the Project and gets 404, and the test fails when the
company filter is removed.

**Wrong.** A new access rule tested only with the owner.

## 4. Doubles and real services

- **T14.** A double **must** prove only the boundary it replaces. A claim about a real provider,
  model, E2B, Neon or Cloudflare **must** have evidence from that service, run with authority to call
  it. [review]
- **T15.** A fake of a protocol **should** be preferred over a mock of a function. A fake reply from
  the Hub **must** pass the contract's schema, so a stale fake fails. [review]
- **T16.** The test that closes a step **must not** fake its main path. [review]
- **T17.** There **must not** be a security bypass keyed on a test environment. [review]
- **T18.** A Builder change **must** be proved by a real turn with a real model and a real E2B
  machine, when authorized. A gate about the generated app **must** be closed by a real Project: a
  request in Portuguese, the real model, source the Builder wrote, the check, a Preview, use in a
  browser and the gate's negative case. [review]

**Why.** A mock proves the code calls the mock. Only the real dependency proves the system works, and
a hand-written example proves a platform mechanism, not that the Builder finds and uses it.

**Right.** A person asks for an app in Portuguese, and the Preview works in the browser.

**Wrong.** A green test with a scripted model offered as proof that the Builder builds an app.

## 5. Services, time and files

- **T19.** Each developer **must** have a disposable database, and each suite **must** create its own uniquely named database from the migrations, with no
  superuser, and drop it. [review]
- **T20.** A test **must** create and remove what it uses, bind port 0 when it listens, and **must
  not** sleep or poll with a timer to wait for a result. [review]
- **T21.** Test files **must** obey the same size limits as code. [Biome]
- **T22.** A generated artifact **must** be tested by parsing or running it, and expected output
  **must** change only by rerunning its generator. [review]

**Why.** A shared database hides which change broke it, and a database built from migrations proves
the migrations. A sleep makes a test slow on a fast machine and flaky on a slow one.

**Right.** A suite named after its file creates `conexus_test_projects_<random>` and drops it.

**Wrong.** A test that creates a role on a developer's main database, or waits two seconds for a
run to finish.

## 6. From change to proof

| Change | Proof |
| --- | --- |
| A function or module | Tests of its behaviour, beside it |
| A store or a migration | Tests against a disposable PostgreSQL, then a Neon branch before real data |
| A route | An HTTP test, with its negative cases |
| A screen | A screen test beside it; an end-to-end script for a path that crosses the Hub |
| A Builder change | A real turn, when authorized |
| A security rule | Negative cases, the escape test and proof by removal |
