# Boundaries: where Conexus keeps a hand-made piece over its library

[Code C75](../guides/code.md) says to use the library's own mechanism first. This file records each
mechanism that Conexus writes itself instead, with the library line it replaces and the reason. The
versions are the installed ones, except five candidates read from the npm registry and not
installed: Stryker 10.0.0, remark-validate-links 13.1.0, the Cloudflare SDK 7.3.0, zod-openapi 6.0.2
and @asteasolutions/zod-to-openapi 9.1.0. When the library changes, reread the line it names. Every
piece of this file that a row of `scripts/removals.json` protects names that row, and its test
"fails without" the piece; a piece whose tests only "cover" it has no row. The rows this file does
not name protect Hub rules that are not boundaries over a library: the mail adapter's refusal of a
bounce, the replay of an attempt key, that only the Operations Central creates a company, the state
of a listed invitation, the log line of an undeclared failure, and a write refused for its media type
or its origin.

## GitHub Actions and git

- **Native candidates.** GitHub Actions' `$GITHUB_STEP_SUMMARY` and `git diff --numstat` can display a total, but neither interprets the card's per-unit folders, budgets, test exclusions and generated-file exclusions.
- **Hand-made piece.** `scripts/change-budget.ts` reads the step card and numstat, groups changed source lines by unit folder, excludes tests/generated output and prints the total and each unit against its budget. `scripts/check-radius.ts` reads the declared radius and reports departures without failing.
- **Why.** Delivery L2 says CI prints the size; L7 says radius departures are reported rather than stopped. The native candidates cannot resolve card-specific unit boundaries or budget text without this parser. Both checks append to the native step summary; neither is a gate.

## Better Auth 1.7.8

### The session's total lifetime

- **Library line.** `better-auth/dist/api/routes/session.mjs:178-200`. `getSession` renews a
  session once `updateAge` (60 s) has passed since the last renewal, to `expiresIn` (1800 s) from
  now. The library has no total deadline. It tests the stored expiry (`session.mjs:155`) before it
  renews, so a renewal it shortens into the past still returns the session it read.
- **Hand-made piece.** `capAtTotalLifetime` in `apps/server/src/hub/identity/auth.ts`, the
  library's own `databaseHooks.session.update.before`. It caps a renewal's `expiresAt` at
  `createdAt` plus 8 h; the library then ends the session on its idle deadline (`session.mjs:155`).
  `createSessionReader` in `session.ts` also answers "signed out" to a session read at `createdAt`
  plus 8 h or later. Both read the total from `endOfLifetime`.
- **Why.** The founder's 8 hours in total (step 3, answer "4. A"). The test "prazo total" in
  `session.test.ts`, a session read every 25 min through the library, fails without the hook: the
  row stays (removal `session-total-lifetime`). The cost: once `expiresAt` is capped, the library's
  renewal test (`session.mjs:180`) holds on every read, so each read writes the row from
  `createdAt` plus 7 h 31 min, the last 29 minutes (`expiresIn` minus `updateAge`, 1740 s). Before
  that, a read writes at most once a minute. The idle deadline and the renewal stay the library's,
  by the founder's answer of 2026-10-15 ("1. A").
- **Why the read too.** A release without the hook (v0.3.1 and earlier) renews to 30 min from now
  at any age under 8 h, so its rows end up to 8 h 30 min after their creation. The hook sees such a
  row only after the library has accepted it. A data migration that clamps `expires_at` does not
  close this: `infra/deploy.sh` runs `migrate` while the earlier Hub still serves, and it brings the
  earlier image back when the new one is not healthy, after the migration ran once. The test
  "versão anterior" in `session.test.ts`, a row renewed at 7 h 59 min and read at 8 h 1 min, fails
  without the check (removal `session-total-at-read`). Remove it with its removal row once no
  release without the hook can start on this database: 30 min after such a release last served, no
  row of its own can be open.

### A failure inside the library reads as the database's

- **Library line.** `better-auth/dist/api/routes/session.mjs:231-232`. `getSession` turns a failed
  query into a 500 `APIError` and drops its cause. `auth.handler` throws a raw query error, because
  `onAPIError: { throw: true }` keeps the router from printing it, row values and all, to stderr
  (`better-call/dist/router.mjs:93`).
- **Hand-made piece.** `inLibrary` in `apps/server/src/hub/identity/auth.ts`. It wraps the session
  read (`session.ts`) and the route calls (`routes.ts`), mapping a failure through
  `databaseFailure` and a 5xx it cannot name to `DATABASE_UNAVAILABLE`. A library command goes
  through `libraryCommand`, which `databaseFailure` maps in the database module.
- **Why.** [Code C50 and C52](../guides/code.md): the database is the library's one outside
  system; unavailable SQLSTATEs map to 503 (`DATABASE_UNAVAILABLE`), while a refused write or
  unexpected database error is 500 (`INTERNAL_UNEXPECTED`). [Security S41](../guides/security.md):
  only a code leaves. The test "banco fora" in `database-down.test.ts` fails without the piece
  (removal `library-failure-is-database`), and the test "senha que não grava" in
  `password-write.test.ts` fails without the option (removal `library-errors-thrown`).

### A library refusal becomes the Hub's code by one reader

- **Library line.** `better-call/dist/error.mjs:97-116`. `auth.api` throws an `APIError` with
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
  `createFirstPerson` in `first-person.ts` also takes `transactionLock` (`database.ts`, a
  `pg_advisory_xact_lock`) on the key `conexus.first-person`, which ends with the transaction.
- **Why.** [Code C37 and C65](../guides/code.md), [data D22](../guides/data.md). A refusal anywhere
  in an accept leaves nothing, and `forgetLinks` deletes through the same transaction. The test
  "aceitar: uma escrita recusada no meio do aceite" in `invitation-acceptance.test.ts` fails with
  `runWithAdapter`, which leaves the plugin's own transaction on another connection (removal
  `accept-one-transaction`). The tests "ao mesmo tempo, com dois e-mails" and "ao mesmo tempo, a
  mesma pessoa duas vezes" in `first-person.test.ts` fail without the lock (removal
  `first-person-lock`).

### A company with no member and its first owner's invitation, through the plugin's adapter

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-org.mjs:74-100`.
  `createOrganization` always writes the caller as a member with `creatorRole`. The invitation
  endpoints admit only a member of the company (`routes/crud-invites.mjs:93-100` to create and
  resend, `:430-434` to cancel). `getOrgAdapter`, exported by the plugin (`index.mjs:1-4`), writes
  the same rows without those checks (`adapter.mjs:141`, `:352`, `:728`, `:793`), on
  `getCurrentAdapter`, so inside `runWithTransaction` on the Hub's transaction.
- **Hand-made piece.** `organizationAdapter` in `apps/server/src/hub/identity/auth.ts`, on the
  operator's path only: `registerCompanyOn` and `renameCompanyOn` in `clients.ts`, and the first
  owner's invitation, its cancel and its renewal when the admission is the operator's
  (`OwnerInviterProof`) in `invitations.ts` and `invitation-management.ts`. The Hub's admission
  decides who writes (`admitOperator`, `admitInviter`), the role is only owner, and a renewal writes
  its expiry from the plugin's option (`invitationExpiry` in `auth.ts`). A member's invitation,
  cancel and renewal go through the endpoints, `auth.api.createInvitation`, `cancelInvitation` and
  `createInvitation` with `resend: true`, which own the roles, the member check and the expiry, as
  in step 4.1. On the operator's path the adapter runs none of the endpoints' hooks: an
  `organizationHooks` invitation hook, `sendInvitationEmail` or `cancelPendingInvitationsOnReInvite`
  turned on later would be bypassed there, and none is on. The call carries one `@ts-expect-error`:
  the parameter is typed `AuthContext<BetterAuthOptions>`, which no configured auth's context
  matches.
- **Why.** Step 4.2: the company is born at the Operations Central with no member, and Conexus never
  becomes one, so the operator invites the first owner without a membership, which no endpoint
  admits. Members keep the native endpoints: the founder's answer A on the 4.2 code audit,
  2026-10-17 ([delivery L12](../guides/delivery.md)). "convidar: o administrador pedindo dono…" in
  `invitations.test.ts` fails when a member's invitation is written by the adapter instead (removal
  `invitation-member-native-endpoint`): the Hub no longer checks the creator role or an existing
  member itself. "renovar: o administrador renovando o convite de um dono…" fails when a member's
  renewal skips the endpoint (removal `invitation-member-native-renewal`). A member's cancel has no
  such row: the admission already requires `invitation: ["create"]`, every default role that holds
  it also holds `cancel`, and the endpoint writes the same status, so no test can tell the endpoint
  from the adapter there. The test "sem membro" in `hub/operations/clients.test.ts` fails when the
  company is created by the endpoint (removal `operator-not-member`); "recusas" fails when the
  adapter writes outside the Hub's transaction (removal `client-one-transaction`). When the library
  changes, reread `getOrgAdapter`'s signature and these four methods.

### Sign-in and the first password reach the library through a request we build

- **Library line.** `better-auth/dist/api/index.mjs:165-173`. The attempt limit runs in the
  router's `onRequest`, so an `auth.api` call skips it.
- **Hand-made piece.** `libraryRequest` in `apps/server/src/hub/identity/routes.ts`. It builds the
  `Request` for `auth.handler` from the Hub's own route, with only `origin`, `cf-connecting-ip`,
  `user-agent` and `cookie`.
- **Why.** The library's routes are not mounted (criterion 18), and the limit of
  [security S30](../guides/security.md) must still apply. The test "limite: a 11ª tentativa" in
  `identity.test.ts` fails when sign-in goes through `auth.api` instead (removal
  `sign-in-through-router`).

### An earlier link stops working when a new one is given

- **Library line.** `better-auth/dist/db/internal-adapter.mjs:775`. The library deletes a link only
  by its identifier, which it stores as a hash of the token, so a link whose token is gone cannot be
  addressed.
- **Hand-made piece.** `forgetLinks` in `apps/server/src/hub/identity/auth.ts`. It deletes the
  person's links by their stored value, the person's id, with Drizzle's `delete` in the same
  transaction as the new one.
- **Why.** [Code C37](../guides/code.md). The test "com a pessoa ainda sem senha" in
  `first-person.test.ts` fails without it (removal `first-person-forgets-earlier-link`). The
  invitation password command consumes its reset token in the same transaction; it sends no link.

### Sign-out: the row first, then the cookies

- **Library line.** `better-auth/dist/api/routes/sign-out.mjs:49-54`. `signOut` logs and swallows a
  failed delete of the session row, then expires the cookies anyway.
- **Hand-made piece.** `apps/server/src/hub/identity/routes.ts`, `deleteSession`. It calls
  `revokeSession` first, which fails loudly when the database refuses. Only after that does it call
  `signOut`, which expires the cookies.
- **Why.** [Security S13](../guides/security.md). With the library's order, a database failure
  answers "signed out" to a session that is still alive. The test "sair falha" in
  `session.test.ts` fails without the piece (removal `sign-out-row-first`).

### Who may act on a company: admission over the plugin's roles

- **Library line.** `better-auth/dist/plugins/organization/has-permission.mjs:7`, which decides at
  `:31` through `hasPermissionFn` (`permission.mjs:2`). The plugin checks a role inside each of its
  own endpoints, and its reads (`/organization/list-members`,
  `/organization/list-invitations`) answer an outsider 403 and read the company's whole roster.
- **Hand-made piece.** `admit`, `admitInviter` and `admitOperator` in
  `apps/server/src/hub/identity/admission.ts`, through one table of actions. `admit` reads the
  person's member row and decides with the plugin's `defaultRoles[role].authorize`. The operator is
  the person whose admin plugin role is `admin`, read in the command's transaction (S11): never a
  member, admitted on the installation by `admitOperator`, and by `admitInviter` on a company with
  no member yet, under the company's lock, only to invite its first owner. Each answers a nominal
  proof, `MemberProof`, `OwnerInviterProof` or `OperatorProof`, which the Hub's reads and writes
  require.
- **Why.** [Security S6, S7, S8, S10 and S11](../guides/security.md). An outsider, an unknown
  company and a role without the action get the same 404, with the reason only in the log. The test
  "fora: o membro" in `companies.test.ts` fails when admission reads any member of the company
  (removal `admission-reads-membership`); "fora: o operador" fails when a person who is not the
  operator may invite on a company with no member (removal `owner-inviter-is-operator`);
  "convidar: o membro, ou quem é de outra empresa" in `invitations.test.ts` covers it, and
  `admission.check.ts` fails to compile when any of the three proofs can be forged.

### The lists the Hub reads itself, 50 rows a page

- **Library line.** `@better-auth/core/dist/db/adapter/factory.mjs:603`. A `findMany` without a
  limit reads `defaultFindManyLimit`, 100 rows. The plugin's `listInvitations` reads a company's
  invitations that way, in no order (`better-auth/dist/plugins/organization/adapter.mjs:784`), and
  `listMembers` pages by offset (`:186`).
- **Hand-made piece.** `readMemberships` and `readMembers` in
  `apps/server/src/hub/identity/companies.ts`, `readInvitations` and `readReceived` in
  `invitation-reads.ts`, with `pageOf` and `pageKey` of `platform/pages.ts`. Each reads in a fixed order, 51 rows for a page of 50, and the next page
  starts after the last row's id.
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
  test "limite: com 100 vivos atrás de 100 vencidos" in `invitations.test.ts` fails without the
  refusal (removal `invitation-capacity`) and when expired rows count (removal
  `invitation-capacity-live-only`); "limite: com 99 vivos, dois convidantes juntos" fails without
  the lock (removal `invitation-company-lock`).

### Renewing a live invitation and reissuing an expired one

- **Library line.** `better-auth/dist/plugins/organization/adapter.mjs:753-770` drops expired rows
  from `findPendingInvitation`. Native `resend: true` extends only a live invitation
  (`routes/crud-invites.mjs:128-160`); cancel writes even a terminal status (`:428-450`).
- **Hand-made piece.** `openOf` in `invitations.ts` finds the pending row without a clock. An
  explicit expired replacement compares its id/revision/email/role under the company lock, cancels
  through the plugin (a member's by the endpoint, the operator's by the adapter), stamps
  `superseded_at` and creates the same way, in one transaction. The old link reads EXPIRED. The new
  row's `replaces` retains the original request for complete attempt-key payload comparison.
  `invitation-management.ts` admits current administrators, and the operator on a company awaiting
  its first owner, and recognizes explicit canceled replay before comparing revision; accepted,
  declined and superseded rows cannot cancel. A member's live renewal is native `resend: true`; the
  operator's writes the new `expires_at` itself, as native resend computes it (`invitationExpiry` in
  `auth.ts`). Both advance revision and clear `mailed_at`.
- **Why.** The founder's 4.1 decision B. An expired row still holds the unique pending-address
  index, and the native cancel alone cannot distinguish replacement from explicit cancellation.
  `invitation-lifecycle.test.ts` covers link identity, terminal replay without writes, full-payload
  conflicts, current admission, races and rollback; removing terminal guards fails
  `invitation-cancel-terminal-guard` and `invitation-create-replay-terminal`. Existing expired-row cancellation and parsing
  tests in `invitations.test.ts` fail without `re-invite-cancels-expired` and
  `open-invitation-row-parsed`.

### Three reads through the library's internal adapter

- **Library line.** `better-auth/dist/db/internal-adapter.mjs:583`, `:667` and `:227`.
  `findUserByEmail`, `findCredentialAccount` and `listUsers` belong to the adapter the library
  gives its plugins, and the Hub reaches them through `auth.$context`, which the library documents
  for no application. Creating a person has the public `auth.api.createUser` of the admin plugin
  (`better-auth/dist/plugins/admin/routes.mjs:195-201`), and the Hub uses it.
- **Hand-made piece.** `createFirstPerson` in `apps/server/src/hub/identity/first-person.ts`,
  `passwordCommand` in `invitation-response.ts` and `hasPassword` in `auth.ts`. They read the person by
  e-mail, whether she has a password, and whether the installation has anyone, inside the command's
  transaction, and parse each row as [code C27](../guides/code.md) says: a person against the
  contract's `Person`, an account against its password.
- **Why.** The public reads need a session (`/admin/list-users`) or return no password state, and
  these run before anyone is signed in. The reads join the command's transaction through
  `runWithTransaction`. When the library changes, reread `$context` and these three methods. The
  tests "com a pessoa ainda sem senha" in `first-person.test.ts` and "password" in
  `invitation-link.test.ts` cover them. The tests "id vazio" in `first-person-rows.test.ts` and
  "empty name" in `invitation-link.test.ts` fail without the person-row parse (removals
  `first-person-rows-parsed` and `link-person-row-parsed`).

### A password link's token goes back to the command that asked for it

- **Library line.** `better-auth/dist/api/routes/password.mjs:82`. `requestPasswordReset` answers
  only a status and hands the token to `emailAndPassword.sendResetPassword` alone.
- **Hand-made piece.** `linkTokenOf` in `apps/server/src/hub/identity/auth.ts`. The configured
  `sendResetPassword` gives the token to the `AsyncLocalStorage` slot of the call that asked, and
  the first-person command builds its link; the invitation command spends the token immediately.
- **Why.** [Security S36](../guides/security.md): the token reaches only the command, never an
  e-mail sent inside the library's call or a log. Building the token ourselves would copy the
  library's private identifier format. The test "com a pessoa ainda sem senha" in
  `first-person.test.ts` reads its link; `password-write.test.ts` proves the invitation writes a
  password and session without a second e-mail.

### The invitation's e-mail leaves after the commit and is marked when answered

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-invites.mjs:226`. The plugin
  sends through `sendInvitationEmail` inside its own call, so inside the Hub's transaction, and it
  keeps no record that an e-mail left.
- **Hand-made piece.** `mailInvitation` in `apps/server/src/hub/identity/invitation-mail.ts` sends
  after the commit and sets `mailed_at` once the provider answers delivered, queued or a permanent
  bounce, and answers which (`MailOutcome`). A member's invitation to a refused address answers
  `MAIL_BOUNCED`; a client's registration still answers 201 with `mailBounced`, and the Central
  shows "Esse endereço não recebe e-mails." only while that invitation is the client's live one,
  after which the address shows as an ordinary "Aguardando o administrador" invitation (step 4.2). A
  replay with the same attempt key of a pending, unexpired, unmarked invitation answers the mail
  data again, so the route sends again: delivery is at least once. The mark compares the sent
  revision, so a late reply for an earlier send cannot mark a renewed invitation. `mailed_at` is an
  additional field with `input: false`, which leaves it out of the plugin's request body
  (`better-auth/dist/db/to-zod.mjs:17`).
- **Why.** [Code C37](../guides/code.md). Sent inside the transaction, a slow provider holds the
  company's lock, and a rollback after the send mails an invitation that does not exist; sent after
  the commit with no record, a Hub stopped before the send leaves a replay that mails nothing
  (founder, 2026-10-15, "A"). The test "o Hub parou entre o convite e o e-mail" in
  `invitation-replay.test.ts` fails without the replay branch (removal
  `invitation-replay-resends-unmailed`), and "de novo com a mesma chave: depois do correio fora" in
  `invitations.test.ts` fails without the mark on a bounce (removal `invitation-bounce-marked`).
  `invitation-lifecycle.test.ts` proves a failed mark permits at-least-once delivery on replay, and
  the late-send test fails without the revision comparison (`invitation-mark-current-revision`).

### The pace of invitations

- **Library line.** `better-auth/dist/api/index.mjs:165-173`. The library limits attempts only in
  its router's `onRequest`, which `auth.api` skips, and it keys them by address and path
  (`api/rate-limiter/index.mjs:248`).
- **Hand-made piece.** `checkPace` in `apps/server/src/hub/identity/invitations.ts` counts the
  person's invitations of the last 60 s under the person's row lock. The old password-link pace
  leaves with the second e-mail.
- **Why.** [Security S28](../guides/security.md): behind the Tunnel the Hub keys on the account;
  the founder's numbers (step 4, answer 6). The tests "limite: o 11º convite" in
  `invitations.test.ts` fails without it (removal `invitation-pace`).

### The library writes its timestamps with the application's clock

- **Library line.** `better-auth/dist/plugins/organization/adapter.mjs:730-735` writes an
  invitation's `expires_at` from `getDate` (`utils/date.mjs`, `Date.now()`) and its `created_at`
  from `new Date()`; `better-auth/dist/db/internal-adapter.mjs:720` writes a password link's
  `created_at` the same way. The plugin tests its own deadline with `new Date()`
  (`crud-invites.mjs:268`, `:503`).
- **Hand-made piece.** None. The Hub's own comparisons of those columns run in SQL against
  `statement_timestamp()`, the database's clock, and `mailed_at` is written with it
  (`invitations.ts`, `invitation-mail.ts`).
- **Why.** The Hub could not compare in the application's clock without reading each row back, and
  it could not make the library write the database's clock without replacing its adapter calls
  (C75). So one query judges every row with one clock, and a skew between the server and the
  database moves a deadline or a pace by that skew. No test plants a skew; the question is open for
  a deployment whose clocks differ by more than the pace's seconds.

### Accepting: the recipient first, then the company's lock

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-invites.mjs:268-279`. The
  accept checks the invitation's state before its recipient, so another person learns whether it
  is open, and it counts the members with no lock, so two accepts at once both pass the limit.
- **Hand-made piece.** `acceptCommand` in `apps/server/src/hub/identity/invitation-response.ts`. It
  answers 404 to anyone but the recipient, locks the company row, and answers an invitation she
  already accepted with its company; otherwise it calls the plugin's accept.
- **Why.** [Security S10](../guides/security.md), [code C37 and C65](../guides/code.md). In
  `invitation-acceptance.test.ts`, "aceitar: 200 e um membro" fails when the recipient is not
  checked first (removal `accept-recipient-first`), "aceitar: com um re-convite ao mesmo tempo"
  fails without the lock (removal `accept-company-lock`), and "aceitar: dois juntos" covers it.

### Public invitation responses and terminal replay

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-invites.mjs:268,352-396,503`.
  Reads require a signed-in recipient and refuse terminal invitations; rejection requires a session;
  acceptance refuses an already accepted invitation. The default opaque id proves delivery to the
  invited address (`:29-36`).
- **Hand-made piece.** `readReceived` returns the card's `InvitationView`, without company details
  for terminal anonymous links or another session. `invitation-response.ts` creates the first
  password with native createUser/resetPassword/signInEmail, under company then address locks;
  declination writes rejected under the company lock. Terminal replay precedes revision checks
  only for the same operation and currently admitted recipient. Acceptance locks the live session
  row through commit, so revocation while waiting cannot replay successfully.
- **Why.** The approved 4.1 matrix and separate acceptance. `invitation-journey.test.ts`,
  `password-write.test.ts` and `invitation-acceptance.test.ts` cover the matrix, original-revision
  replay, competing responses, cross-company password races and transaction rollback.

### Invitation attempts counted by the native router outside the business transaction

- **Library line.** `better-auth/dist/api/index.mjs:165-173` invokes rate limiting from the router;
  `auth.api` skips it. `api/rate-limiter/index.mjs:262-278` applies custom path rules.
- **Hand-made piece.** The `invitation-attempts` plugin declares two native endpoints with
  `createAuthEndpoint`; `countInvitationAttempt` calls them through `auth.handler` before opening
  the business transaction. They are not mounted as public Hub routes. The native database
  counter persists independently from a refused password or declination.
- **Why.** [Security S28](../guides/security.md) and the card's A6. The native counter test in `invitation-journey.test.ts`
  reaches 429 after ten refused transactions, independently for both paths.

## TanStack Router 1.170.44: stable public-page data

- **Native.** Route `loader` supplies a snapshot through `useLoaderData`; `beforeLoad` supplies
  derived route context, read through `getRouteApi().useRouteContext` as the app guard already does.
- **Choice.** `/set-password` captures the fragment token in its loader, not the live location
  during departure. The root supplies only the initial destination derived from the session query;
  screens do not infer or copy a session. NOT_FOUND consumes INITIAL through one shared reader.
- **Proof.** The held-navigation regression in `set-password-form.test.tsx` catches the original
  live-location implementation when restored. `states.test.tsx`/`__root.test.tsx` exercise both
  initial destinations. Invitation success stays visible while refresh is held, hides obsolete
  actions, and does not follow navigation to another invitation (`invitation.test.tsx`). The
  founder-approved [code C48](../guides/code.md) wording exception remains on closing.

## shadcn: nonurgent Notice

- **Native comparison.** The Base UI registry's `alert.tsx`, obtained with the maintainer CLI,
  defines `role="alert"` and callout variants. Its docs describe a callout for user attention.
- **Choice.** The card's Notice is instead one native `role="status"` paragraph with `{children}`,
  no title, variant or dismiss state. Login, invitation send and password success consume it.
  `states.test.tsx` checks polite status without an urgent alert. This remains a status owner,
  not another alert implementation or a toast.

## React Email 6.11.0 and renderer 2.1.0

- **Native reference.** Documenso `cd0cc5febcbb76ec7e5ecb75c0b8c65ab8432198`,
  `packages/email/render.tsx:6,65,92` renders React Email at send time. Installing that runtime
  directly is the measured alternative of 117 packages/68,136,787 bytes, including CLI tools.
- **Packaging.** Native esbuild 0.28.2 bundles only `invitation-email.tsx` as an ignored ESM
  artifact, with React/DOM 19.2.4 pinned independently from the web. Native aliases resolve those
  versions; the build replaces the dependencies' development-mode constant. No runtime environment
  branch or template substitution is added. `invitation-render.d.mts` owns the port used by source
  and consumer. Local prestart/pretest, pree2e/preremovals and the image build generate the same
  artifact; removal scratch copies carry this generated input as well as source.
- **Why.** The approved 4.1 packaging decision keeps send-time escaping and native HTML-to-text
  conversion without the CLI runtime installation. The generated module measures 745,905 bytes.
  `invitation-email.test.ts` sends through the Hub and HTTP provider fake;
  `tests/e2e/invitation-image.test.ts` exercises the final image's first-person CLI, login, company
  and invitation HTTP doors and receives the bundle's HTML/text at that fake. Runtime installation
  uses native npm `--omit=dev --omit=optional`: devOptional packages require both omissions. This
  removes the mail/build tools and pre-existing drizzle-kit peer chain, not required direct
  server dependencies. React/DOM remain Better Auth peers resolved from the web's production
  dependencies, as in the U2 baseline; carry that remainder to closing. Same-base full-image
  `.Size`: U2 baseline 146,474,446 bytes, integrated image 93,399,171 bytes (53,075,275 fewer).
  These are whole-Hub sizes, not the study's isolated mail-layer delta. Inline colors/tables/system
  fonts are mail-client exceptions to [design V3 and V17](../guides/design.md), not patterns for Hub screens; carry them to
  closing.

## Fastify 5.12.5

### `serve` parses the body and checks the reply

- **Library line.** `fastify/types/type-provider.d.ts:9-13` and `:69-77`. A type provider types a
  request's parts from the route's schema, and `setValidatorCompiler` and `setSerializerCompiler`
  (`fastify/fastify.js:727`, `:740`) let a Zod schema validate the body and serialize the reply.
- **Hand-made piece.** `serve` and `partsOf` in `apps/server/src/platform/http.ts`. `partsOf` parses
  the path parameters first and refuses them with `NOT_FOUND`, then the `Idempotency-Key`, the query
  and the body, each refused with `REQUEST_MALFORMED`; `serve` parses the reply with `success.body`
  before it sends it, and sets the reply's cookies from the handler's `Answer`.
- **Why.** [Code C31 and C14](../guides/code.md). Through the generic `serve`, the provider types
  the body as `unknown`, and it has nothing for the `person` of the `session` access kind, the
  `Headers` or the cookies of an `Answer`. The compilers would replace only `bodyOf` and the reply's
  parse, at about the same number of lines. The tests "corpo fora do esquema" and "o corpo lido pelo
  esquema da operação volta" in `http.test.ts` cover it, and "fora: o membro" in `companies.test.ts`
  fails when a malformed path parameter stops answering `NOT_FOUND` (removal
  `malformed-id-not-found`).

### A write's signal follows the reply, not the request

- **Library line.** `fastify/lib/request.js:218-229`. `request.signal` aborts on the request's
  `close`, which Node emits once the body is read, not when the client leaves.
- **Hand-made piece.** `untilClientLeaves` in `apps/server/src/platform/http.ts`. It aborts when the
  reply closes before it finished.
- **Why.** With `request.signal`, every e-mail a write sends after reading its body is aborted
  (U4: the request's signal reaches the mail adapter). The test "registro" in
  `invitation-journey.test.ts`, against a Hub on a real socket, fails with it (removal
  `write-signal-follows-reply`).

## Platform: pg 8.23.1, Drizzle 1.0.0-rc.4, Fastify 5.12.5 and Node 24

### A page starts after a row: the row value is SQL

- **Library line.** `drizzle-orm/sql/expressions/conditions.js:101`. `gt(left, right)` renders
  `left > right` for any `SQLWrapper`, and a select builder as `right` renders as a parenthesized
  subquery. The builder has no row value, so the pair `(name, id)` cannot be built from columns.
- **Hand-made piece.** `after` in `apps/server/src/platform/pages.ts` and its four callers,
  `readMemberships` and `readMembers` in `hub/identity/companies.ts`, `readInvitations` in
  `invitation-reads.ts` and the client list in `hub/operations/clients.ts`. The pair
  is a `sql` template over the tables' own columns; the anchor row is a Drizzle select, scoped as
  its list is. Only the pair is hand-written.
- **Why.** [Code C44](../guides/code.md): a page that does not shift when a row arrives is a keyset
  on a unique tie-break, and names repeat, so a single-column `gt` cannot express it. The test
  "lista: só as empresas de quem pede" in `companies.test.ts` fails when the anchor leaves the
  list's scope (removal `membership-page-anchor-scoped`).

### A deadline on every checkout of a database connection

- **Library line.** `pg/lib/client.js:702`. `query_timeout` times one query and leaves the
  connection open with the query still running, and `pg-pool/index.js:392` returns such a client to
  the pool. `statement_timeout` and `idle_in_transaction_session_timeout`, set on `hub_runtime`, are
  the server's and cannot fire across a dead network.
- **Hand-made piece.** `openDatabase` in `apps/server/src/platform/database.ts`. On the pool's
  `acquire`, a 15 s timer destroys the client's socket, and `release` clears it. The release itself
  is the library's: `pg-pool/index.js:392` removes a client whose socket is gone
  (`!client._queryable`), and Drizzle's `transaction` commits or rolls back before it returns
  (`drizzle-orm/node-postgres/session.js:54-61`), so a refused command keeps its connection. The
  test "password: an unknown link leaves the transaction pool connection reusable" in
  `invitation-link.test.ts` fails when the release destroys the client (removal
  `refused-command-keeps-connection`).
- **Why.** [Code C57](../guides/code.md): nothing native bounds a whole checkout on the client. The
  test "uma consulta da biblioteca sem resposta cai no prazo de 15 s" in `database.test.ts` fails
  without it (removal `library-read-deadline`), and "uma leitura parada além do prazo" fails when
  the deadline is not the database's failure (removal `read-deadline-is-the-database`).

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
  helmet middleware by hand and log the line of C54.
- **Why.** [Code C51](../guides/code.md) and [security S24](../guides/security.md). The tests
  "Content-Length errado", "linha malformada" and "caminho com porcentagem malformada responde 400
  em problem+json, com cabeçalhos e log" in `main.test.ts` cover it.

### One log line per request, by code

- **Library line.** `fastify/lib/log-controller.js:50` and `:68`. Fastify's request logging
  writes two prose lines per request, "incoming request" and "request completed".
- **Hand-made piece.** `logServed` in `apps/server/src/platform/http.ts`, with
  `disableRequestLogging`. It writes `REQUEST_SERVED` with the route, the status and the duration;
  `genReqId` and `requestIdLogLabel` stay native.
- **Why.** [Code C54 and C50](../guides/code.md): one line per request, and a message is a code. The
  test "log por pedido" in `main.test.ts` covers it.

### The mail provider's reply is read up to a cap

- **Library line.** Node 24's global `fetch` has no size cap on a reply. undici's
  `Agent({ maxResponseSize })` has one, but the `undici` bundled with Node refuses that dispatcher
  through the global `fetch` (`UND_ERR_INVALID_ARG`), so the cap would need a separate `undici`
  dependency. The Cloudflare SDK 7.3.0 reads the whole body and retries twice.
- **Hand-made piece.** `cappedText` in `apps/server/src/platform/mail.ts`. It reads the reply
  stream and stops at 16 KiB.
- **Why.** [Code C59](../guides/code.md), and no dependency for about 12 lines. The test "correio:
  resposta acima de 16 KiB é MAIL_UNAVAILABLE, num só pedido" in `mail.test.ts` fails without the
  cap (removal `mail-reply-cap`).

## TanStack Query 5.104.0, Better Auth 1.7.8 and the browser's `fetch`

### The Hub client: one address, one reply schema, one closed failure table

- **Library line.** `@tanstack/react-query/src/queryOptions.ts:257-258` and
  `mutationOptions.ts:87-95` return their input unchanged. They derive no address and check no
  reply. Better Auth's `createAuthClient` (`client/config.mjs:38-55`) builds the library's own
  endpoint client, not the Hub's operations. The browser's `fetch`, `URL` and `Response.json` carry
  no contract.
- **Hand-made piece.** `apps/web/src/platform/hub.ts`: `hubFetch`, `HubFailure`, `failureOf`,
  `sentenceOf`, `readOrNotFound`, `idOrNotFound`, and `hubQuery`'s keys. Each is built on `fetch`,
  `URL`, `AbortSignal.timeout` and `any`, and Zod `safeParse`.
- **Why.** [Web W9](../guides/web.md) and [code C28](../guides/code.md): the screens call the
  operations of `packages/hub-api` and no second contract. A native HTTP status cannot say whether a
  write committed, so each row of the failure table says whether a whole answer with its code
  settles the outcome (`settles` in `packages/hub-api/src/failures.ts`). The tests in
  `apps/web/hub.test.ts` (cut body, deadline, edge HTML, definite and uncertain failure) cover it,
  and "resposta que não decide" fails when every failure counts as settled (removal
  `attempt-key-outcome-unknown`).

### A write that must survive a lost reply

- **Library line.** `@tanstack/query-core/src/mutation.ts:295-313` defaults to zero retries.
  `mutationCache.ts:195-210` (`canRun`) serializes a `scope.id` and does not deduplicate or keep a
  key across an uncertain reply. React Hook Form 7.90.0 `isSubmitting` tracks a submission, not
  whether the Hub committed.
- **Hand-made piece.** `useAttemptKey` in `apps/web/src/platform/attempt-key.ts`. It keeps the
  attempt key until the Hub's answer settles the outcome.
- **Why.** [Code C37](../guides/code.md) and [web W24](../guides/web.md). The two-click and
  uncertain-reply tests in `register-client-form.test.tsx` and `invite-form.test.tsx` cover it.

## Node 24.21.0

### Test output that refuses a skipped test without a reason

- **Library line.** `node:test/reporters` `spec` and the `TestEvent` stream. Node formats the events
  and imposes no `opt-in:` reason or Conexus log-line format.
- **Hand-made piece.** `scripts/test-reporter.ts`. It composes `spec()` and adds the policy checks
  on the events, and the ten slowest tests of the run to `$GITHUB_STEP_SUMMARY`. `spec()` prints each
  test's duration in the log but ranks nothing and writes no summary, and `node:test` has no
  reporter that does; the `junit` and `tap` reporters carry the durations but need a second script
  to read them. The test "a lista dos mais lentos" in `test-reporter.test.ts` covers the table.
- **Why.** [Testing T4](../guides/testing.md). It cannot see the pipes of a Hub spawned by a test,
  so `startHub` in `apps/server/src/platform/test-database.ts` is a second entry point. Both decide
  what a log line is through one `parseLogLine` (`scripts/log-line.ts`, the row below). The test
  "linha crua: recusa" in `scripts/test-reporter.test.ts` fails without the raw-line refusal
  (removal `raw-output-in-process`), and "linha crua: um Hub iniciado que imprime" in
  `test-database.test.ts` fails without the spawned Hub's (removal `raw-output-spawned-hub`). The
  other tests in `test-reporter.test.ts` cover the rest of the policy.

### A log line: one top-level `level`, read from the text

- **Library line.** `JSON.parse` (ECMAScript) returns the object with one value per key: of a
  repeated key only the last survives, and a nested object's keys are indistinguishable from the
  top level's once parsed. It gives no key order, no count and no duplicate report.
- **Hand-made piece.** `topLevelKeys` in `scripts/log-line.ts`. It walks a text that `JSON.parse`
  already accepted, counts brace and bracket depth, and lists the keys at depth 1, with any
  whitespace between the closing quote and `:`. Each key literal is decoded by `JSON.parse`, so
  `le\u0076el` is `level`.
- **Why.** [Code C50 and C54](../guides/code.md): a line with two top-level `level` keys must be
  refused and a nested `level` must not be; only the text shows the duplicate. The scan runs only on
  valid JSON, where every string closes, so it ends. The tests in `scripts/log-line.test.ts` (a
  repeated `level` or `msg` refused, also when one is written with an escape; a nested `level`, with
  and without spaces around `:`, and a single escaped key accepted) and the nested case in
  `apps/server/src/platform/test-database.test.ts` cover it. Revalidate by 2027-04-13,
  or when `JSON.parse` reports duplicate keys.

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
  `unreachable` or `broken-baseline`. A row is `caught` only when a `test:fail` event whose own name
  matches the row's `test.name` pattern appears (a matching failing suite counts); the failure of
  another test, a hook of another suite or a file that cannot load is not a catch. The manifest is
  loaded by one strict Zod schema that refuses an unknown key and a repeated id.
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
  (about 143 dependencies in the registry's metadata, none installed), and the single-file API does
  not check them. Undefined reference labels belong to another plugin.
- **Hand-made piece.** `scripts/check-docs.ts`. Inline links, reference definitions and fragments
  are checked by a small reader. The rest is Conexus policy: word ceilings, the index, rule ids,
  retired names, the one card, skill names.
- **Why.** [Delivery L24](../guides/delivery.md) and [code C75](../guides/code.md). The plugin would
  remove only the link reader, while `docs/index.md` coverage and code stripping still need ours.
  The planted cases (broken inline link, definition, same-file and cross-file fragment) in
  `check-docs.test.ts` cover them. Revalidate by 2027-04-13 or when the plugin can run in one
  file without the engine.

## Zod 4.6.5

### The OpenAPI document, emitted from the operations

- **Library line.** `z.toJSONSchema(schema, { io })` converts one schema and throws on one it cannot
  express. Two packages build whole documents. Both were read from the npm registry, not installed:
  `zod-openapi` 6.0.2 (`createDocument`, peer `zod ^4.0.0`), whose `requestParams` expands a
  `z.object` into path, query and header parameters; and `@asteasolutions/zod-to-openapi` 9.1.0
  (`OpenApiGeneratorV31` over a `registerPath` registry, peer `zod ^4.0.0`, with `openapi3-ts` as a
  dependency).
- **Hand-made piece.** `defineOperation` in `packages/hub-api/src/operation.ts` and
  `scripts/emit-openapi.ts`. `defineOperation` marks an operation with the `DECLARED` symbol; the
  emitter emits only the exports `isDeclaredOperation` accepts, and `serve` in
  `apps/server/src/platform/http.ts` takes only a `DeclaredOperation`. The mark opts an operation
  in; it does not register it: a declared operation passed to `serve` but not exported by
  `@conexus/hub-api` answers and is not in the document. The emitter maps each declared operation to
  a path item: `operationId`, `security` from the operation's access (the `cookieSession` apiKey
  scheme for `session`, `security: []` for every other access), parameters, the `Idempotency-Key`
  header of an attempt-keyed write, the request body, the success, and the failures grouped by their
  status in the failure table, with one `Problem` component. The failures are the operation's own
  and the platform's (`failuresOf` in `packages/hub-api/src/operation.ts`: origin, malformed
  request, media type, size and unexpected error, for every operation). It stops with the
  operation's id and exit code 1 on a schema `z.toJSONSchema` cannot express (a planted `z.date()`
  in `emit-openapi.test.ts`); a transform under `io: 'input'` converts without error and is not
  refused. It does not emit `bodyLimit`: OpenAPI 3.1 has no field for it.
- **Why.** [Code C28 and C29](../guides/code.md): the document is read from the one declaration of
  each operation. Either package would still need the mapping from our `Operation` to its path
  object, the failure grouping, the header and the `Problem` component. It would remove only
  `schema` and `parameters`, a small part of the file, for one more dependency. The tests in
  `scripts/emit-openapi.test.ts` (one `operationId` per declared operation, an export of the same
  shape that did not pass through `defineOperation`, the `security` of each access, the refused
  schema) and `apps/server/src/openapi-contract.test.ts` (a real Hub's success, 401, 403, 413, 415
  and 400 matched to the document's status and media type) cover it, and `npm run typecheck` fails
  on `apps/server/src/platform/http.check.ts` when `serve` takes an operation `defineOperation` did
  not declare. Revalidate by 2027-04-16, the only date, or when the Operation type gains a field.
