# Boundaries: where Conexus keeps a hand-made piece over its library

[Code C75](../guides/code.md) says to use the library's own mechanism first. This file records each
mechanism that Conexus writes itself instead, with the library line it replaces and the reason. The
versions are the installed ones. When the library changes, reread the line it names.

## Better Auth 1.7.8

### The session's total lifetime

- **Library line.** `better-auth/dist/api/routes/session.mjs:155`. `getSession` reads, slides and
  ends a session by its own clock, on the idle deadline alone. The library has no total deadline.
- **Hand-made piece.** `apps/server/src/hub/identity/session.ts`. On the session `getSession`
  returns, it checks 8 h since creation. A session past that is revoked and read as signed out.
- **Why.** The founder's 8 hours in total (step 3, answer "4. A"). The test "prazo total" in
  `session.test.ts` fails without the piece. The idle deadline and the renewal stay the library's,
  by the founder's answer of 2026-10-15 ("1. A").

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

- **Library line.** `better-auth/dist/plugins/organization/has-permission.mjs:22`. The plugin
  checks a role inside each of its own endpoints, and its reads (`/organization/list-members`,
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
