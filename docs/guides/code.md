# Code guide

How Conexus code is written. This guide adapts the
[Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) (CC BY 3.0); where
it is silent, the Google guide applies. Its API rules adapt the
[Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/) (CC BY 4.0),
and errors follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). Biome owns formatting.

Each rule uses [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** state
a requirement; **should** and **should not** need a stated reason to break; **may** is a free choice.
Each rule ends with its enforcing machine, or "review". A should is engineering guidance, not
permission to change an approved contract, product decision or security boundary. Whether a
finding holds a merge is [delivery L12](delivery.md)'s call. Maintainers' skills, checked against
the installed version, own library usage; this guide decides what they leave open. Where a pstack
skill conflicts with a guide, the guide wins.

Owners next door: [architecture](../architecture.md) for concepts and composition,
[data](data.md), [security](security.md), [testing](testing.md), and [web](web.md).

## 1. Modules and owners

- **C3.** Inside a subject, imports **must** be relative and end in `.ts`. [dependency-cruiser]
- **C4.** Another subject or module **must** be reached only through its `public.ts`. The Builder
  **may** import the Hub; the Hub **must not** import the Builder: it declares the type it needs and
  `main.ts` hands it over. [dependency-cruiser]
- **C5.** Between programs, code **must** import by package name, such as `@conexus/hub-api`, never
  by path. [dependency-cruiser]
- **C6.** There **must not** be an import cycle, or a file loose in `hub/` or `builder/` outside a
  subject. [dependency-cruiser]
- **C7.** `platform/` **must not** import a subject or hold a subject file. [dependency-cruiser]
- **C8.** A module **must not** import another owner's table object; it calls the owner's
  operation, in the same transaction when needed. The exceptions are a foreign key and the file that
  gathers the schema for migrations. Hand-written SQL that reads another owner's table is for the
  reader. [dependency-cruiser, review]
- **C11.** Code **must** use named exports, and **must not** use a default export except where a
  tool requires one (Google). [Biome]
- **C12.** Code **must not** export a mutable binding (`export let`). [Biome]

## 2. Layers inside a module

- **C13.** A module **should** use route and store layers, with explicit dependencies and functions;
  coordination belongs in a service when it is needed, not after an arbitrary caller count.
  Failure: a handler with SQL and a transaction teaches the next subject to bypass its owner.
  [review]
- **C14.** A handler **must** take typed input and the session and return a value or throw a coded
  failure. It **must not** hold SQL, open a transaction or `catch`. [lint, review]

## 3. Classes and functions

- **C16.** Code **should** prefer functions, using a class when runtime identity or a library needs
  it. Failure: a structural Reply compiles but fails the library's `instanceof` check and becomes
  a 500. A restriction on static-only classes cannot prove runtime identity. [review]
- **C18.** A named top-level function **must** be a `function` declaration. An arrow **may** be used
  inside a function, for a callback, or as an operation in a module's frozen object. [Biome]
- **C19.** A function **should** take an object when positional arguments can be swapped. Failure:
  `grant(projectId, accountId)` accepts two strings in the wrong order without a compiler error.
  [review]
- **C20.** A function **must not** use `this` outside a class. [Biome]

## 4. Data modeling and types

- **C21.** A lifecycle **must** be a union discriminated on one literal field, with one owner of its
  transitions; a `switch` over it **must** end in `satisfies never`. [TypeScript, review]
- **C22.** Distinct states **should** be discriminated unions, including genuine absence or
  unavailability instead of invented zeroes or sentinels. Failure: a structural value represents a
  Reply that the runtime cannot recognize. `null` is not itself wrong when the domain admits it.
  [review]
- **C23.** An id **must** be a branded type created only by parsing. A port **must not** take an id
  as `string`. [TypeScript]
- **C24.** Code **must not** use `any` (use `unknown`), the non-null `!`, or `as` other than
  `as const`; `strict` stays on. [Biome, TypeScript]
- **C25.** Code **must** use `type`; `interface` only to augment a library or global declaration.
  [Biome]
- **C26.** Each fact **should** have one owner, including types, tables, state, constants and
  behavior; consumers derive it rather than inferring it from timing, text or a stream ending.
  A run's result comes from server settlement. Failure: two role maps diverge between server and
  screen, or a second state map contradicts the library's persisted state. [review]

## 5. Boundaries and the contract

- **C27.** External data **should** be parsed once at its boundary with Zod, then trusted inside:
  requests, database rows with narrowed types, configuration and Worker bindings, files, model
  output and vendor replies. Route/search parameters belong at that boundary; a return address is
  a same-origin path. Failure: casting `response.json()` accepts an empty id, an invalid row reaches
  business code, or an unchecked return address leaves the origin. Revalidating halfway through
  hides which boundary should have refused it. [review]
- **C28.** Each operation **must** be declared once, in Zod, in `packages/hub-api`: id, access,
  method, path, params, query, body, successes and failures. The server, the web and the OpenAPI
  document read it, and no table beside it lists operations. The OpenAPI document **must** be
  emitted, never written by hand. [CI]
- **C29.** An operation **must** be named by verb and noun in camelCase (`deleteProject`); that one
  string is its export, id, OpenAPI `operationId`, log field and query key. It **must** carry a
  one-sentence summary. [TypeScript]
- **C30.** An operation **should** expose a concrete capability with a consumer in this step, not
  generic `execute(slug, input)`, a caller-chosen URL/connection or arbitrary stored-object fetch.
  Failure: a generic executor bypasses the operation's admission; an unused deletion port creates
  a contract nobody exercises. knip detects dead exports, not every field's consumer. [review]
- **C31.** The boundary emitter **should** check the response with the contract's schema before
  sending it. `serve` does this; a Fastify type provider cannot validate runtime identity, access
  or cookies ([boundaries](../reference/boundaries.md)). Failure: a typed response reaches the
  browser without the shape promised by its contract. [review]

## 6. The API

- **C33.** Every route **must** declare one access kind, and the server **must** refuse to start with
  a route that has none, two, or one that does not exist. Only the access module **may**
  read credential cookies and the `Origin`, `Cookie` and `Sec-Fetch-*` headers. [boot check, review]
- **C35.** Paths **must** live under `/api/`, name resources with plural nouns and ids, and **must
  not** select an operation (an `{operationSlug}` variable or an `execute` segment). A path
  namespace grants nothing. [CI]
- **C36.** `GET` and `HEAD` **should** have no business side effects. Failure: a browser's link
  prefetch confirms an action the person never requested. [review]
- **C37.** A creation attempt **should** keep one `Idempotency-Key`, scoped to operation and subject;
  reusing it with another payload answers `IDEMPOTENCY_CONFLICT`. Retries, concurrent clicks,
  restart and response loss keep the same identity without a second effect; an ambiguous downstream
  effect is not replayed blindly. The client releases the key only after reading the Hub's whole
  success or a failure that settles the outcome (C48); no reply, a cut/unreadable/non-Hub reply or
  a nonsettling failure keeps it. Repetition is deliberate, safe and bounded, not a default.
  Failure: a cut reply followed by retry creates a second company. [review]
- **C38.** A command dependent on the state read **should** check its expected revision, such as
  `If-Match` with 412 for a stale write. The contract decides whether a read is cacheable.
  Failure: an old edit erases another person's newer change. [review]
- **C40.** Contract instants **should** use unambiguous UTC/RFC 3339 strings. Failure: `01/02/2026`
  swaps day and month between readers; a plain `z.string()` does not prove a valid date. [review]
- **C44.** Growing lists **should** be bounded and resumed with an opaque server continuation and
  server-chosen page size, exposing only declared filters. An encoded random row id is acceptable;
  the token is not authority, source identity or a snapshot. Founder, 2026-10-16: "1. a".
  Failure: loading every row exhausts memory, or a token from another company opens its list.
  [review]
- **C45.** The API **must not** carry a version. A removed field or operation **must** leave the
  contract, the server and the web together, with no deprecation period, and so **must** a changed
  payload. [TypeScript]

## 7. Errors

- **C48.** A failure **should** have one owner for code, category (`USER`, `THIRD_PARTY`, `SYSTEM`),
  status, Portuguese phrase, action text, action kind (`RETRY`, `SIGN_IN`, `NONE`) and `settles`:
  whether reading the whole answer settles a write so its attempt key can end. Screens read words
  by code and show an action only when the row requests it; a fixable failure says what to change.
  The approved exception stays: the not-found page offers "Voltar ao início" as `button-default`
  while its row keeps `NONE` (founder, 2026-10-15: "1 A"). Failure: an intermediate 503 ends the
  creation key, or a retry button promises recovery from a platform defect it cannot fix. [review]
- **C49.** Errors **should** be converted at boundaries, with typed results for refusals callers
  distinguish and one browser failure reader; vendor error types stay at their edge. Failure:
  a screen branches on a Portuguese sentence and breaks when the wording changes. [review]
- **C50.** Failure output **should** reach the central handler and logger, including a library's
  own router. Unknown errors keep their cause internally and become a `SYSTEM` failure, with
  mappings covering the library's statuses rather than just a known-code list. Failure: a router
  prints a database error containing a password hash to stderr. A log-format guard alone cannot
  prove all control paths reach it. [review]
- **C51.** Public errors **should** expose only `type`, `title`, `status`, `code` and trace id as
  `application/problem+json`, without a stack, provider message or parsed `detail`. Failure: a
  malformed URL receives Fastify's private JSON shape instead of the contract. [review]
- **C52.** Failure mapping **should** branch on stable fields: status, code, SQLSTATE and constraint
  name where needed, not message text. Failure: a refused database connection becomes
  `INTERNAL_UNEXPECTED` because the translator misses its class. [review]
- **C53.** A `catch` **must** rethrow, map at a vendor boundary or log; it **must not** be empty.
  [Biome]
- **C54.** The central owner **should** record requests and visible failures by code and correlation
  id, with route, status and duration for requests, and security events such as sign-in, refusal,
  session end and administrator change. No raw object is needed. Failure: duplicate `level` keys
  change the severity a reader sees. The existing log-line guard proves format only. [review]

## 8. Outside calls and time

- **C56.** Every outside system **must** have a port, which is a type, and one adapter; only the
  adapter **may** import the vendor library or `fetch`. [Biome, dependency-cruiser]
- **C57.** Work crossing a boundary **should** have a real budget covering lookup, connection and
  reply, propagating cancellation when supported; this includes library paths, spawned commands
  killed at deadline, request/connection timeouts and a bounded retry budget. Failure: a deadline
  covers only transactions while a pool read hangs, or a spawned `git` never terminates. Merely
  finding a timeout property cannot prove coverage. [review]
- **C59.** External replies **should** have a byte cap and stop reading at it, including any
  provider error body an adapter needs. Failure: an unlimited download fills the disk. [review]
- **C62.** Shutdown **should** use one path: stop accepting, drain live work and Builder turns within
  a deadline, then exit; a second signal exits immediately. Failure: deployment cuts a write or
  waits forever. [review]

## 9. State and concurrency

- **C63.** Durable state and waits for a person **should** live in their persistent owner, not in
  process-local mutable state; a write-once immutable token registry has a different lifetime.
  Failure: a second server cannot see the first server's `Map` and repeats its work. [review]
- **C65.** The data owner **should** serialize concurrent decisions and prove the race, rather than
  cover it with polling or retry. Failure: two executions create two first people despite workflow
  concurrency settings. [review]

## 10. Configuration

- **C67.** Configuration **must** be read in one place, parsed by one Zod schema; no other file
  **may** read `process.env`. The program **must** refuse to start on a missing or invalid value and
  name it. Code **must not** read or branch on `NODE_ENV`, which the image does not set; the Fastify
  and Node maintainers' skills call branching on it a bad practice. [Biome, boot check, CI job
  `image`]

## 11. Names and comments

- **C69.** Names **should** use consistent English domain vocabulary, one name per concept.
  Failure: `connection` and `model_connection` appear to be separate concepts and hide one owner.
  A naming-case rule cannot detect that meaning. [review]
- **C70.** Comments **should** explain a reason the code cannot show, and promises in comments,
  tools and skills stay within what mechanisms and tests prove. Failure: boundaries claims all
  output passes through the logger while a library still prints to stderr. [review]

## 12. One way, and no leftovers

- **C73.** A guard **should** address a demonstrated threat or failure and respect the native
  boundary. Failure: destroying a connection on every refusal turns an ordinary 404 into pool
  churn. This is not a ban on a preventive deadline already required by the contract. [review]
- **C74.** Nothing dead **may** stay: unused files, exports and dependencies leave, and no file is
  listed as an entry to escape that check. A compile-only file that [testing T9](testing.md)
  requires is an entry by rule: the compiler's entry point, imported by nothing. Founder,
  2026-10-15: "2. A". [knip, review]
- **C75.** Before a custom mechanism, its author **should** compare the native public API at the
  installed version and justify an exception beside the implementation. A correct native solution
  stays when a guide conflicts: record the conflict for closing; ask the founder when behavior or
  scope changes ([delivery L7](delivery.md)). Failure: using `internalAdapter` when `auth.api`
  already serves creates an unnecessary private dependency. [review]
- **C76.** A lint suppression **must** name its cause. The count of suppressions lives in a committed
  file that CI compares, so a pull request that adds one changes that file. [CI]
- **C77.** Line width and function and file size **must** have maxima in the Biome configuration,
  applied without suppression. [Biome]
