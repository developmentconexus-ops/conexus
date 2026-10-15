# Boundaries: where Conexus keeps a hand-made piece over its library

[Code C75](../guides/code.md) says to use the library's own mechanism first. This file records each
mechanism that Conexus writes itself instead, with the library line it replaces and the reason. The
versions are the installed ones. When the library changes, reread the line it names.

## Better Auth 1.7.8

### The session's deadlines, read by the database clock

- **Library line.** `better-auth/dist/api/routes/session.mjs:155`. `getSession` ends a session when
  `expiresAt < new Date()`, which uses the process clock. Before that check, it renews the session
  with the process clock too. The library has no total deadline.
- **Hand-made piece.** `apps/server/src/hub/identity/session.ts`. The session is read with
  `disableRefresh`. One query then decides by the database's `now()` whether the session ended,
  either 1800 s idle or 8 h since creation. The same query decides whether the session is due for
  renewal. The library renews the session only when that query says so.
- **Why.** [Security S18](../guides/security.md) puts both deadlines on the database clock. The
  tests "prazo total" and "relógio do banco" in `session.test.ts` fail without the piece.

### Sign-out: the row first, then the cookies

- **Library line.** `better-auth/dist/api/routes/sign-out.mjs:49-54`. `signOut` logs and swallows a
  failed delete of the session row, then expires the cookies anyway.
- **Hand-made piece.** `apps/server/src/hub/identity/routes.ts`, `deleteSession`. It calls
  `revokeSession` first, which fails loudly when the database refuses. Only after that does it call
  `signOut`, which expires the cookies.
- **Why.** [Security S20](../guides/security.md). With the library's order, a database failure
  answers "signed out" to a session that is still alive. The test "sair falha" in
  `session.test.ts` fails without the piece.
