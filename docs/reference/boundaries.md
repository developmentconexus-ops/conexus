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
  (`better-call/dist/router.mjs:96`).
- **Hand-made piece.** `inLibrary` in `apps/server/src/hub/identity/auth.ts`. It maps every call
  into the library through `databaseFailure`, and a 5xx it cannot name to `DATABASE_UNAVAILABLE`.
- **Why.** [Code C50 and C52](../guides/code.md): the database is the library's one outside
  system, and the contracts promise 503. [Security S41](../guides/security.md): only a code leaves.
  The test "banco fora" in `database-down.test.ts` fails without the piece, and the test "senha que
  não grava" in `password-write.test.ts` fails without the option.

### The first person: one lock, and the library on our transaction

- **Library line.** `@better-auth/core/dist/context/transaction.mjs:65`. `runWithTransaction` opens
  the library's own unit of work, which holds no lock and reaches only the library's adapter.
- **Hand-made piece.** `createFirstPerson` in `apps/server/src/hub/identity/first-person.ts`. It
  opens one `database.command`, takes `pg_advisory_xact_lock` on the key `conexus.first-person`,
  and runs the library on that transaction with `runWithAdapter(adapterOn(auth, tx), …)`. The lock
  ends with the transaction.
- **Why.** [Code C64 and C65](../guides/code.md). Two runs at once must make one person and one
  link, and `forgetLinks` needs plain SQL in the same unit of work. The tests "ao mesmo tempo, com
  dois e-mails" and "ao mesmo tempo, a mesma pessoa duas vezes" fail without the lock, and "sem
  poder gravar o link" fails without the binding.

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
- **Hand-made piece.** `forgetLinks` in `apps/server/src/hub/identity/first-person.ts`. It deletes
  the person's links by their stored value, the person's id, in the same transaction as the new one.
- **Why.** [Code C64](../guides/code.md). The test "com a pessoa ainda sem senha" in
  `first-person.test.ts` fails without it.

### Sign-out: the row first, then the cookies

- **Library line.** `better-auth/dist/api/routes/sign-out.mjs:49-54`. `signOut` logs and swallows a
  failed delete of the session row, then expires the cookies anyway.
- **Hand-made piece.** `apps/server/src/hub/identity/routes.ts`, `deleteSession`. It calls
  `revokeSession` first, which fails loudly when the database refuses. Only after that does it call
  `signOut`, which expires the cookies.
- **Why.** [Security S20](../guides/security.md). With the library's order, a database failure
  answers "signed out" to a session that is still alive. The test "sair falha" in
  `session.test.ts` fails without the piece.
