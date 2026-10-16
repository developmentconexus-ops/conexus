# Boundaries: where Conexus keeps a hand-made piece over its library

[Code C75](../guides/code.md) says to use the library's own mechanism first. This file records each
mechanism that Conexus writes itself instead, with the library line it replaces and the reason. The
versions are the installed ones. When the library changes, reread the line it names.

## Better Auth 1.7.8

### The session's total lifetime

- **Library line.** `better-auth/dist/api/routes/session.mjs:178-200`. `getSession` renews a
  session once `updateAge` (60 s) has passed since the last renewal, to `expiresIn` (1800 s) from
  now. The library has no total deadline.
- **Hand-made piece.** `capAtTotalLifetime` in `apps/server/src/hub/identity/auth.ts`, the
  library's own `databaseHooks.session.update.before`. It caps a renewal's `expiresAt` at
  `createdAt` plus 8 h; the library then ends the session on its idle deadline (`session.mjs:155`).
- **Why.** The founder's 8 hours in total (step 3, answer "4. A"). The test "prazo total" in
  `session.test.ts`, a session read every 25 min through the library, fails without the hook
  (removal `session-total-lifetime`). The cost: once `expiresAt` is capped, the library's renewal
  test (`session.mjs:180`) holds on every read, so each read writes the row from `createdAt` plus
  7 h 31 min, the last 29 minutes (`expiresIn` minus `updateAge`, 1740 s). Before that, a read
  writes at most once a minute. Probed on PostgreSQL on 2026-10-15: two reads in the same second
  at 7 h 30 min 30 s wrote once, at 7 h 31 min 1 s twice. The idle deadline and the renewal stay
  the library's, by the founder's answer of 2026-10-15 ("1. A").

### A failure inside the library reads as the database's

- **Library line.** `better-auth/dist/api/routes/session.mjs`. `getSession` turns a failed query
  into a 500 `APIError` and drops its cause. `auth.handler` throws a raw query error, because
  `onAPIError: { throw: true }` keeps the router from printing it, row values and all, to stderr
  (`better-call/dist/router.mjs:93`).
- **Hand-made piece.** `inLibrary` in `apps/server/src/hub/identity/auth.ts`. It maps every call
  into the library through `databaseFailure`, and a 5xx it cannot name to `DATABASE_UNAVAILABLE`.
- **Why.** [Code C50 and C52](../guides/code.md): the database is the library's one outside
  system, and the contracts promise 503. [Security S41](../guides/security.md): only a code leaves.
  The test "banco fora" in `database-down.test.ts` fails without the piece, and the test "senha que
  não grava" in `password-write.test.ts` fails without the option.

### A library refusal becomes the Hub's code by one reader

- **Library line.** `better-call/dist/error.mjs:105-112`. `auth.api` throws an `APIError` with
  `statusCode` and `body.code`, while `auth.handler` answers a `Response` with the same body. The
  library maps neither to the Hub's failure codes.
- **Hand-made piece.** `refusalOf` in `apps/server/src/hub/identity/auth.ts`, with its two entry
  points, `refusedAs` for a thrown refusal and `refusedReply` for a refused reply. Each call names
  the refusals it expects, by the library's code or by status.
- **Why.** [Code C52](../guides/code.md): a failure is mapped by its code or status, never by its
  message, and each route answers only the codes its operation declares. The tests "convidar: o
  administrador pedindo dono" in `invitations.test.ts` and "sair falha" in `session.test.ts` cover
  it.

### Every library write joins one Hub transaction

- **Library line.** `@better-auth/core/dist/context/transaction.mjs:65`. `runWithTransaction` opens
  the library's own unit of work. The organization plugin's accept opens one more on
  `ctx.context.adapter`, the library's own connection
  (`better-auth/dist/plugins/organization/routes/crud-invites.mjs:291`), and on a failure resets the
  invitation in a second write (`:332-339`).
- **Hand-made piece.** `libraryCommandOn` in `apps/server/src/hub/identity/auth.ts`. It opens one
  `database.command` and runs the work in `runWithTransaction` on an adapter bound to that
  transaction, so every call the library makes inside, nested ones included, writes there.
  `createFirstPerson` in `first-person.ts` also takes `pg_advisory_xact_lock` on the key
  `conexus.first-person`, which ends with the transaction.
- **Why.** [Code C64 and C65](../guides/code.md), [data D22](../guides/data.md). A refusal anywhere
  in an accept leaves nothing, and `forgetLinks` needs plain SQL in the same unit of work. The test
  "aceitar: uma escrita recusada no meio do aceite" in `invitation-acceptance.test.ts` fails with
  `runWithAdapter`, which leaves the plugin's own transaction on another connection. The tests
  "ao mesmo tempo, com dois e-mails" and "ao mesmo tempo, a mesma pessoa duas vezes" in
  `first-person.test.ts` fail without the lock.

### Sign-in and the first password reach the library through a request we build

- **Library line.** `better-auth/dist/api/index.mjs:172`. The attempt limit runs only in the
  library's router, so an `auth.api` call skips it.
- **Hand-made piece.** `libraryRequest` in `apps/server/src/hub/identity/routes.ts`. It builds the
  `Request` for `auth.handler` from the Hub's own route, with only `origin`, `cf-connecting-ip`,
  `user-agent` and `cookie`.
- **Why.** The library's routes are not mounted (criterion 18), and the limit of
  [security S30](../guides/security.md) must still apply. The test "limite" in `identity.test.ts`
  fails without it.

### An earlier link stops working when a new one is given

- **Library line.** `better-auth/dist/db/internal-adapter.mjs:775`. The library deletes a link only
  by its identifier, which it stores as a hash of the token, so a link whose token is gone cannot be
  addressed.
- **Hand-made piece.** `forgetLinks` in `apps/server/src/hub/identity/auth.ts`. It deletes the
  person's links by their stored value, the person's id, in the same transaction as the new one.
- **Why.** [Code C64](../guides/code.md). The test "com a pessoa ainda sem senha" in
  `first-person.test.ts` and the test "link: passados 20 s" in `invitation-link.test.ts` fail
  without it.

### Sign-out: the row first, then the cookies

- **Library line.** `better-auth/dist/api/routes/sign-out.mjs:49-54`. `signOut` logs and swallows a
  failed delete of the session row, then expires the cookies anyway.
- **Hand-made piece.** `apps/server/src/hub/identity/routes.ts`, `deleteSession`. It calls
  `revokeSession` first, which fails loudly when the database refuses. Only after that does it call
  `signOut`, which expires the cookies.
- **Why.** [Security S20](../guides/security.md). With the library's order, a database failure
  answers "signed out" to a session that is still alive. The test "sair falha" in
  `session.test.ts` fails without the piece.

### Who may act on a company: admission over the plugin's roles

- **Library line.** `better-auth/dist/plugins/organization/has-permission.mjs:7`, which decides at
  `:31` through `hasPermissionFn` (`permission.mjs:2`). The plugin checks a role inside each of its
  own endpoints, and its reads (`/organization/list-members`,
  `/organization/list-invitations`) answer an outsider 403 and read the company's whole roster.
- **Hand-made piece.** `admit` in `apps/server/src/hub/identity/admission.ts`. It reads the
  person's member row and decides with the plugin's `defaultRoles[role].authorize`, through one
  table of actions. It answers an `Admitted` proof, which the Hub's reads and the invite require.
- **Why.** [Security S6, S7 and S10](../guides/security.md). An outsider, an unknown company and a
  role without the action get the same 404, with the reason only in the log. The tests "fora" in
  `companies.test.ts` and "convidar: o membro, ou quem é de outra empresa" in
  `invitations.test.ts` fail without it; `admission.check.ts` fails to compile when a proof can be
  forged.

### The lists the Hub reads itself, 50 rows a page

- **Library line.** `@better-auth/core/dist/db/adapter/factory.mjs:603`. A `findMany` without a
  limit reads `defaultFindManyLimit`, 100 rows. The plugin's `listInvitations` reads a company's
  invitations that way, in no order (`better-auth/dist/plugins/organization/adapter.mjs:784`), and
  `listMembers` pages by offset (`:186`).
- **Hand-made piece.** `readMemberships` and `readMembers` in
  `apps/server/src/hub/identity/companies.ts`, `readInvitations` and `readReceived` in
  `invitations.ts`. Each reads in a fixed order, 51 rows for a page of 50, and the next page starts
  after the last row's id.
- **Why.** A list past 100 rows would lose rows silently, and a page by offset shifts when a row
  arrives. The plugin's `getInvitation` also refuses an invitation that is no longer pending
  (`crud-invites.mjs:503`), and the screen must say it expired or was accepted. The test "fora: a
  segunda página" in `companies.test.ts` reads past the first 50 rows.

### Open invitations are counted under the company's lock

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-invites.mjs:167-172`.
  `invitationLimit` counts `findPendingInvitations`, which reads at most 100 pending rows in no
  order and drops the expired ones in JavaScript (`adapter.mjs:772`). Two invites at once both
  count before either writes.
- **Hand-made piece.** `checkRoom` in `apps/server/src/hub/identity/invitations.ts`, with
  `invitationLimit` set to infinity. After `lockCompany` takes the company row `FOR NO KEY UPDATE`,
  it counts the live pending rows of other addresses in SQL.
- **Why.** The founder's limit of 100 (step 4, answer 6), and [code C65](../guides/code.md). The
  tests "limite: com 100 vivos atrás de 100 vencidos" and "limite: com 99 vivos, dois convidantes
  juntos" in `invitations.test.ts` fail without the count and without the lock.

### A new invitation cancels the address's open one, expired or not

- **Library line.** `better-auth/dist/plugins/organization/adapter.mjs:753`. `findPendingInvitation`
  drops an expired row in JavaScript, so `cancelPendingInvitationsOnReInvite` cancels only an
  unexpired one (`crud-invites.mjs:163-166`). An expired row still holds the unique index of one
  pending invitation per address, and the new one fails on it.
- **Hand-made piece.** `openOf` in `apps/server/src/hub/identity/invitations.ts`. It finds the
  address's pending row with no clock and cancels it through `auth.api.cancelInvitation` before the
  plugin creates the new one.
- **Why.** The founder's "Convidar de novo" after 2 days (step 4, answer 4). The test "de novo: o
  anterior vencido há 2 dias, ou vencendo agora" in `invitations.test.ts` fails without it.

### Three reads through the library's internal adapter

- **Library line.** `better-auth/dist/db/internal-adapter.mjs:583`, `:667` and `:227`.
  `findUserByEmail`, `findCredentialAccount` and `listUsers` belong to the adapter the library
  gives its plugins, and the Hub reaches them through `auth.$context`, which the library documents
  for no application (native-first audit, finding 5). Creating a person has
  the public `auth.api.createUser` of the admin plugin
  (`better-auth/dist/plugins/admin/routes.mjs:195-201`), and the Hub uses it.
- **Hand-made piece.** `createFirstPerson` in `apps/server/src/hub/identity/first-person.ts` and
  `passwordLinkCommand` in `invitations.ts`. They read the person by e-mail, whether she has a
  password, and whether the installation has anyone, inside the command's transaction.
- **Why.** The public reads need a session (`/admin/list-users`) or return no password state, and
  these run before anyone is signed in. The reads join the command's transaction through
  `runWithTransaction`. When the library changes, reread `$context` and these three methods. The
  tests "com a pessoa ainda sem senha" in `first-person.test.ts` and "link" in
  `invitation-link.test.ts` cover them.

### A password link's token goes back to the command that asked for it

- **Library line.** `better-auth/dist/api/routes/password.mjs:82`. `requestPasswordReset` answers
  only a status and hands the token to `emailAndPassword.sendResetPassword` alone.
- **Hand-made piece.** `linkTokenOf` in `apps/server/src/hub/identity/auth.ts`. The configured
  `sendResetPassword` gives the token to the `AsyncLocalStorage` slot of the call that asked, and
  the command builds the link and the e-mail itself.
- **Why.** [Security S35](../guides/security.md): the token reaches only the command, never an
  e-mail sent inside the library's call or a log. Building the token ourselves would copy the
  library's private identifier format. The test "com a pessoa ainda sem senha" in
  `first-person.test.ts` and the tests "link" in `invitation-link.test.ts` read the link it returns.

### The invitation's e-mail leaves after the commit and is marked when answered

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-invites.mjs:226`. The plugin
  sends through `sendInvitationEmail` inside its own call, so inside the Hub's transaction, and it
  keeps no record that an e-mail left.
- **Hand-made piece.** The `createInvitation` route in
  `apps/server/src/hub/identity/company-routes.ts` sends after the commit, and `markMailed` in
  `invitations.ts` sets `mailed_at` once the provider answers delivered, queued or a permanent
  bounce. A replay with the same attempt key of a pending, unexpired, unmarked invitation answers
  the mail data again, so the route sends again: delivery is at least once. `mailed_at` is an
  additional field with `input: false`, which leaves it out of the plugin's request body
  (`better-auth/dist/db/to-zod.mjs:17`).
- **Why.** [Code C64](../guides/code.md). Sent inside the transaction, a slow provider holds the
  company's lock, and a rollback after the send mails an invitation that does not exist; sent after
  the commit with no record, a Hub stopped before the send leaves a replay that mails nothing
  (founder, 2026-10-15, "A"). The test "o Hub parou entre o convite e o e-mail" in
  `invitation-replay.test.ts` fails without the replay branch.

### The pace of invitations and of password links

- **Library line.** `better-auth/dist/api/index.mjs:172`. The library limits attempts only in its
  router, which `auth.api` skips, and it keys them by address and path.
- **Hand-made piece.** `checkPace` and the 20-second check of `passwordLinkCommand` in
  `apps/server/src/hub/identity/invitations.ts`. They count the person's invitations of the last
  60 s, under the person's row lock, and the person's links of the last 20 s, under an advisory
  lock on the e-mail.
- **Why.** [Security S28](../guides/security.md): behind the Tunnel the Hub keys on the account;
  the founder's numbers (step 4, answer 6). The tests "limite: o 11º convite" in
  `invitations.test.ts` and "link: dois pedidos juntos" in `invitation-link.test.ts` fail without
  them.

### Accepting: the recipient first, then the company's lock

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-invites.mjs:268-279`. The
  accept checks the invitation's state before its recipient, so another person learns whether it
  is open, and it counts the members with no lock, so two accepts at once both pass the limit.
- **Hand-made piece.** `acceptCommand` in `apps/server/src/hub/identity/invitations.ts`. It
  answers 404 to anyone but the recipient, locks the company row, and answers an invitation she
  already accepted with its company; otherwise it calls the plugin's accept.
- **Why.** [Security S10](../guides/security.md), [code C64 and C65](../guides/code.md). The tests
  "aceitar: 200 e um membro" and "aceitar: dois juntos" in `invitation-acceptance.test.ts` fail
  without it.

## Fastify 5.12.5

### `serve` parses the body and checks the reply

- **Library line.** `fastify/types/type-provider.d.ts:9-18`. A type provider types a request's parts
  from the route's schema, and `setValidatorCompiler` and `setSerializerCompiler`
  (`fastify/fastify.js:727`, `:740`) let a Zod schema validate the body and serialize the reply.
- **Hand-made piece.** `serve` and `partsOf` in `apps/server/src/platform/http.ts`. `partsOf` parses
  the path parameters first and refuses them with `NOT_FOUND`, then the `Idempotency-Key`, the query
  and the body, each refused with `REQUEST_MALFORMED`; `serve` parses the reply with `success.body`
  before it sends it, and sets the reply's cookies from the handler's `Answer`.
- **Why.** [Code C31 and C14](../guides/code.md). Through the generic `serve`, the provider types the
  body as `unknown`, and it has nothing for the `person` of the `session` access kind, the `Headers`
  or the cookies of an `Answer`. The compilers would replace only `bodyOf` and the reply's parse, at
  about the same number of lines (both step 3 reviews, 2026-10-15). The tests "corpo fora do esquema"
  and "o corpo lido pelo esquema da operação volta" in `http.test.ts` cover it.

### A write's signal follows the reply, not the request

- **Library line.** `fastify/lib/request.js:218-229`. `request.signal` aborts on the request's
  `close`, which Node emits once the body is read, not when the client leaves.
- **Hand-made piece.** `untilClientLeaves` in `apps/server/src/platform/http.ts`. It aborts when the
  reply closes before it finished.
- **Why.** With `request.signal`, every e-mail a write sends after reading its body is aborted
  (U4: the request's signal reaches the mail adapter). The test "registro" in
  `invitation-journey.test.ts`, against a Hub on a real socket, fails with it.

## Platform: pg 8.23.1, Drizzle 1.0.0-rc.4, Fastify 5.12.5 and Node 24

### A deadline on every checkout of a database connection

- **Library line.** `pg/lib/client.js:702`. `query_timeout` times one query and leaves the
  connection open with the query still running, and `pg-pool/index.js:392` returns such a client to
  the pool. `statement_timeout` and `idle_in_transaction_session_timeout`, set on `hub_runtime`, are
  the server's and cannot fire across a dead network.
- **Hand-made piece.** `openDatabase` in `apps/server/src/platform/database.ts`. On the pool's
  `acquire`, a 15 s timer destroys the client's socket; `release` clears it, and a lost or still
  open client is released with `true`, which removes it.
- **Why.** [Code C57](../guides/code.md): nothing native bounds a whole checkout on the client. The
  test "uma consulta da biblioteca sem resposta cai no prazo de 15 s" in `database.test.ts` fails
  without it (removal `library-read-deadline`).

### The Hub refuses to serve a database behind its migrations

- **Library line.** `drizzle-orm/pg-core/async/session.js:136`. `migrate()` compares the shipped
  migrations with `drizzle.__drizzle_migrations` inside itself and exports no check; only
  `readMigrationFiles` is public.
- **Hand-made piece.** `assertMigrated` in `apps/server/src/platform/database.ts`. It reads the name
  and hash of each applied migration from that table and compares them with the shipped files.
- **Why.** The Hub runs as `hub_runtime`, which may not migrate, and a Hub on an older schema must
  stop with `DATABASE_BEHIND` or `DATABASE_MIGRATION_CHANGED`. The piece depends on the table's
  shape, which is not a documented contract (`upgradeIfNeeded` changes it), so a Drizzle upgrade
  rereads it. The tests "atrasado" and "mudada" in `boot.test.ts` cover it.

### A malformed request is answered in problem+json with the security headers

- **Library line.** `fastify/fastify.js:963`. The default `clientErrorHandler` answers plain JSON
  with no security headers and no trace id, and `@fastify/helmet` sets its headers only in
  `onRequest` hooks (`@fastify/helmet/index.js:36`, `:52`), which a request that matches no route
  never runs.
- **Hand-made piece.** `answerClientError` and the `frameworkErrors` option in
  `apps/server/src/platform/http.ts`. Both answer `REQUEST_MALFORMED` in problem+json, apply the
  helmet middleware by hand and log the line of C46.
- **Why.** [Code C51](../guides/code.md) and [security S26](../guides/security.md). The tests
  "Content-Length errado", "linha malformada" and "caminho com porcentagem malformada responde 400
  em problem+json, com cabeçalhos e log" in `main.test.ts` cover it.

### A write's media type is refused with its origin, before the session is read

- **Library line.** `fastify/lib/handle-request.js:83-86`. Fastify answers 415
  `FST_ERR_CTP_INVALID_MEDIA_TYPE` for a body with a media type it has no parser for, before it
  reads the body; it parses `text/plain` by default unless `removeContentTypeParser` drops it.
- **Hand-made piece.** `checkWrite` in `apps/server/src/platform/access.ts`, with `hasBody` and
  `mediaType`. It refuses any write that is not `application/json` in the `onRequest` hook, beside
  the origin check.
- **Why.** [Security S24 and S25](../guides/security.md). Fastify's 415 comes after `onRequest`,
  so after the session is read, and a JSON write with an empty body would become
  `FST_ERR_CTP_EMPTY_JSON_BODY`. The native refusal is the smaller change (native-first audit,
  finding 1, 2026-10-15) and is not yet taken; the test "formulário vindo da própria página: 415
  REQUEST_MEDIA_TYPE_REFUSED" in `http.test.ts` covers both.

### One log line per request, by code

- **Library line.** `fastify/lib/log-controller.js:50` and `:68`. Fastify's request logging
  writes two prose lines per request, "incoming request" and "request completed".
- **Hand-made piece.** `logServed` in `apps/server/src/platform/http.ts`, with
  `disableRequestLogging`. It writes `REQUEST_SERVED` with the route, the status and the duration;
  `genReqId` and `requestIdLogLabel` stay native.
- **Why.** [Code C46 and C50](../guides/code.md): one line per request, and a message is a code. The
  test "log por pedido" in `main.test.ts` covers it.

### The mail provider's reply is read up to a cap

- **Library line.** Node 24's global `fetch` has no size cap on a reply. undici's
  `Agent({ maxResponseSize })` has one, but the `undici` bundled with Node refuses that dispatcher
  through the global `fetch` (`UND_ERR_INVALID_ARG`, native-first audit probe), so the cap would
  need a separate `undici` dependency. The Cloudflare SDK reads the whole body and retries twice.
- **Hand-made piece.** `cappedText` in `apps/server/src/platform/mail.ts`. It reads the reply
  stream and stops at 16 KiB.
- **Why.** [Code C59](../guides/code.md), and no dependency for about 12 lines. The test "correio:
  resposta acima de 16 KiB é MAIL_UNAVAILABLE, num só pedido" in `mail.test.ts` covers it.

## TanStack Query 5.104.0, Better Auth 1.7.8 and the browser's `fetch`

### The Hub client: one address, one reply schema, one closed failure table

- **Library line.** `@tanstack/query-core/src/queryOptions.ts:257-258` and
  `mutationOptions.ts:87-95` return their input unchanged. They derive no address and check no
  reply. Better Auth's `createAuthClient` (`client/config.mjs:38-55`) builds the library's own
  endpoint client, not the Hub's operations. The browser's `fetch`, `URL` and `Response.json` carry
  no contract.
- **Hand-made piece.** `apps/web/src/platform/hub.ts`: `hubFetch`, `HubFailure`, `failureOf`,
  `sentenceOf`, `readOrNotFound`, `idOrNotFound`, and `hubQuery`'s keys. Each is built on `fetch`,
  `URL`, `AbortSignal.timeout` and `any`, and Zod `safeParse`.
- **Why.** [Web W9](../guides/web.md) and [code C28](../guides/code.md): the screens call the
  operations of `packages/hub-api` and no second contract. A native HTTP status cannot say whether a
  write committed, so the failure table carries that outcome. The tests in `apps/web/hub.test.ts`
  (cut body, deadline, edge HTML, definite and uncertain failure) cover it.

### A write that must survive a lost reply

- **Library line.** `@tanstack/query-core/src/mutation.ts:295-313` defaults to zero retries.
  `mutationCache.ts:195-210` (`canRun`) serializes a `scope.id` and does not deduplicate or keep a
  key across an uncertain reply. React Hook Form 7.90.0 `isSubmitting` tracks a submission, not
  whether the Hub committed.
- **Hand-made piece.** `useAttemptKey` in `apps/web/src/platform/attempt-key.ts`. It keeps the
  attempt key until the Hub's answer settles the outcome.
- **Why.** [Code C37](../guides/code.md) and [web W24](../guides/web.md). The two-click and
  uncertain-reply tests in `create-company-form.test.tsx` and `invite-form.test.tsx` cover it.

## Node 24.21.0

### Test output that refuses a skipped test without a reason

- **Library line.** `node:test/reporters` `spec` and the `TestEvent` stream. Node formats the events
  and imposes no `opt-in:` reason or Conexus log-line format.
- **Hand-made piece.** `scripts/test-reporter.ts`. It composes `spec()` and adds the policy checks
  on the events.
- **Why.** [Testing T4](../guides/testing.md). It cannot see the pipes of a Hub spawned by a test,
  so `apps/server/src/platform/test-database.ts` holds a second entry. The tests in
  `scripts/test-reporter.test.ts` cover the policy.

### Removals: one protection taken out in a scratch copy, then its test

- **Library line.** Node `node:test` `run({ files, cwd, testNamePatterns, signal, timeout })` runs
  the test. Stryker core 10.0.0 supplies a sandbox, a dry run and `testRunner: 'command'`
  (`dist/src/test-runner/command-test-runner.js:9-12,45-52,114-143`), which reads one aggregate test
  from an exit code. Its instrumenter 10.0.0 has fixed replacement maps
  (`mutators/method-expression-mutator.ts:9-32,61-63`), `string-literal-mutator.ts:11-26` empties a
  literal, and `object-literal-mutator.ts:10-13` empties an object. None of them removes a named
  text, such as one SQL predicate or one adapter call, from one named file.
- **Hand-made piece.** `scripts/removals.ts` and `scripts/removals.json`. Each row replaces an exact
  text once in a scratch copy and runs the row's test. It reports `caught`, `survived`, `stale`,
  `unreachable` or `broken-baseline`. The manifest is loaded by one Zod schema.
- **Why.** [Testing T12 and T4](../guides/testing.md). Stryker's command runner does not tell zero
  real tests or an import failure apart from a pass, and its mutators cannot target a row. A custom
  Stryker mutator and runner could bridge that, but would not delete code. The planted outcomes in
  `scripts/removals.test.ts` cover the runner. Revalidate when Stryker can address a mutation
  by file and text.

### Radius: the card's grammar over Node's matcher

- **Library line.** `node:path` `matchesGlob(path, pattern)`, stable since Node 24.8.0. It reads
  `**`, `?`, classes and extglobs, treats `\` as no escape, and `*` skips dotfiles.
- **Hand-made piece.** `globOf` in `scripts/check-radius.ts`. It translates a cell of the card's
  radius table (`*`, `<placeholder>`, `{a,b}`, trailing `/`) into a pattern. The card parser, the
  `ambiguous-row` policy and the brace refusals stay ours.
- **Why.** [Delivery L7](../guides/delivery.md): the card names what a unit may touch, and a pattern
  that reads more than the card would let a change pass. The fixtures in
  `scripts/check-radius.test.ts` (dotfiles, literal metacharacters, `**`) cover the translation.

## remark-validate-links 13.1.0

### Documents: links, fragments and the Conexus policy

- **Library line.** `remark-validate-links/lib/index.js:189-203`. The plugin checks local files and
  headings. Headings of other files are checked only through the unified-engine file-set workflow
  (about 143 installed packages), and the single-file API does not check them. Undefined reference
  labels belong to another plugin.
- **Hand-made piece.** `scripts/check-docs.ts`. Inline links, reference definitions and fragments
  are checked by a small reader. The rest is Conexus policy: word ceilings, the index, rule ids,
  retired names, the one card, skill names.
- **Why.** [Delivery L24](../guides/delivery.md) and [code C75](../guides/code.md). The plugin would
  remove only the link reader, while `docs/index.md` coverage and code stripping still need ours.
  The planted cases (broken inline link, definition, same-file and cross-file fragment) in
  `check-docs.test.ts` cover them. Revalidate by 2027-04-13 or when the plugin can run in one
  file without the engine.
