# Code guide

How Conexus code is written. This guide adapts the
[Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) (CC BY 3.0); where
it is silent, the Google guide applies. Its API rules adapt the
[Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/) (CC BY 4.0),
and errors follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). Biome owns formatting.

Each rule uses the words of [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must
not** are defects in review; **should** and **should not** need a stated reason to break; **may** is
a free choice. Each rule ends with the machine that refuses a violation, or "review". The guide
states the target; code that departs from it is a defect. How to use Fastify, Zod, TypeScript or
Mastra is the maintainers' skills; this guide decides only what they leave open. A pstack skill a
Conexus skill names is a tool: where it conflicts with a guide, the guide wins.

Owners next door: [architecture](../architecture.md) for who owns each concept, [data](data.md),
[security](security.md), [testing](testing.md), and [web](web.md) for the screens.

## 1. Modules and owners

- **C1.** A subject folder **must** own its routes, tables, rules and tests, and only the owner
  **may** write its tables. A file **must** hold one subject and hide its decisions behind a small
  interface. [review]
- **C2.** A module **must** be a function that returns a frozen object of its operations, with its
  dependencies, the database included, passed in. Its state lives in the closure. [review]
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
- **C9.** `main.ts` **must** be a list of modules, so a missing dependency fails at boot, not on a
  request. [review]
- **C10.** Every subject that stores something **must** expose "delete what belongs to a company" in
  its `public.ts`, wired in `main.ts`, with its test. [review]
- **C11.** Code **must** use named exports, and **must not** use a default export except where a
  tool requires one (Google). [Biome]
- **C12.** Code **must not** export a mutable binding (`export let`). [Biome]

**Why.** A reader, person or agent, answers "where is X" by the subject's name and changes one file
for one decision. Without a machine, folders are only cosmetic. A closure keeps state private
without `this`, and nothing in Conexus is extended, so a class buys nothing.

**Right.**

```ts
export function createProjects(deps: { db: Db; clock: Clock }) {
  const store = createProjectStore(deps.db)
  return Object.freeze({ create: (input: CreateProject) => store.create(input) })
}
```

**Wrong.** `main.ts` composing every module inside one function kept past the size limit by a
suppression, or `companies/` importing `../projects/store.ts`.

## 2. Layers inside a module

- **C13.** A module **should** have two layers, route and store. A service **may** exist only for
  state or coordination that is not data. A wrapper with one caller **must not** exist, and a
  function **must not** run a whole lifecycle. [review]
- **C14.** A handler **must** take typed input and the session and return a value or throw a coded
  failure. It **must not** hold SQL, open a transaction or `catch`. [lint, review]
- **C15.** An abstraction **must** have at least two real callers. [review]

**Why.** A copied example spreads its shape. A handler with SQL teaches the next agent to put SQL in
handlers.

**Right.** `return projects.remove(admitted, input.projectId)`.

**Wrong.** A handler that opens a transaction, runs `select` and wraps it in `try`.

## 3. Classes and functions

- **C16.** A class **must** be one of four kinds: an error; a subclass of a library base; a nominal
  type with a `private` member that only its own module constructs; a value that hides a secret. A
  class **must not** exist only to group static members (Google). [review]
- **C17.** A value that hides a secret **must** keep it in a `#value` field; every other private
  member **must** use `private`. [review]
- **C18.** A named top-level function **must** be a `function` declaration. An arrow **may** be used
  inside a function, for a callback, or as an operation in a module's frozen object. [Biome]
- **C19.** A function **should** take one object when it takes more than two parameters, and **must
  not** take two neighbouring parameters of the same type a caller can swap (Effective TypeScript,
  "Avoid repeated parameters of the same type"). [review]
- **C20.** A function **must not** use `this` outside a class. [Biome]

**Why.** Better Auth, Documenso and the TypeScript compiler follow the same rule: functions and
closures, classes only where the language needs one. Swapped arguments of one type compile and fail
at runtime.

**Right.** `class Checked { private readonly checked = true }`, constructed only by admission, so no
other module can forge a checked read. `grant({ projectId, accountId })`.

**Wrong.** `grant(projectId, accountId)` with both typed `string`, or a class with mutable state that
a module could have been.

## 4. Data modeling and types

- **C21.** A lifecycle **must** be a union discriminated on one literal field, with one owner of its
  transitions; a `switch` over it **must** end in `satisfies never`. [TypeScript, review]
- **C22.** A type **must** make an illegal state unrepresentable. A variant **must not** be told
  apart by a sentinel such as `''`, `-1` or `null`, or by a set of booleans. Optional properties
  **should** be rare; a field that exists in one state belongs to that state's variant (Effective
  TypeScript, "Limit the use of optional properties"). [review]
- **C23.** An id **must** be a branded type created only by parsing. A port **must not** take an id
  as `string`. [TypeScript]
- **C24.** Code **must not** use `any` (use `unknown`), the non-null `!`, or `as` other than
  `as const`; `strict` stays on. [Biome, TypeScript]
- **C25.** Code **must** use `type`; `interface` only to augment a library or global declaration.
  [Biome]
- **C26.** A fact **must** have one owner: each type, state, failure code and constant lives in one
  place, and the rest is derived from it. A consumer **must** read a fact from its owner, never infer
  it from timing, message text or the end of a stream: a run's result is the server's settlement.
  [review]

**Why.** When the type allows only valid states, the compiler checks the domain, and a reader sees
the lifecycle in one place instead of in scattered `if` statements.

**Right.**

```ts
type ProjectState =
  | { kind: 'LIVE'; revision: SourceRevision }
  | { kind: 'DELETING'; requestedAt: Instant }
```

**Wrong.** `{ archived: boolean; deleting: boolean; revision: string }`, where `revision: ''` means
the Project was purged.

## 5. Boundaries and the contract

- **C27.** Data from outside **must** be parsed once, at the edge, with a Zod schema: request parts,
  rows, environment, files, model output and vendor replies. Inside, code **must** trust the type and
  **must not** validate it again. [review]
- **C28.** Each operation **must** be declared once, in Zod, in `packages/hub-api`: id, access,
  method, path, params, query, body, successes and failures. The server, the web and the OpenAPI
  document read it, and no table beside it lists operations. The OpenAPI document **must** be
  emitted, never written by hand. [CI]
- **C29.** An operation **must** be named by verb and noun in camelCase (`deleteProject`); that one
  string is its export, id, OpenAPI `operationId`, log field and query key. It **must** carry a
  one-sentence summary. [TypeScript]
- **C30.** An operation **must** have a real consumer, and a surface not built **must not** have a
  contract. There **must not** be a generic operation such as `execute(anySlug, anyInput)`, a
  caller-chosen URL or connection, or a fetch of any stored object by key. [review]
- **C31.** A response **must** be checked with the contract's schema before it is sent, without a
  type provider. [review]
- **C32.** A request body **must not** be spread into an insert; columns are named. [review]

**Why.** One declaration gives the server, the web and the documentation the same shape, so a change
that breaks a caller fails to compile instead of failing in production. One parse at the edge gives
the inside one trusted type; a second check hides which value is the truth.

**Right.** `const row = ProjectRow.parse(result.rows[0])`, then `row.revision` is a
`SourceRevision`.

**Wrong.** `const body = (await response.json()) as Account`, or a route that checks its body by hand
beside the schema.

## 6. The API

- **C33.** Every route **must** declare one access kind, and the server **must** refuse to start with
  a route that has none, two, or one that does not exist. Only the access module **may**
  read credential cookies and the `Origin`, `Cookie` and `Sec-Fetch-*` headers. [boot check, review]
- **C34.** Access checks (origin, caller) **must** run in `onRequest`, before the body is read.
  [review]
- **C35.** Paths **must** live under `/api/`, name resources with plural nouns and ids, and **must
  not** select an operation (an `{operationSlug}` variable or an `execute` segment). A path
  namespace grants nothing. [CI]
- **C36.** `GET` and `HEAD` **must not** change state. [review]
- **C37.** A `POST` that creates something **must** take an `Idempotency-Key`, scoped to the
  operation and subject. A reuse with another payload **must** answer `IDEMPOTENCY_CONFLICT`, and a
  duplicate **must not** create a second effect, and an ambiguous downstream effect **must not** be
  replayed blindly. [review]
- **C38.** A command that needs current state **must** carry the expected revision, or take
  `If-Match` and answer a stale one with 412. A cacheable read **should** send `ETag` and
  `Cache-Control`. [review]
- **C39.** A body **must** be a JSON object, never a top-level array. Fields **must** be camelCase;
  reusable schemas **must** have PascalCase domain names, never a table, component or provider name,
  and never a generic carrier such as `AnyResource`. [review]
- **C40.** Dates and times **must** be RFC 3339 strings in UTC. [review]
- **C41.** An unknown or partial value **must** be a state in the schema, never `null` or zero.
  [review]
- **C42.** A malformed path id **must** answer its declared code with no database query. A subject
  the caller may not know about **must** answer 404, as [security S10](security.md) says. [review]
- **C43.** A success **must** answer 200 with a body, 201 for a create, or 204 with none. A failure
  **must** use the status its failure row names: 400 malformed, 401 not authenticated, 403 refused on
  a disclosable subject, 404 absent or not disclosable, 409 conflict, 412 stale revision, 413, 415
  or 429 for size, media type or limit, 422 refused business input, 500 unexpected, 502 to 504 for an
  upstream. [review]
- **C44.** A list that can grow **must** return an opaque continuation token, with a page size the
  server chooses, and expose only the filters its operation declares. The token **must not** be
  authorization, a source identity or a snapshot. [review]
- **C45.** The API **must not** carry a version. A removed field or operation **must** leave the
  contract, the server and the web together, with no deprecation period, and so **must** a changed
  payload. [TypeScript]
- **C46.** Every request **must** get an id and one log line: route, status, duration and id.
  [review]
- **C47.** Health routes **must** exist with an access kind, and the liveness route **must not**
  touch the database. [review]

**Why.** A path that names the resource tells the reader and the access rule what is touched.
Retries happen on every network: the key makes a retry safe, and the revision makes a stale write
visible. One deploy carries both sides, so a version only keeps dead code.

**Right.** `{ "usage": { "kind": "UNAVAILABLE" } }`; a second `POST` with the same key and body
returns the first Project.

**Wrong.** `{ "usage": 0 }` when the provider reported nothing; `POST /api/execute/{operationSlug}`.

## 7. Errors

- **C48.** There **must** be one closed table of failure codes, each with a category (`USER`,
  `THIRD_PARTY`, `SYSTEM`), a status, the phrase a person reads and the action they can take.
  [review]
- **C49.** Code **must** throw only Conexus's failure class. A refusal its caller branches on **must**
  be a result union on `ok`. The browser **must** read every failure through one shared reader. The
  Builder **must** convert to Mastra's error only at its edge. [review]
- **C50.** One central handler **must** turn every error into a response; an unknown error becomes
  a `SYSTEM` failure with the original kept as cause. A library's error **must** be mapped by its
  status, not only from a list of known ones. [review]
- **C51.** An error response **must** carry only `type`, `title`, `status`, `code` and the trace
  id, as `application/problem+json`, and **must not** carry a stack or a `detail` a client parses.
  [review]
- **C52.** An error from a library or service **must** be mapped by a field it carries (status, code,
  SQLSTATE), never by its message text. [review]
- **C53.** A `catch` **must** rethrow, map at a vendor boundary or log; it **must not** be empty.
  [Biome]
- **C54.** A failure a person sees **must** leave a structured log line with its code and trace id.
  [review]
- **C55.** A platform failure **must** be fixed in code, never offered to the person as "try again".
  [review]

**Why.** One table gives every failure one meaning, one text for the person and one log line for the
developer. Mastra (`MastraError`, with a domain and a category) and Better Auth (one table of codes)
work the same way. Message text changes without notice.

**Right.** `throw new Failure('PROJECT_SOURCE_MOVED')`; a client that branches on `code`.

**Wrong.** `if (/already exists/.test(error.message))`.

## 8. Outside calls and time

- **C56.** Every outside system **must** have a port, which is a type, and one adapter; only the
  adapter **may** import the vendor library or `fetch`. [Biome, dependency-cruiser]
- **C57.** Every outside call **must** have a deadline covering lookup, connection and reply, and a
  cancel signal that aborts when the client leaves. [review]
- **C58.** Code **must** retry only an operation that is safe to repeat, with a maximum, and **must
  not** retry by default. [review]
- **C59.** An outside reply **must** have a size cap; reading stops at the cap, and the body of a
  non-2xx reply is not read. [review]
- **C60.** A spawned command, such as `git`, **must** have a deadline and be killed when it passes.
  [review]
- **C61.** The server **must** set explicit request and connection timeouts. [review]
- **C62.** There **must** be one shutdown path: stop accepting, wait for live work and Builder
  turns, then exit after a deadline; a second signal exits at once. [review]

**Why.** A slow vendor holds a request forever, and a huge body ends the process. Defences written
once, in the adapter, cannot be forgotten by the next caller.

**Right.**

```ts
const reply = await fetch(url, {
  signal: AbortSignal.any([AbortSignal.timeout(5_000), cancel]),
})
```

inside the vendor's adapter.

**Wrong.** `await fetch(url)` in a route.

## 9. State and concurrency

- **C63.** Two flows **must not** share mutable module state. For every `new Map`, top-level `let`
  and `setTimeout`, the question is: what happens to this on a deploy, or with two copies running? A
  deadline that waits for a person **must** live in the database. A write-once registry keyed by a
  token its own module mints is an owner. [review]
- **C64.** Every operation **must** reach the same end when it runs again after a crash. [review]
- **C65.** A race **must** be closed in the design, never covered by a poll or a retry. [review]
- **C66.** Code **must not** keep state beside what Mastra, E2B or PostgreSQL already holds.
  [review]

**Why.** Shared mutable state and polls hide the order of events, so a bug shows only under load,
after a restart, or when an update starts a second copy.

**Right.** The server publishes a run's end from the committed row, and the screen reads it.

**Wrong.** The server swallows a failed publish because a browser poll will read the run anyway.

## 10. Configuration

- **C67.** Configuration **must** be read in one place, parsed by one Zod schema; no other file
  **may** read `process.env`. The program **must** refuse to start on a missing or invalid value and
  name it. Code **must not** read or branch on `NODE_ENV`, which the image does not set; the Fastify
  and Node maintainers' skills call branching on it a bad practice. [Biome, boot check, CI job
  `image`]
- **C68.** A Worker **must** read its bindings through a schema the same way. The Fastify and
  Workers maintainers' skills disagree on configuration; this rule decides. [review]

**Why.** Two readers of the environment drift, and a value missing at boot is cheaper than one
missing on the first request that needs it.

**Right.** `const config = ConfigSchema.parse(process.env)` in the config module, and every other
file receives `config`.

**Wrong.** `process.env.DATABASE_URL ?? ''` inside a store.

## 11. Names and comments

- **C69.** Names **must** use the domain's words, one name per concept, in English: `camelCase`
  values and functions, `PascalCase` types, `CONSTANT_CASE` module constants, no `I` or `Impl`
  (Google). [review]
- **C70.** A comment **must** say a why the code cannot show and **must not** narrate it. A
  comment, a tool description or a skill that says "always", "only" or "never" **must** point to the
  line that enforces it and its test. [review]
- **C71.** An exported function **may** carry a JSDoc line when its name does not say enough.
  [review]

**Why.** When the code, the screen and the guides use one word, a search finds every place a concept
lives. A narrating comment drifts from the code at the first change.

**Right.** `ModelAccountId`; `// main moves only from the run's base.`

**Wrong.** `model_connection` beside `connection` for a company system; `// loop over the rows`.

## 12. One way, and no leftovers

- **C72.** One need **must** have one pattern: one way to handle an error, run a transaction,
  schedule a job, call the Hub from the web and draw each UI part. A second way **must** replace the
  first everywhere in the same step. Copy a neighbour only when it follows this guide. [review]
- **C73.** Code **must not** add a retry, timeout, fallback or guard for a failure nobody has seen.
  Reproduce it, then guard what you measured. [review]
- **C74.** Nothing dead **may** stay: unused files, exports and dependencies leave, and no file is
  listed as an entry to escape that check. [knip, review]
- **C75.** Native first: before writing a mechanism, its author **must** read how the library or
  platform does it, at its installed version. A hand-made piece kept because it beats the library
  **must** be recorded in a boundaries file of `docs/reference/`, created with the first exception,
  with the library's line. [review]
- **C76.** A lint suppression **must** name its cause. The count of suppressions lives in a committed
  file that CI compares, so a pull request that adds one changes that file. [CI]
- **C77.** Line width and function and file size **must** have maxima in the Biome configuration,
  applied without suppression. [Biome]
- **C78.** A repeated objective defect **should** become a check that fails. A custom check **must**
  name its defect, prove it refuses a bad case, and say when it is removed or revalidated. [review]

**Why.** Every second way and every speculative layer is code an agent copies and a reader must
understand. Deleting is the cheapest way to keep the base clear.

**Right.** A native `title` attribute beside the `Tooltip` piece is replaced everywhere by
`Tooltip`.

**Wrong.** A fix that adds far more than it deletes, to keep an old shape alive.
