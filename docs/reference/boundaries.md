# Boundaries: where Conexus keeps a hand-made piece over its library

[Code C75](../guides/code.md) says to use the library's own mechanism first. This file records each
mechanism that Conexus writes itself instead, with the library line it replaces and the reason. The
versions are the installed ones, except four candidates read from the npm registry and not
installed: remark-validate-links 13.1.0, the Cloudflare SDK 7.3.0, zod-openapi 6.0.2
and @asteasolutions/zod-to-openapi 9.1.0. When the library
changes, reread the line it names.

## GitHub Actions and git

- **Native candidates.** GitHub Actions' `$GITHUB_STEP_SUMMARY` and `git diff --numstat` can display a changed file list, but neither resolves the card's per-unit folders and contract owners.
- **Hand-made piece.** `scripts/check-radius.ts` reads the declared radius and reports departures without failing.
- **Why.** Delivery L7 says radius departures are reported rather than stopped. The native candidates cannot resolve card-specific unit boundaries without this parser. The check appends to the native step summary; it is not a gate.

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
  row stays. The cost: once `expiresAt` is capped, the library's
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
  without the check. Remove it once no
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
- **Why.** [Code C50 and C52](../guides/code.md): the database is the library's one outside system;
  unavailable SQLSTATEs map to 503 (`DATABASE_UNAVAILABLE`), while a refused write or unexpected
  database error is 500 (`INTERNAL_UNEXPECTED`). [Security S41](../guides/security.md): only a code
  leaves. The test "banco fora" in `database-down.test.ts` fails without the piece, and the test
  "senha que não grava" in `password-write.test.ts` fails without the option.

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
  `database.libraryCommand` in the caller's scope and runs the work in `runWithTransaction` on an
  adapter bound to that transaction, so every call the library makes inside, nested ones included,
  writes there and meets the scope's row policies. `createFirstPerson` in `first-person.ts` runs
  the same way through `libraryInstallationOn`, before any person exists to scope it, and takes
  `transactionLock` (`database.ts`, a `pg_advisory_xact_lock`) on the key `conexus.first-person`,
  which ends with the transaction.
- **Why.** [Code C37 and C65](../guides/code.md), [data D22](../guides/data.md). A refusal anywhere
  in an accept leaves nothing, and `forgetLinks` deletes through the same transaction. The test
  "aceitar: uma escrita recusada no meio do aceite" in `invitation-acceptance.test.ts` guards it.
  The plugin's own transaction joins ours through `runWithTransaction` and, since
  `joiningTransaction`, through the adapter as well, so the test fails only when both are taken
  out, and no single test proves either. The tests "ao mesmo tempo, com dois e-mails" and
  "ao mesmo tempo, a mesma pessoa duas vezes" in `first-person.test.ts` fail without the lock.

### The plain adapter joins that transaction too

- **Library line.** `@better-auth/core/context` exports `getCurrentAdapter`, which the internal
  adapter and the organization plugin's adapter call to reach the open transaction. The invitation
  endpoint's `resend` branch does not: it writes the new expiry through `ctx.context.adapter`
  (`better-auth/dist/plugins/organization/routes/crud-invites.mjs:135-143`), on the library's own
  connection, as the Hub's login, outside the scope.
- **Hand-made piece.** `joiningTransaction` in `apps/server/src/hub/identity/auth.ts` wraps the
  adapter `createAuth` gives the library, so each of its calls goes to `getCurrentAdapter`.
- **Why.** [Data D22](../guides/data.md). The test "renovar: o prazo novo do plugin cai" in
  `invitations.test.ts` fails when the wrapper is taken out, and so does "renovar: o administrador
  renovando o convite de um dono", where the second phase refuses the escaped write.

### The operator's invitation of an owner, through the plugin's adapter

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-org.mjs:74-100`.
  `createOrganization` always writes the caller as a member with `creatorRole`. The invitation
  endpoints admit only a member of the company (`routes/crud-invites.mjs:93-100` to create and
  resend, `:430-434` to cancel). `getOrgAdapter`, exported by the plugin (`index.mjs:1-4`), writes
  the same rows without those checks (`adapter.mjs:141`, `:352`, `:728`, `:793`), on
  `getCurrentAdapter`, so inside `runWithTransaction` on the Hub's transaction.
- **Hand-made piece.** `organizationAdapter` in `apps/server/src/hub/identity/auth.ts`, on the
  operator's path, and for an app's invitation (the entry below): `registerCompanyOn` and `renameCompanyOn` in `clients.ts`, and an owner's
  invitation, its cancel and its renewal when the admission is the operator's
  (`CompanyOperatorProof`) in `invitations.ts` and `invitation-management.ts`. The Hub's admission
  decides who writes (`admitOperator`, `admitCompany`), the role is only owner
  (`OPERATOR_INVITES_AS` in `hub-api`, read by the Hub and by the Central's form), and a renewal writes
  its expiry from the plugin's option (`invitationExpiry` in `auth.ts`). A member's invitation,
  cancel and renewal go through the endpoints, `auth.api.createInvitation`, `cancelInvitation` and
  `createInvitation` with `resend: true`, which own the roles, the member check and the expiry, as
  in step 4.1. On the operator's path the adapter runs none of the endpoints' hooks: an
  `organizationHooks` invitation hook, `sendInvitationEmail` or `cancelPendingInvitationsOnReInvite`
  turned on later would be bypassed there, and none is on. The call carries one `@ts-expect-error`:
  the parameter is typed `AuthContext<BetterAuthOptions>`, which no configured auth's context
  matches.
- **Why.** Step 4.2: the company is born at the Operations Central with no member, and Conexus never
  becomes one, so the operator invites an owner without a membership, which no endpoint admits. Step
  6 declared the departure: the Central also invites an owner into an active company, since its card
  has it act on the people as an owner, so the rule "only a company with no member" is gone and the
  mail says "primeiro dono" only for a company with no member ("empresa ativa" in
  `owner-invitation.test.ts` also checks the subject). Members keep the native endpoints: the
  founder's answer A on the 4.2 code audit, 2026-10-17 ([delivery L12](../guides/delivery.md)).
  "convidar: o administrador pedindo dono…" in `invitations.test.ts` fails when a member's
  invitation is written by the adapter instead: the Hub no longer checks the creator role or an
  existing member itself. "renovar: o administrador renovando o convite de um dono…" fails when a
  member's renewal skips the endpoint. A member's cancel has no such test: the admission already
  requires `invitation: ["create"]`, every default role that holds it also holds `cancel`, and the
  endpoint writes the same status, so no test can tell the endpoint from the adapter there. The test
  "sem membro" in `hub/operations/clients.test.ts` fails when the company is created by the
  endpoint; "recusas" guards that the adapter writes inside the Hub's transaction, which it joins
  through `runWithTransaction` and `joiningTransaction` alike, so no single test proves either. When
  the library changes, reread `getOrgAdapter`'s signature and these four methods.

### An invitation to use one app: the library's invitation row, written, accepted and canceled by the Hub

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-invites.mjs:128-132`:
  `createInvitation` refuses an address with any open invitation in the company
  (`findPendingInvitation`, `adapter.mjs:753-768`), so one person cannot hold a company invitation
  and an app's, or two apps', at once. `:268`: the acceptance checks the deadline. `:324`: the
  acceptance always writes the member. The library knows no invitation that does not make a member.
- **Hand-made piece.** The invitation row carries two Hub fields, `project_id` and `app_role`
  (`additionalFields` in `auth.ts`), and an app's invitation has `role` NULL; the check
  `invitation_kind` and the unique index on company, address and Projeto keep the two kinds apart
  (migration `e18_app_access`). `PendingRow` in `identity/invitations.ts` reads the row as a union
  by `kind`, and each reader chooses by it. The Hub writes an app's invitation through
  `organizationAdapter` (`inviteToAppCommand`), after the admission `manageAppAccess` and Projects'
  refusals; the write carries one `@ts-expect-error`, the adapter typing `role` as a string. It
  accepts one without the library (`acceptedApp` in `invitation-response.ts`): it checks the
  deadline and the status itself, writes the row of `projects.app_access` and the `accepted` in one
  transaction, and never calls `acceptInvitation`. It cancels one through the adapter
  (`cancelAppInvitationCommand`, `cancelAppInvitations`), the capability deciding, not the
  plugin's `invitation: cancel`. A company invitation cancels the address's open app invitations
  first, through the adapter, since the endpoint would refuse the address. The link, the e-mail
  and the password page are the company invitation's. The company's invitation routes and its
  list read only the rows with no Projeto (`OF_COMPANY`).
- **Why.** Step 18, the founder's `I1` (2026-10-28): a person given an app is not a member (`E1`,
  `C`), may hold one invitation per app at once, and a company invitation replaces them. The other
  forms, one open invitation per address, or a table of invitations of our own, took the second
  app from the owner or repeated the link, the mail and the password. "o convite de um app:
  aceitar não faz membro, e leva ao app" in `invitation-app.test.ts` fails if the acceptance
  writes a member; "o convite da empresa com um de app aberto" fails if the company invitation
  meets the library's refusal; "o convite de app vencido não dá o app" fails without the Hub's own
  deadline check. When the library changes, reread `createInvitation`'s pending check, the
  acceptance's member write and `getOrgAdapter`'s invitation methods.

### A person given one app: the Hub's own table, since the library's teams need a member

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-team.mjs:637-640`: adding a
  person to a team refuses one who is not a member of the company. `crud-invites.mjs:324`: an
  accepted invitation always writes the member. The library keeps no (person, app, role) pair for
  someone outside the company.
- **Hand-made piece.** `projects.app_access`, one row per Projeto and person (primary key
  `project_id, person_id`), with row-level security like `projects.project` and a cascade from the
  Projeto (migration `e18_app_access`). `projectAppsOf` in `projects/app-access.ts` is its one owner;
  `admitToApp` in `projects/hosts.ts` reads it on every call.
- **Why.** Step 18, the founder's `C` (2026-10-28): the person is not a member (`E1`), and a role
  per person per app has no library home. The tests of `projects/tables.test.ts`
  ("o acesso a um app: uma linha por pessoa, some com o Projeto, cada empresa as suas") and
  `app-access-journey.test.ts` fail without the table's key, cascade and policies. When the
  library changes, reread the team add and the invitation acceptance above.

### Deleting a company: the adapter, with the native route closed

- **Library line.** `organization/routes/crud-org.mjs:255`: with `disableOrganizationDeletion`
  the endpoint answers `ORGANIZATION_DELETION_DISABLED` before it reads the session. The adapter's
  `deleteOrganization` (`adapter.mjs:370`) deletes the members, the invitations and the company
  and returns the id whether or not a row was there.
- **Hand-made piece.** `deleteCompanyOn` in `identity/clients.ts`, called by `remove` in
  `operations/clients.ts` after the client's row is deleted. No check follows: the adapter returns
  no row count, and a read afterwards passes the same row policy as the DELETE. A correction and a
  deletion lock the company, then the operator's row, then the client, the order the invitations and
  the accept keep (`lockCompany` first).
- **Why.** Step 5: only the operator deletes, by the client's revision and name (code C38). The test
  "apagar só pela Central" in `sign-up.test.ts` fails when the endpoint opens; "apagar:
  concorrência" in `client-deletion.test.ts` deadlocks when the operator's row is locked before the
  company's.

### Taking a person out and changing a role: the plugin's adapter, with the native routes unused

- **Library line.** `better-auth/dist/plugins/organization/routes/crud-members.mjs:139` (remove),
  `:236` (update the role) and `:406` (leave). Each admits only a caller who is a member of the
  company (`:178`), which the operator is not. Each counts the owners and then writes, with no lock:
  the step 4 proof left 0 owners in 20 of 20 races (`:197-200`, `:293-302`, `:419-427`). An
  administrator who removes an owner is answered with the code of the last owner (`:195-196`), and
  leaving calls no hook.
- **Hand-made piece.** `removeMemberCommand` and `changeMemberRoleCommand` in
  `apps/server/src/hub/identity/memberships.ts` take the company's lock, admit the caller (a member
  or the operator, `admitCompany`), decide by `rankAllows` in `admission.ts` and write through
  `deleteMember` and `updateMember` of the plugin's adapter (`organization/adapter.mjs:305`, `:295`),
  from `organizationAdapter`. `keepOwner` counts the owners under that lock, and
  `cancelSentBy` cancels the invitations the removed person sent, in the same transaction. Each
  action carries the plugin's statement in `ACTIONS` (`member:delete` to remove, `member:update`
  to change a role; leaving needs only the membership), so a role the plugin refuses is refused
  here too.
- **Why.** Step 6, P1: the Central acts on a company's people as an owner without being a member,
  and the last-owner rule is one, under the company's lock. The role table is the founder's
  answer A on B1: the owner and the Central change any role; an administrator only between
  administrator and member, also their own; a member none; the sole owner gets 409 `LAST_OWNER`
  whoever asks, the Central included. Each part has its test: the lock, the
  owner count, the rank, the role the caller read and the cancellation.
  The plugin's `organizationHooks` for members are none today; one turned on later would be bypassed
  here. When the library changes, reread `deleteMember` and `updateMember`.

### Sign-in and the first password reach the library through a request we build

- **Library line.** `better-auth/dist/api/index.mjs:165-173`. The attempt limit runs in the
  router's `onRequest`, so an `auth.api` call skips it.
- **Hand-made piece.** `libraryRequest` in `apps/server/src/hub/identity/routes.ts`. It builds the
  `Request` for `auth.handler` from the Hub's own route, with only `origin`, `cf-connecting-ip`,
  `user-agent` and `cookie`.
- **Why.** The library's routes are not mounted (criterion 18), and the limit of
  [security S30](../guides/security.md) must still apply. The test "limite: a 11ª tentativa" in
  `identity.test.ts` fails when sign-in goes through `auth.api` instead.

### An earlier link stops working when a new one is given

- **Library line.** `better-auth/dist/db/internal-adapter.mjs:775`. The library deletes a link only
  by its identifier, which it stores as a hash of the token, so a link whose token is gone cannot be
  addressed.
- **Hand-made piece.** `forgetLinks` in `apps/server/src/hub/identity/auth.ts`. It deletes the
  person's links by their stored value, the person's id, with Drizzle's `delete` in the same
  transaction as the new one.
- **Why.** [Code C37](../guides/code.md). The test "com a pessoa ainda sem senha" in
  `first-person.test.ts` fails without it. The
  invitation password command consumes its reset token in the same transaction; it sends no link.

### Sign-out: the row first, then the cookies

- **Library line.** `better-auth/dist/api/routes/sign-out.mjs:49-54`. `signOut` logs and swallows a
  failed delete of the session row, then expires the cookies anyway.
- **Hand-made piece.** `apps/server/src/hub/identity/routes.ts`, `deleteSession`. It calls
  `revokeSession` first, which fails loudly when the database refuses. Only after that does it call
  `signOut`, which expires the cookies.
- **Why.** [Security S13](../guides/security.md). With the library's order, a database failure
  answers "signed out" to a session that is still alive. The test "sair falha" in
  `session.test.ts` fails without the piece.

### Who may act on a company: admission over the plugin's roles

- **Library line.** `better-auth/dist/plugins/organization/has-permission.mjs:7`, which decides at
  `:31` through `hasPermissionFn` (`permission.mjs:2`). The plugin checks a role inside each of its
  own endpoints, and its reads (`/organization/list-members`,
  `/organization/list-invitations`) answer an outsider 403 and read the company's whole roster.
- **Hand-made piece.** `admit`, `admitInviter` and `admitOperator` in
  `apps/server/src/hub/identity/admission.ts`, through one table of actions. `admit` reads the
  person's member row and decides with the plugin's `defaultRoles[role].authorize`. The operator is
  the person whose admin plugin role is `admin`, read in the command's transaction (S11): never a
  member, admitted on the installation by `admitOperator`, and by `admitCompany` on any company, with
  or without members, under the company's lock when the action writes: it reads and changes the
  people as an owner and invites only an owner. Each answers a nominal proof, `MemberProof`,
  `CompanyOperatorProof` or `OperatorProof`, which the Hub's reads and writes require.
- **Why.** [Security S6, S7, S8, S10 and S11](../guides/security.md). An outsider, an unknown
  company and a role without the action get the same 404, with the reason only in the log. The test
  "fora: o membro" in `companies.test.ts` fails when admission reads any member of the company;
  "fora: o operador" fails when a person who is not the operator may act on a company as the
  operator; "convidar: o membro, ou quem é de outra empresa" in `invitations.test.ts` covers it, and
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

### An app's rows, 50 a page by offset (Capacidade 1)

- **Library line.** `@neondatabase/serverless` 1.2.0 `sql.transaction` takes `{ text, values }` and
  `readOnly` (`index.d.ts:489-504`; `transaction()` at `:521-522` and `:892-893`); PostgreSQL 18 gives `limit` and `offset` as bound values and
  `left(("c")::text, n)` for the cut. Neither pages by a key's value: a table of an app may have no
  key, or a composite one of any type, and the page token is 64 characters.
- **Hand-made piece.** `apps/server/src/hub/apps/app-rows.ts` with `pageOf` and `pageKey` of
  `platform/pages.ts`: the offset travels inside the token (`Offset`, a positive whole number of at
  most nine digits), 51 rows are read for a page of 50, ordered by the primary key in key order or,
  with none, by `ctid`. The table's name comes from the catalog (`app-tables.ts`), quoted, and the
  count is a `union all` of `count(*)` over a `limit` of the cap plus one.
- **Why.** An exception to "The lists the Hub reads itself" above: those lists are the Hub's own
  rows, paged after the last row's id; the app's tables are the app's, and the page shows them as
  they are. Supabase's table editor pages by offset too, ordered by the key with `ctid` as the
  tiebreak.
- **Proof.** "dados: páginas pela chave" and "dados: tabela sem chave" in `app-data.test.ts`. It
  is a read, with no protection of ours to remove.
- **Not proved.** A page by offset shifts when a row arrives between two pages. A partitioned table
  repeats `ctid` across partitions
  (https://github.com/developmentconexus-ops/conexus/issues/937). The time of the count and of an
  offset past 10,000 rows on Neon was not measured.
- **Revisit when** the founder's use shows a page slow on a real company's table, or the Builder
  generates `PARTITION BY`.

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
  refusal and when expired rows count; "limite: com 99 vivos, dois convidantes juntos" fails without
  the lock.

### Renewing a live invitation and reissuing an expired one

- **Library line.** `better-auth/dist/plugins/organization/adapter.mjs:753-770` drops expired rows
  from `findPendingInvitation`. Native `resend: true` extends only a live invitation
  (`routes/crud-invites.mjs:128-160`); cancel writes even a terminal status (`:428-450`).
- **Hand-made piece.** `openOf` in `invitations.ts` finds the pending row without a clock. An
  explicit expired replacement compares its id/revision/email/role under the company lock, cancels
  through the plugin (a member's by the endpoint, the operator's by the adapter), stamps
  `superseded_at` and creates the same way, in one transaction. The old link reads EXPIRED. The new
  row's `replaces` retains the original request for complete attempt-key payload comparison.
  `invitation-management.ts` admits current administrators, and the operator on any company, and recognizes explicit canceled replay before comparing revision; accepted,
  declined and superseded rows cannot cancel. A member's live renewal is native `resend: true`; the
  operator's writes the new `expires_at` itself, as native resend computes it (`invitationExpiry` in
  `auth.ts`). Both advance revision and clear `mailed_at`.
- **Why.** The founder's 4.1 decision B. An expired row still holds the unique pending-address
  index, and the native cancel alone cannot distinguish replacement from explicit cancellation.
  `invitation-lifecycle.test.ts` covers link identity, terminal replay without writes, full-payload
  conflicts, current admission, races and rollback; removing terminal guards fails
  "accepted or declined never become canceled" and "binds the complete replay payload". The tests
  "de novo: o anterior vencido" and "de novo: o anterior com um id fora de forma" in
  `invitations.test.ts` fail without the expired-row cancellation and the row parse.

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
  "empty name" in `invitation-link.test.ts` fail without the person-row parse.

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
  `invitation-replay.test.ts` fails without the replay branch, and "de novo com a mesma chave:
  depois do correio fora" in `invitations.test.ts` fails without the mark on a bounce.
  `invitation-lifecycle.test.ts` proves a failed mark permits at-least-once delivery on replay, and
  the test "a late send cannot mark" fails without the revision comparison.

### The pace of invitations

- **Library line.** `better-auth/dist/api/index.mjs:165-173`. The library limits attempts only in
  its router's `onRequest`, which `auth.api` skips, and it keys them by address and path
  (`api/rate-limiter/index.mjs:248`).
- **Hand-made piece.** `checkPace` in `apps/server/src/hub/identity/invitations.ts` counts the
  person's invitations of the last 60 s under the person's row lock. The old password-link pace
  leaves with the second e-mail.
- **Why.** [Security S28](../guides/security.md): behind the Tunnel the Hub keys on the account;
  the founder's numbers (step 4, answer 6). The tests "limite: o 11º convite" in
  `invitations.test.ts` fails without it.

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
  checked first, "aceitar: com um re-convite ao mesmo tempo"
  fails without the lock, and "aceitar: dois juntos" covers it.

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
  `createAuthEndpoint`; `countAttempt` calls them through `auth.handler` before opening
  the business transaction. They are not mounted as public Hub routes. The native database
  counter persists independently from a refused password or declination.
- **Why.** [Security S28](../guides/security.md) and the card's A6. The native counter test in `invitation-journey.test.ts`
  reaches 429 after ten refused transactions, independently for both paths.

### Password recovery: the library's reset link, asked inside our transaction

- **Library line.** `better-auth/dist/api/routes/password.mjs:21-85` (`requestPasswordReset`
  creates the link and hands the token to `sendResetPassword`; for an unknown address it only
  simulates a lookup) and `utils/password.mjs:34` (`revokeSessionsOnPasswordReset` deletes the
  person's sessions in the transaction that spends the link and writes the password). The library
  limits a path only in its router, which `auth.api` skips.
- **Hand-made piece.** `createPasswordRecovery` in `identity/password-recovery.ts`. The route
  counts the attempt on `/password-recovery-attempt` (3 per 60 s per address, the pattern above),
  then, in one installation transaction under the address lock, asks for a link only for a person
  who has a password and no link younger than a minute (the library stamps links with the
  application's clock, so the pace reads that clock), forgetting the earlier link. The e-mail is
  sent after the commit and after the answer, with `Answer.afterReply` (run by `whenReplyEnds` in `platform/reply-lifetime.ts`):
  the answer is 202 and empty whether or not a mail leaves, and an unavailable provider is logged
  as `MAIL_UNAVAILABLE`, never answered. The library has no per-person pace and no way to ask for
  a link without sending it.
- **Why.** Founder, step 6: 3A (202 always the same, mail after commit), P2 (every link 1 hour), P3
  (one mail per person per minute), 4A (a recovery ends the other sessions). The tests in
  `password-recovery.test.ts` fail without each piece. A mail still in flight when the Hub stops is
  lost; the person asks again.

### The leaked-password check is the library's function, run before the transaction

- **Library line.** The `haveIBeenPwned` plugin checks inside the sign-up and reset endpoints and
  sends the first five characters of the password's SHA-1 hash to `api.pwnedpasswords.com`. Its
  `isPasswordCompromised` (`plugins/haveibeenpwned/index.mjs`) takes no `signal`, so a request past
  its deadline runs on alone, and any failure comes back as one `INTERNAL_SERVER_ERROR`.
- **Hand-made piece.** `checkPassword` in `apps/server/src/hub/identity/password-check.ts`. It calls
  that function against a 3 second deadline, before the route opens a transaction, and answers
  `PASSWORD_COMPROMISED` or, for an error or the deadline, `PASSWORD_CHECK_UNAVAILABLE`. The plugin
  is not installed: its check would run inside the transaction that spends the link.
- **Why.** [Security S36, S41](../guides/security.md). No test reaches the real service. In-process
  tests use the `fetch` that `createTestDatabase` plants (`platform/test-password-service.ts`).
  Hubs that tests spawn load `platform/test-password-preload.ts`. The Docker image test
  (`tests/e2e/invitation-image.test.ts`) blocks the host with `--add-host` and sets the password in
  the database; the review found it reaching the service. The password-check tests cover the
  protections.

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
- **Packaging.** Native esbuild 0.28.2 bundles, for us, `invitation-email.tsx` (which also exports the
  recovery template of `password-recovery-email.tsx`; both sit in the page of `mail-frame.tsx`) and
  `automation-email.tsx` of the notifications (step 24.2, in the same page through
  `identity/public-mail.tsx`) as two ignored ESM artifacts, one command each, with
  React/DOM 19.2.4 pinned independently from the web. Native aliases resolve those
  versions; the build replaces the dependencies' development-mode constant. No runtime environment
  branch or template substitution is added. `invitation-render.d.mts` and `notification-render.d.mts`
  own the ports used by source and consumer. Local prestart/pretest, pree2e and the image
  build generate the same artifacts.
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
  covers a malformed path parameter answering `NOT_FOUND`.

### A write's signal follows the reply, not the request

- **Library line.** `fastify/lib/request.js:218-229`. `request.signal` aborts on the request's
  `close`, which Node emits once the body is read, not when the client leaves.
- **Hand-made piece.** `untilClientLeaves` in `apps/server/src/platform/reply-lifetime.ts`. It aborts when the
  reply closes before it finished; `whenReplyEnds` runs `Answer.afterReply` on `close`, since `finish`
  never comes for a client that left (the test "desconexão" covers it).
- **Why.** With `request.signal`, every e-mail a write sends after reading its body is aborted
  (U4: the request's signal reaches the mail adapter). The test "registro" in
  `invitation-journey.test.ts`, against a Hub on a real socket, covers it.

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
  "lista: só as empresas de quem pede" in `companies.test.ts` covers the anchor's scope. Since
  step 5 the person scope's member policy holds the same rule, so removing the anchor's filter
  alone changes nothing; `isolation.test.ts` "positivo" fails when that policy opens.

### Every transaction opens in a scope

- **Library line.** `drizzle-orm/node-postgres/session.js` (1.0.0-rc.4): `transaction` begins with
  the isolation and access mode it is given and nothing else; neither Drizzle nor pg sets a role or
  a setting for one transaction. Better Auth's adapter runs on the transaction it is handed
  (`@better-auth/core/dist/context/transaction.mjs`). PostgreSQL offers `SET LOCAL ROLE` and
  `set_config(name, value, true)`, both undone at the transaction's end.
- **Hand-made piece.** `enter` in `apps/server/src/platform/database.ts`. `read`, `command` and
  `libraryCommand` take a `Scope`; the transaction first switches to the scope's role, a constant of
  the program, and sets `conexus.company_id`, `conexus.person_id` and `conexus.invitation_id` as
  bound values, which the row policies of decision 0039 read through `scoped`. A failure there
  ends the transaction as `DATABASE_UNAVAILABLE` before the work runs. `asPerson` switches a company
  command to the person's own scope for the invitation pace, and back. `installation` and
  `libraryInstallation` stay in the Hub's login, for the installation's own rows, the boot's checks
  and the first administrator. Since step 8, `installation` and `installationRead` also read the
  apps' handoffs and sessions, found by hash before the company is known, and call
  `projects.project_of_host` for a Projeto's host: `hub_runtime` holds USAGE on `projects` and no
  table right there (`isolation-apps.test.ts`). No `AsyncLocalStorage` carries a company: the scope
  is an argument.
  `installationRead` reads the status page's starts in a read-only, repeatable-read transaction.
  `FOR SHARE` and `FOR NO KEY UPDATE` need the UPDATE grant and policy, so a scope that locks a row
  holds UPDATE on it, on one column no command writes where it only locks.
- **Why.** Decision 0039 and [data D20, D25](../guides/data.md). In `isolation.test.ts`, "filtro
  esquecido" fails without the role switch and with the member policy
  opened; "o tipo" fails when a read stops naming its scope.

### The operator's administrator, answered by one function (provisional)

- **Library line.** PostgreSQL 18 expands a policy's subqueries with the policies of the tables they
  read, and refuses a cycle: auth.member's operator policy reading auth.user, whose operator policy
  reads auth.member for the owners, fails with "infinite recursion detected in policy".
- **Hand-made piece.** `auth.is_installation_administrator(person)`, migration
  `installation_administrator_check`: `SECURITY DEFINER`, `search_path` fixed, owned by
  `hub_administrators`, which cannot log in and reads only the administrators' `id` and `role`
  through its own policy; only `hub_operator` executes it. `ADMINISTRATOR` in `identity/tables.ts`
  puts it in every operator policy. Firstmate chose it provisionally on 2026-10-17; it waits for the
  founder's word, beside the U2 list.
- **Why.** The card's rule that every operator policy needs an installation administrator
  (security S11) with the Central's owners in auth.user. "operador sem papel" in
  `isolation.test.ts` fails without the check on auth.member.

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
  `invitation-link.test.ts` covers it.
- **Why.** [Code C57](../guides/code.md): nothing native bounds a whole checkout on the client. The
  tests "uma consulta da biblioteca sem resposta cai no prazo de 15 s" and "uma leitura parada além
  do prazo" in `database.test.ts` cover the deadline and that it is the database's failure.

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
- **Hand-made piece.** `cappedText` in `apps/server/src/platform/capped-text.ts`, which `mail.ts`
  calls with 16 KiB. It reads the reply stream and stops at the cap.
- **Why.** [Code C59](../guides/code.md), and no dependency for about 12 lines. The test "correio:
  resposta acima de 16 KiB é MAIL_UNAVAILABLE, num só pedido" in `mail.test.ts` covers the cap.

### The apps' Workers through Cloudflare's API

- **Library line.** The Cloudflare SDK 7.3.0 has the namespace's script upload and the asset upload
  session, and takes `maxRetries: 0`, a `timeout` and a caller's `signal`, but it reads each reply
  whole: a reply with no declared size has no cap. `wrangler` 4.151.1 uploads from a command line,
  not from the Hub's process.
- **Hand-made piece.** `createCloudflareApps` in `apps/server/src/platform/cloudflare.ts`: the asset
  upload session, its buckets and the script's multipart `PUT`, the `GET` and the `DELETE`, over
  `fetch` with one `AbortSignal` per call and `cappedText` at 1 MiB. A `10021` is a version that
  does not start (decision 0046); a `10007` is a script already gone.
- **Why.** [Code C57, C59](../guides/code.md) and no dependency for three calls (decision 0043 read
  them by the API). The tests in `cloudflare.test.ts` cover the cap and check each
  request's shape and the asset hash, the SHA-256 of the base64 and the extension as Cloudflare's
  direct-upload guide writes it. Revalidate when the SDK caps a reply.

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
  with "resposta que não decide" for a failure that does not settle the outcome.

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
  "linha crua: recusa" in `scripts/test-reporter.test.ts` covers the raw-line refusal, "linha crua:
  um Hub iniciado que imprime" in `test-database.test.ts` the spawned Hub's, and the other tests in
  `test-reporter.test.ts` the rest of the policy.

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
  retired names, the one card, skill names, and a backticked path that some file of the
  repository ends with (`scripts/check-docs-paths.ts`, which lists what is not the repository's: libraries,
  reference checkouts, dated records and cards).
- **Why.** [Delivery L24](../guides/delivery.md) and [code C75](../guides/code.md). The plugin would
  remove only the link reader, while `docs/index.md` coverage and code stripping still need ours.
  The planted cases (broken inline link, definition, same-file and cross-file fragment) in
  `check-docs.test.ts` and the missing path in `check-docs-paths.test.ts` cover them. Revalidate by 2027-04-13 or when the plugin can run in one
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

## @neon/sdk 7.3.0

### The size of a reply

- **Library line.** `node_modules/@neon/sdk/dist/client/client/client.gen.js:84,102` reads each
  reply whole with the `fetch` it is given; it has no byte cap. A body that fails to read comes back
  as a `NeonApiError` with a 2xx status.
- **Hand-made piece.** `capReplies` in `apps/server/src/platform/neon.ts`, the SDK's own `fetch`
  option. It ends a body past 1 MiB with an error, and `mapped` reads that error as `NO_ANSWER`: the
  call may have taken effect, so a creation keeps its claim.
- **Why.** [Code C59](../guides/code.md). The test "resposta maior que o teto" in `neon.test.ts` fails
  without it. Revalidate when the SDK gains a reply cap.


## The company's database claim

- **Library line.** `@neon/sdk` 7.3.0 `projects.create` takes no idempotency key
  (`node_modules/@neon/sdk/dist/neon/resources/projects.js`): two calls with one name make two
  projects. PostgreSQL's native waits are a row lock or an advisory lock held across the call, which
  [data D22 and D25](../guides/data.md) forbid.
- **Hand-made piece.** `claimDatabase` and `releaseClaim` in `apps/server/src/hub/projects/company-database.ts`.
  The first transaction writes `creating` with `claimed_until`, the Neon call runs with no
  transaction open, and the second records `ready`. A claim past its time is taken over; the project
  a cut reply left is found by the exact `-<companyId>` ending of its name (`find`, decision 0048)
  and adopted, never created twice. A refusal from Neon releases the claim, silence keeps it until
  it ends; `projects-database.test.ts` and `neon.test.ts` cover it, and the exact ending fails without
  it.
- **Why.** [Code C37, C57, C65](../guides/code.md). The time is `NEON_PREPARE_BUDGET_MS` (the `find`,
  then the `create`) plus 5 s, so a claim outlives the calls that hold it. Revalidate when
  `projects.create` gains an idempotency key.

## aws-cdk-lib 2.278.0: the table buckets' catalog in Lake Formation mode (O lago da empresa nasce e some)

- **Library line.** `CfnResourceProps` of `AWS::LakeFormation::Resource`
  (`aws-cdk-lib/aws-lakeformation/lib/lakeformation.generated.d.ts:1533`) has five properties and
  no `WithPrivilegedAccess`. Without it, whoever registers the table buckets' location gets no Lake
  Formation permission on it, and `AWS::Glue::Catalog` failed in the lab's platform deploy with
  "Insufficient Lake Formation permission(s)" on `bucket/*`: the CDK execution role that calls
  `CreateCatalog` is no lake administrator.
- **Hand-made piece.** Three `AwsCustomResource` of `aws-cdk-lib` in `infra/aws/lib/tables.ts`, on
  one function role, `conexus-s3tables-catalogo`: `TableBucketsRegistration` calls
  `RegisterResource` with `WithFederation` and `WithPrivilegedAccess` and, on delete,
  `DeregisterResource`; `TableBucketsLocationGrant`, made after it, revokes on delete the
  `DATA_LOCATION_ACCESS` the registration gave; `TablesCatalog` calls `CreateCatalog` and
  `DeleteCatalog`, with both default permissions empty. It is the card's fallback for the native
  types (row 15), chosen in https://github.com/developmentconexus-ops/conexus/pull/1247; the
  function's policy grows by the reads the resource schema's handlers do on the Lake Formation role
  (https://github.com/developmentconexus-ops/conexus/pull/1249).
- **Why.** The documented prerequisite of the `S3 Tables` integration: a principal with
  `RegisterResource`, `RegisterResourceWithPrivilegedAccess` and `CreateCatalog` that registers the
  location receives only `DATA_LOCATION_ACCESS` there, so no new role becomes a lake administrator
  (the card's L.9 stays). Revalidate when `AWS::LakeFormation::Resource` gains
  `WithPrivilegedAccess`.

## @aws-sdk/client-cloudformation and @aws-sdk/client-s3tables 3.1175.0: what a failed lake creation leaves (O lago da empresa nasce e some)

- **Library line.** `CreateStack` with `OnFailure: DELETE` (`createStack` in
  `apps/server/src/platform/aws.ts`) undoes a failed stack, but CloudFormation deletes only what it
  finished creating: one table bucket was left behind in eight creations at once in the lab proof
  of 2026-11-20, and a removed bucket's name stays held for minutes (lab run 45081093044).
  No reference checks for a leftover: SaaS Builder Toolkit 0.9.5 has no rollback or cleanup,
  ParallelCluster 3.16.3 removes only its own files (`pcluster/models/cluster.py:408-410`), and SAM
  CLI 1.174.0 passes `--on-failure DELETE` (`samcli/lib/deploy/deployer.py:906-913`).
- **Hand-made piece.** `leftover` of `LakeStacks` (`bucketMayBeLeft` and `clearLeftover` in
  `apps/server/src/platform/aws.ts`), which `failure` in `apps/server/src/hub/lake/lake.ts` calls
  after it reads the first failed event. It reads the stack's `DescribeStackEvents` by its id: no
  bucket event, or a `CREATE_COMPLETE` with `DELETE_COMPLETE` the newest, means nothing is left;
  anything else, a `CREATE_FAILED` included, searches. The search is `GetTableBucket`,
  `ListNamespaces`, `DeleteNamespace` for each (a `NotFoundException` counts as done) and
  `DeleteTableBucket`, under the Hub's session and the company's tag
  (`ClearTheSessionCompanyLeftover` in `infra/aws/lib/hub.ts`), so a bucket that is not there
  answers 403. A refusal logs `LAKE_LEFTOVER_REFUSED` at error level, and the lake still becomes
  `FAILED`. `aws-leftover.test.ts` covers the three recorded diaries and the namespace another read
  already removed.
- **Why.** The founder's decision E ("10a", 2026-11-21): after a creation that fails, the Hub
  removes what is left. Only the bucket is checked: the Hub has no `iam:` or `athena:`, and an
  orphan reader role or Athena workgroup was never seen. Revalidate on the first orphan of another
  kind, on a table-bucket quota refusal no live lake explains, or when CloudFormation deletes what a
  failed creation began.

## The Builder's clocks and its eval gate (step 13)

- **Clocks.** `setTimeout` and `setInterval` are refused in `apps/server/src/harness/` and `apps/server/src/agents/` except in the
  owner `agents/app-builder/runs/copy-retry.ts`, and so are `node:timers` and
  `node:timers/promises` (decision 0051; `biome.json`). Three step 11 files keep their timers out of the rule, with the reason that they
  were written before it: `model-accounts/google/{calls,google}.ts` and `subscription-store.ts`. A change
  that touches their timers moves each to a named owner.
- **Eval gate.** `agents/app-builder/builder.eval.test.ts` drives the real Builder through the Hub with
  a scripted model and the test machine, then scores what Mastra saved with `checks.calledTool` and
  `checks.noToolErrors` from `@mastra/evals/checks`, and requires the only tool called to be the
  write tool. It does not use `runEvals`: the Builder's `Agent` is private to its controller, and
  `runEvals` takes no tool mocks nor `unmockedToolPolicy` at 1.83.0 (`evals/run/index.d.ts`;
  `ItemToolMock` and `unmockedToolPolicy` live on dataset items, `datasets/experiment/types.d.ts:60-63`).
  The scripted model keys on facts the setup must give it (the app folder, the skill, the tools),
  not on the instructions' sentences. A second case has a person paste a password: it proves the
  secrets rule reaches the model and that the gate fails without it, not that a real model obeys.
  Revisit when `runEvals` takes tool mocks, or the Builder's agent can be a target.

## Mastra 1.83.0: the Builder's end of the turn, open tasks (step 14.2)

- **The end of the turn is Mastra's `isTaskComplete`.** `agents/app-builder/builder.ts` gives the Builder's
  `defaultOptions.isTaskComplete` one code scorer, `conexus-check` (`agents/app-builder/processors.ts`
  `conexusCheck`), which finds the machine by the conversation in `customContext.controller`. It first
  reads the thread's task list from Mastra's `threadState` store, as `task_check` reads it
  (`tools/builtin/task-tools.ts:385-391` at `6a465f9d`); a turn that ends with tasks open, or with a
  failed app check, scores 0 and Mastra gives the scorer's reason to the model and calls it again
  (`formatCompletionFeedback`, the `task_complete_evaluation` event reaches the screen). Mastra's loop
  has no cap of its own for this, so ends with tasks open and failed checks each count up to `CHECK_LIMITS.checks`, kept by the run
  (`Runs.round`, by kind); at the limit the scorer passes and the version is saved `unfinished` or `failed`.
  Mastra's own `goal` judges completion with a model, not the list (`agent/goal/scorer.ts:14-28`), so
  it does not serve. Proof: `conversation-check.test.ts`, criterion 15 of step 14.2.

## Mastra 1.83.0: a tool call the model streamed unparseable (defect after v0.20.8)

- **Library line.** Mastra's in-process loop persists a tool call whose JSON it cannot parse with
  `args: undefined` (after `tryRepairJson`, which does not repair truncation), and replays it with
  `input: invocation.args`. `@ai-sdk/anthropic` writes `input: part.input`, `JSON.stringify` drops
  the undefined field, and Anthropic answers 400 `tool_use.input: Field required` to every later
  request of the conversation. Since `@mastra/core` 1.80.0 (PR #28332) the rule is Mastra's own:
  `tool-call-empty-input`, in `DEFAULT_COMPAT_RULES` (`dist/stream-Coth7KQ4.js:3189-3200`), sends a
  `tool-call` whose input is missing or `null` as `{}` in the outbound prompt only; the stored
  message is not touched, so a conversation already broken recovers on its next message. Mastra's
  in-process engine also scores an errored iteration through `isTaskComplete` (the durable engine
  skips it, Mastra issue #21897).
- **Hand-made piece.** `judge` in `agents/app-builder/processors.ts` returns finished once the queue has
  ended the turn (`turnIn(requestContext)?.outcome`), so a failed turn is not called again and no
  false `MODEL_NO_ACCOUNT` is stored. Visible change: the version of a failed turn with open tasks
  has no check verdict, like a turn that stopped on a question; before, it read "unfinished" only
  because of those false calls.
- **Why.** One bad tool call must never leave a conversation broken. Proof: in
  `conversation-tool-input.test.ts`, "guardou sem argumentos" (an `ask_user` call streamed truncated,
  then two more turns, against a double that answers the 400 and records each replayed `tool_use`
  input) proves Mastra's rule at the installed version, and "não volta ao modelo" (a call that fails
  with tasks open, through the public door) fails without the check. Not done:
  `toolStreaming: false` (changes card streaming for every call and leaves other providers exposed).

## Mastra 1.83.0 and @mastra/fastify 1.5.27: session routes behind the Hub's guard (step 14.2)

- **A fixed list, one guard.** `harness/routes/guard.ts` registers nine of Mastra's own
  agent-controller routes (a session's state, stream, message, Parar, a card's answer, a write's approval, transcript,
  the change of model, a conversation's rename; `FIXED_LIST`)
  through `@mastra/fastify`'s `registerRoute`, each declared `access: 'session'`; every other route
  of `SERVER_ROUTES` is not registered, so it is a 404 (decision 0050, S39). Mastra's `server.auth`
  stays off: the guard reads the Hub's session, finds the thread's owner in its `resourceId` and the
  Hub's index (S10), refuses a browser `requestContext` with 400, and sets the message's author.
  Proof: `conversation-routes.test.ts`, criteria 3, 30 and 31 of step 14.2.
- **The change of model is Mastra's own route.** `POST …/sessions/:sessionId/model`
  (`@mastra/server` 1.83.0 `agent-controller.js:869-890`, the Factory UI's `switchModel`) behind the
  same guard, which is stricter than Mastra's body: it asks the effort too, refuses a field more,
  asks the account (`conversationModel`) and the effort the model offers (`effortsOf`), and writes the
  agent's log line (from its ficha) only after Mastra's `{ ok: true }`; an agent whose ficha says the
  model is the version's (a saved agent) is a 404. Proof: `guard.test.ts` ("a troca de modelo…"),
  `lines.test.ts`.
- **Renomear is Mastra's own route too.** `PUT …/sessions/:sessionId/threads/:threadId`
  (`@mastra/server` 1.83.0 `agent-controller.js:1244-1269`, `session.renameThread`), whose body is
  any `{ title }`: the guard trims and checks it (`RenameBody`, one to `CONVERSATION_TITLE_MAX`
  characters) and puts the trimmed body in `request.body`, which `@mastra/fastify` 1.5.27 reads
  (`dist/index.js:198`). A `threadId` that is not the session's is a 404 (Mastra would switch the
  session's active thread). Mastra's `rename` pins the title (`titlePinned`) against the memory's own
  and keeps the thread's other metadata, so the marks that say whose a conversation is stay. The
  line `CONVERSATION_RENAMED` names the conversation and the agent, never the title, and waits for
  Mastra's `{ ok: true }`. Proof: `rename.test.ts` (four agents, refusals, after a restart),
  `assistant/rename.test.ts` (the memory's title does not replace it). Issue 655 (the first answer's
  automatic title can erase a rename made during it) stays open.
- **The Hub's close closes the open streams.** Mastra's stream route ends only when its request
  leaves (`@mastra/server` `dist/server/handlers/agent-controller.js:577-666` at 1.83.0, `abortSignal` at `:651-655`), so the guard keeps each open stream's
  response and the close destroys them once the runs have said their end, which `@mastra/fastify`
  reads as the request leaving; a session Mastra deletes
  with its Projeto ends its run without an `agent_end`, so `end.ts` lets it go on
  `onSessionDeleted`. Proof: `conversation-stream.test.ts`. Revisit when Mastra's server ends its
  streams on shutdown.

## Mastra 1.83.0: the stream sends the screen what it reads (memory, pace)

- **Library line.** `@mastra/core` 1.83.0 `agent-controller/session.ts` sends the session's whole
  display state after every event (the turn's message and every tool's input and result), which grows
  with the square of a turn's length. The stream route's `displayState: false` (`@mastra/server`
  1.80.0, PR #28527) cuts all of it, and the screen reads a part (`isRunning`, `pendingSuspensions`,
  `omProgress`), so there is still no option to send a subset.
- **Hand-made piece.** `slim` and `paced` in `apps/server/src/harness/routes/stream.ts`. `slim`
  keeps of a `display_state_changed` event only what the screen reads (`DISPLAY_READ`); every other
  event goes as Mastra sent it. `paced` writes each event once the response can take more and ends
  the stream of a page 8 MiB behind, which reads the transcript and the session again when it opens
  a new stream.
- **Why.** The screen draws no more than `DISPLAY_READ`; sending the rest cost the Hub's heap and
  bytes on a long turn.
- **Memory failure events go as Mastra sends them.** `om_observation_failed` and
  `om_reflection_failed` reach the browser with Mastra's own `error`; `slim` does not touch them
  (founder, 2026-10-31, "manter original"). The text is the library's output and is not rewritten
  here.
- **Proof.** `conversation-stream-paced.test.ts`: "um turno de 96 passos…" fails without `slim`;
  "uma página 8 MiB atrás perde o stream…" fails without `paced`. "uma página que lê devagar…" holds
  the order of events for a slow page and passes with Mastra's own adapter too, so it proves neither.
- **Revisit when** Mastra lets a stream send a subset of the display state, beyond `displayState: false`.

## Mastra 1.83.0: the turn's place in the queue of model accounts (Uma ficha por agente)

- **Library line.** `@mastra/core` 1.83.0 (`d60ba71b`) has no queue of model accounts and no
  several accounts for one person. Mastra Code reads one credential per organization and keeps no
  line (`mastracode/sdk/src/index.ts:1413-1416`, `resolveTenantSessionModel`); neither it nor the
  Factory has the piece (searched in both).
- **Hand-made piece.** `turnProcessor` and `sessionTurns` in
  `apps/server/src/harness/spec/turns.ts`: the one input processor that takes a run's
  `AccountTurn` for the account queue and puts it on the request context, and the way a session holds that
  turn until `agent_end`. Each agent's ficha chooses by its `turn` field: `SESSION` (the Assistant,
  the Construtor, a Project agent's conversation) or `RUN` (the Builder, and the version the
  Construtor tests, which have no session to hold it). Before the step it was three copies.
- **Why.** Decisions [0049](../decisions/0049-model-accounts-keys-sign-ins-queues.md) and
  [0050](../decisions/0050-conversation-on-the-agent-controller.md): a person's accounts, in order,
  one turn on one account at a time. Proof: the criteria of `model-accounts/` and the requests of
  each agent, which hold the same bytes before and after the join.
- **Revisit when** Mastra gains an account queue or several credentials for one person.

## Mastra 1.83.0: the Project's lock as the Builder's `take` (Uma ficha por agente)

- **Library line.** `@mastra/core` 1.83.0 locks by conversation only (`threadLock`,
  `@mastra/core/dist/agent-controller/types.d.ts:316-325`): two conversations
  of one Project run at the same time.
- **Hand-made piece.** `projectTurn` in `apps/server/src/agents/app-builder/turn-of.ts`, the
  Builder ficha's `take` (`turnOf`): the run takes the Project's lock (`Runs.take`) before any model
  call, or ends `RUN_BUSY` with the name of whose run holds it, and frees it at the run's end
  (`onEnd`).
- **Why.** A Builder run moves the app's Git reference, and that is the Project's, not the
  conversation's (decision [0027](../decisions/0027-mastra-builder-engine.md): the run engine is
  Conexus code). Proof: `conversation-turns.test.ts`, the case of two conversations at once in one
  Project: the second ends `RUN_BUSY` without calling the model; it fails when `projectTurn` stops
  refusing a lock that is taken.
- **Revisit when** Mastra can lock by a key other than the conversation.

## Mastra 1.83.0: a read never asks, by its own rule, not the session's `allow` (step 24.5)

- **Library line.** `@mastra/core` 1.83.0 (`d60ba71b`): the session's native "never ask" is the `allow`
  policy, which suspends the call and approves it at once
  (`packages/core/src/agent-controller/session.ts:4808-4829`, `:5019-5030` and `:6638-6642`). With `@mastra/pg`
  1.36.0 the approval loses the resume race (Mastra #27831, closed there without a fix; the cause is
  at `packages/core/src/agent/agent.ts:8757`).
- **Hand-made piece.** `requireApproval: NEVER_ASKS` (`apps/server/src/harness/spec/mount.ts`) in
  `askingOnlyByOwnRule` (same file), which a ficha with the regime `THE_WRITE_ASKS` runs over its
  tools: every tool whose rule is not a function (the reads, the shared ones, the web's, the code's)
  goes on a copy with `NEVER_ASKS`, and the given objects stay as they are; and the same
  `NEVER_ASKS` on the Computador's workspace in `apps/server/src/harness/machine/conversation.ts`.
  A tool's own rule runs before the session's policy, so the call is never suspended.
- **Why.** With `allow`, 12 of 200 reads were lost on Postgres; with the rule on each tool, 0 of 200
  (the study of step 24.5; Papéis P1).
- **Proof.** Covered, not fails without: `approval.test.ts`, "a escrita espera, o resto não", reads
  every tool of an agent running without asking while a write in Pergunta antes waits. No test
  swaps the rule for `allow` against Postgres, and nothing else protects it.
- **Revisit when** Mastra fixes the approval race, or `allow` stops suspending.

## Mastra 1.83.0: a step's answer without the body of its request

- **Library line.** `@mastra/core` 1.83.0 keeps every step's output, `request.body` included, until
  the session's next run (`MastraModelOutput` `#bufferedSteps[].request`, `dist/stream-Coth7KQ4.js:6999`;
  it joins equal requests only when it serializes, `:4730-4760`), so a conversation's last
  turn holds every prompt it sent. Nothing of ours or Mastra's reads the body back. The AI SDK's
  own `experimental_include.requestBody: false` (`ai@6.0.309` `generateText` and `streamText`) is
  not reachable here: Mastra's loop reads the provider's `stream.request` itself and takes no
  such option.
- **Hand-made piece.** `bodylessMiddleware` in
  `apps/server/src/harness/model-accounts/claude/models.ts`, a `wrapStream` that drops `request`
  from `doStream()`'s answer.
- **Why.** The Hub's heap grew with the prompts of the last turn of every open conversation.
- **Proof.** `prompt-cache.test.ts` "cada passo do modelo da conta volta sem o corpo do pedido…".
- **Revisit when** Mastra passes an include option to its loop, or stops keeping the request.

## Mastra 1.83.0: the store's domains log, and a model's output is read from its name

- **Library line.** `Mastra` gives its logger to the store, but `MastraCompositeStore` does not pass
  it on to the store's domains (the class at `dist/filesystem-versioned-CeCxYq38.js:250` has no
  `__setLogger` of its own), and each domain logs its own failures. The provider registry says of a model only
  `attachment`, `temperature`, `structuredOutput` and `reasoning` (`dist/capabilities/*.json`),
  nothing of what the model outputs.
- **Hand-made piece.** `apps/server/src/harness/mastra/mastra.ts` gives each domain the Hub's logger
  by the same `__setLogger`. `NOT_CHAT` in `apps/server/src/harness/model-accounts/providers.ts`
  leaves out a model whose name says it draws, films, speaks, hears, embeds, ranks, guards, reads
  scans or talks live.
- **Why.** A domain's failure would log nowhere the Hub reads; the model picker would list models
  that cannot hold a conversation.
- **Proof.** `providers.test.ts` "em todo fornecedor por chave, um nome que sugere mídia…" fails when
  a new such name enters the registry unread. No test fails without the logger line.
- **Revisit when** the composite store passes its logger to its domains, or the registry says what a
  model outputs.

## e2b 2.63.0: the version folder read without following a link (step 14.1)

- **Library line.** `e2b@2.63.0` `files.read(path)` reads by path and
  follows a link: `FilesystemReadOpts` has no `nofollow` (`dist/index.d.ts:5794-5807`). `files.list` (`:5972`)
  shows a link's `symlinkTarget`, but a link swapped in between the list and the read still passes.
  Mastra 1.83.0 `WorkspaceFilesystem.readFile` has the same shape.
- **Hand-made piece.** `packIn` in `apps/server/src/harness/machine/pack.ts` runs one Node program
  on the machine, while the run still holds it. The program opens every folder and file of
  `node_modules/.conexus/version` with `O_NOFOLLOW` through `/proc/self/fd`, refuses a link or a
  file that is not regular with `NOT_REGULAR`, counts every file against `APP_LIMITS` before reading
  any, and answers the folder in one reply.
- **Why.** The machine runs what the model wrote, so the version folder can hold a link out of it
  (S2, C59). Step 14 approved this patch (criterion 14 at `05b006ba`).
- **Proof.** `pack.test.ts` "Machines.pack: um link ou um arquivo que não é regular é NOT_REGULAR";
  `preview-send.test.ts` "pasta recusada", step 14.1 criterion 11. Live on 2026-10-25: three turns
  of the branch's Hub on real E2B machines (template `conexus-builder:0b2d667`) packed the starter's
  ~1 MB build in about 2 s with the release, and sent it to a real Cloudflare namespace. From the
  end of the turn to "Prévia pronta": 12.5, 16.3 and 20.5 s, of which the Cloudflare upload took 9.5
  to 17.1 s (about 0.3 s of bytes and about 9.7 s of Cloudflare's processing over five sequential
  calls).
  Revisit when e2b's read takes a no-follow option.

## Connectors (step 19): the kit's definition and the one executor

Zod 4.6.5 and Node 24.21.0's `fetch`, the installed versions. No connector library is installed:
the references read for this step (Activepieces `piece-metadata.ts:61-66`, Nango
`providers.yaml:9368-9400`) run their own runtime and none runs a provider call in Brazil with a
sealed credential, so both rows of the card's reference table that read "remendo" are written here.

### The definition of a connector (the kit's core)

- **Library line.** Activepieces' `ActionClassification` and `piece-metadata.ts` and Nango's
  provider entry declare a connector as data, but each leaves open the sealed credential's fields,
  the fixed origin, the class of every operation, the subject each read belongs to and the one-call-
  at-a-time rule. Zod 4.6.5 `z.object(...).strict()` parses the credential; it does not know which
  values are secrets.
- **Hand-made piece.** `defineConnector`, `defineOperation` and `toRequest` in
  `packages/connectors/src/kernel/`. The class is required and has no default; `toRequest` is the
  one place a URL is built, from the connector's fixed origin (or a local double's, named only in
  the Hub's configuration) and a checked path, with `redirect: 'error'` (`request.ts:48`).
- **Why.** A caller's text must never choose the host the Hub sends a credential to (S36), and a
  write must never pass as a read for lack of a class.
- **Proof.** Tests on the request origin, the refused redirect, the local-only origin and the read
  door's statement words. Also `kernel.test.ts` "a classe é obrigatória" and "a porta de leitura só
  aceita operações read", which fail at compile time or at definition rather than by a line a test
  could fail on.
- **Revisit when** a connector library runs a provider call in the Hub's region with the credential
  sealed.

### The executor (the only code that opens a credential and calls a provider)

- **Library line.** Node 24.21.0 `fetch` returns the response before its body is read, throws a
  `TypeError` for a network failure or a refused redirect and `TimeoutError` or `AbortError` for the
  deadline (`AbortSignal.timeout`), and has no cap on the body. Nango's `buildValuesToFilter`
  removes a credential's values from what it logs; Mastra Connect's proxy keeps the credential
  outside the caller. Neither runs in Brazil.
- **Hand-made piece.** `createExecutor` in `apps/server/src/hub/connectors/executor.ts`. `bodyOf`
  reads the answer in pieces up to 2 MiB (`RESPONSE_CAP_BYTES`, `wire.ts`) and cancels past it; `redacted` replaces every secret of
  the request, as it is and as JSON writes it, in every body before the answer is read;
  `unreachableCause` turns only what `fetch` documents for an unreachable provider into
  `UNREACHABLE` and logs the error's name and the system code of its cause, and any other error
  goes up (decision 0056, S36, S41).
- **Why.** A provider's body is its own and can be large or carry the credential back; and a bug in
  the executor must not read as "the provider is down" (the founder, 2026-10-29: "a gente estava
  suprimindo alguns erros. Para mim isso não é bom").
- **Proof.** `executor.test.ts` "a origem, o redirecionamento e o teto" covers the refused redirect
  and the response cap. Also, each on the public door: "o corpo de erro perde os valores da
  credencial antes de ser lido", "o token sai de todo corpo de uma operação, no envelope do gateway
  e no erro REST", "um erro de programação dentro do envio sobe como falha, não vira UNREACHABLE"
  and "um corpo de erro que não é JSON chega como texto e o status decide".
- **Revisit when** Node's `fetch` takes a body cap, or a connector library runs the call in Brazil
  with the credential outside the caller.

## Connectors (O conector no padrão novo): the kit's session and the credential class

Node 24.21.0 and Zod 4.6.5, the installed versions. The reference for both rows is singer-sdk 0.54.9,
read and not installed: the copy task's Python runs it, and no Node library holds a provider session.

### The session: a token reused, renewed before its end, logged out at the close

- **Library line.** singer-sdk 0.54.9 `singer_sdk/authenticators.py:526-527` renews an OAuth token
  when it is no longer valid, and `:609-619` takes its expiry from the answer's `expires_in`. It has
  no logout, renews only on its own clock, and repeats nothing when the provider ends a token early.
- **Hand-made piece.** `sessionOf`, `credentialsSource` and `openSession` in
  `packages/connectors/src/kernel/session.ts`. The session reuses a token while it lives, renews it
  `RENEW_BEFORE_MS` (60 s) before its end with the old one logged out first, opens a new token and
  repeats once when the provider ends one (a second end is `NEEDS_REAUTH`), and logs out at `close`.
  A token source says where tokens come from: the kit's login of pasted fields, or the Hub's leased
  refresh of an exclusive grant (`oauthSource` in `apps/server/src/hub/connectors/tokens.ts`), whose
  renewal serves once. The Hub keeps one session per pasted-key connection and ends each token before
  it expires (`createSessions` in `limits.ts`).
- **Why.** An expired Sankhya token's logout is refused and its session hangs (measured 2026-10-30),
  so the renewal and the logout belong together; the copy task (U4) and the Hub read through the
  same rule (decision 0077; the A of the connector).
- **Proof.** The P2 probe (87 lines, 4 renewals in 100 s, no session left hanging).
  `packages/connectors/src/kernel/session.test.ts` against the Sankhya double with a test clock: a
  read longer than the token renews before its end, logs the old one out first and leaves no session
  open after the close; an ended token is renewed without a logout and the read repeated once; a
  second end is `NEEDS_REAUTH`. The Hub's `connections-refresh.test.ts`, `connections-sessions.test.ts`,
  `write-lost.test.ts` and `limits.test.ts` pass through it unchanged in what they expect.
- **Revisit when** a Node library holds a provider session with a logout, or singer-sdk adds one.

### The credential class, as the login's data

- **Library line.** No reference declares it as data: singer-sdk 0.54.9 and Nango assume one holder
  per credential.
- **Hand-made piece.** `CredentialClass` in `packages/connectors/src/kernel/credential-class.ts`,
  required on every login (`credentialClass` on `ClientCredentialsAuth` and `OAuth2CodeAuth`), and
  `defineConnector` refuses a login without it. SHAREABLE on the Sankhya; EXCLUSIVE on Mercado Livre,
  whose refresh key serves once, and on HubSpot until measured.
- **Why.** The copy task holds its own session beside the Hub's only with a shareable credential
  (decision 0077:11-16).
- **Proof.** The Sankhya: two logins of the same keys keep their sessions (`conexus-v17-sonda`; the
  token ends at 300 s in use). `kernel/conformance.test.ts` "a classe da credencial".
- **Revisit when** HubSpot's renewal is measured.

## Connectors (step 19.1): the Mercado Livre documentation check

playwright-core 1.63.0, the installed version. Mercado Livre publishes no OpenAPI and no `llms.txt`
(`/llms.txt` answers 404; none of the 221 pages read on 2026-10-29 names an OpenAPI file), so no
reference tool checks a read against its documentation.

- **Library line.** Sankhya's `spec-source.ts` downloads a published OpenAPI document and checks the
  route and the response schema. Mercado Livre has none, and its site answers 403 to a plain HTTP
  client and to headless Chromium, and 200 to a normal browser window.
- **Hand-made piece.** `packages/connectors/src/mercado-livre/docs-source.ts` reads the page each
  read cites through a headed Chromium (`inBrowser`), at run time, and `docs.test.ts` checks that the
  read's route is in the page's text (`MERCADO_LIVRE_DOCS_ONLINE=1`, `npm run test:docs -w
  @conexus/connectors`, by hand on a desktop, never in CI).
- **Why.** The founder, 2026-10-29: "não guardar e baixar na hora". The check is weaker than
  Sankhya's: it does not check the shape of the answer.
- **Proof.** Card criterion 21: a read whose route is not in the page fails. The test
  needs the live site.
- **Revisit when** Mercado Livre publishes an OpenAPI document, or a read fails on a real account
  (then its answer, without company data, becomes the double's data).

## Connectors (As buscas do Sankhya): the searches' SQL, with one literal we quote

- **Library line.** Zod 4.6.5 validates the integers and the text of a search; it builds no SQL.
  The kit sends Sankhya's `DbExplorerSP.executeQuery` only `{ sql }` (`queryRequest` in
  `packages/connectors/src/sankhya/door.ts`); whether it takes bound values is not verified, because
  the step made no call to the real Sankhya. The step's study measured `TRANSLATE`,
  `LIKE ... ESCAPE` and `OFFSET/FETCH` on Oracle 19.0.0.0.0, without the `ROW_NUMBER()` window.
- **Hand-made piece.** `packages/connectors/src/sankhya/search.ts`. The text of each search is
  a constant of its read (`operations/buscas.ts`, `operations/buscas-estoque.ts`); a number enters
  only as a Zod integer; a name enters only through `SearchText` (2 to 60 characters, no control
  character, line or paragraph separator, `--`, `/*`, `*/` or `;`) and `contains`, which folds case
  and accent as `TRANSLATE(UPPER(column), ...)` does, doubles the single quote and tests the text
  as a substring with `REPLACE(value, 'TEXT', 'TEXT~') <> value`, not `LIKE`: no character is a
  wildcard on Oracle or on SQL Server, whose `LIKE` reads `[` as a class (#929), and Oracle refuses
  an `ESCAPE` before `[` (ORA-01424). `queryRequest` judges the whole statement again with
  `isOneReadStatement`. The double (`fake-sales.ts`) runs the same SQL in SQLite with Oracle's
  `TRANSLATE`, a Unicode `UPPER` and SQL Server's `LIKE`, classes and all, so a search back on
  `LIKE` finds too much.
- **Why.** The founder's choice B, 2026-11-09: one search in the connector that the Project's
  agent, the apps and the Assistant share, and one call that returns many rows. What the model
  writes is hostile input (S2, S15).
- **Proof.** `search.test.ts` covers the text marks, `%`, `_`, `\`, `[` and `]` as themselves ("o
  colchete na busca") and the doubled quote; both fail with the search back on `LIKE`. The check in
  `queryRequest` fails the same file's hostile-input test without it.
- **Not proved.** `REPLACE` on the real Oracle and SQL Server: the study measured `TRANSLATE`,
  `LIKE ... ESCAPE` and `OFFSET/FETCH`, not `REPLACE`.
- **Revisit when** a read-only rehearsal on the real Sankhya shows the DbExplorer takes bound
  values (then the literal goes), or the first company runs Sankhya on SQL Server.

## Connectors (A primeira cópia chega ao lago): the month window of a table

- **Library line.** `singer-sdk` 0.54.9 has no window mode: a stream without a replication key is
  read whole on every pass, and a stream with one keeps a single point. `meltano` 4.4.1 keeps that
  point per stream. Neither reads a table again by month. The card's row 66 holds the comparison.
- **Hand-made piece.** The `WINDOW` mode of a table (`packages/connectors/src/kernel/tables.ts`):
  a date column, `step: 'MONTH'` and `reread`. `tableMonths` (`kernel/tables-read.ts`) asks the
  connector's `months` hook for the months the column has rows in, and `readTablePage` takes the
  filter `{ kind: 'MONTH', column, month }`. On the Sankhya, `contarMeses` and the page SQL
  (`sankhya/copy-reads.ts`) count by `TO_CHAR(column, 'YYYY-MM')` and read between the month's
  first day and the next month's. A year out of the calendar (0208, 2109) is a month like the
  others. A pass after the first rereads from the saved month, or from `reread` months back when
  that is earlier, up to the current one, so a copy stopped for months misses none: Airbyte's
  `DatetimeBasedCursor` starts its `lookback_window` from the saved point
  (the `source-shipstation` connector's `manifest.yaml:116`, at `82db089b`), as dlt's `lag` does
  (`dlt/extract/incremental/__init__.py:142`, at `8fa90a97`). The current layer follows the same
  months: `_replace_months` (`apps/extraction/src/conexus_extraction/update.py`) deletes from the
  current table every month from the first one the pass reached, up to the current month, before
  the pass's rows go in, so a row the source dropped from a re-read month leaves the lake. A whole
  pass deletes every month, or every month since the start date. Neither reference does it: the
  AWS skill says to replace the partition (`EST/a0-alteracao-fiscais:166`, `:169`), and ours is
  that replacement by month.
- **Why.** The fiscal tables have no change column, and the A0D measurement read 3,140 rows per
  second by month against 442 without the window (`EST/a0d-sankhya-kit-mes:93-106`). The month
  window is our extension of decision 0080.
- **Proof.** `sankhya/copy-tables.test.ts`, "os meses da contagem": the double's months come back
  with the two out of the calendar, and each month's page holds that month's rows only.
  `apps/extraction/tap/src/tap-pass.test.ts`, "a janela parada": a point five months back rereads
  every month since. `apps/extraction/tests/test_update.py`, "a janela troca o que leu": the month
  that lost a row in the source loses it in the lake, and the months before the re-read stay.
  `kernel/conformance.test.ts`, "a declaração por tabela", refuses a window on a column that is not
  a date.
- **Not proved.** The count on the real Oracle: the double runs the same SQL in SQLite. The
  replacement of months on Athena (the double runs it in DuckDB): L.7. A month emptied in the
  source that is older than the re-read months stays in the lake until a whole pass.
- **Revisit when** `singer-sdk` or `meltano` gains a partition or window mode.

## Connectors (A primeira cópia chega ao lago): the current layer, one case a statement

- **Library line.** No library updates the current table of a lake from Singer rows.
  Airbyte's destination writes one `MERGE` with the update, the delete and the insert as cases
  (`AB JdbcSqlGenerator.kt:219-238`), and dlt's merge job is the other form read
  (`DLT dlt/destinations/sql_jobs.py:1120-1139`). Athena on `S3 Tables` fails a `MERGE` of two or more
  cases from about 230 to 337 columns and runs one case with 450 (`EST/achados-auditoria:49`,
  `:321`).
- **Hand-made piece.** `Updater._merges` in `apps/extraction/src/conexus_extraction/update.py`:
  three `MERGE` statements over the rows the pass added to the raw table, one case each. The first
  updates the rows that match and are not marked deleted, the second deletes the ones marked
  deleted, the third inserts what does not match. Our writer has no row hash, so the update rewrites
  every matched row of the slice. The slice is the newest row of each key between the point of the
  last update (`conexus.atualizado_ate`) and the highest `_sdc_sequence`, so a repeated update
  finds nothing new. A new column in the raw table reaches the current one before the first
  statement (`union_by_name`).
- **Why.** Decision 0080: the raw table appends, the current one follows the mode. One case a
  statement is the form that passed on 450 columns.
- **Proof.** `apps/extraction/tests/test_update.py`, "a atual segue a fonte" (the source's note,
  changed, created and deleted, and no statement with two cases) and "a coluna nova na atual"; the
  hand mutation that cleans before the `MERGE` turns "a limpeza" and "a atual segue a fonte" red.
- **Not proved.** On Athena, with the real 450 columns: L.7. The tests run the statements in DuckDB,
  whose dialect is not Trino's, over the recorded Athena envelopes.
- **Revisit when** Athena runs a multi-case `MERGE` on a wide table, or `S3 Tables` maintains
  the history itself.

## Connectors (A primeira cópia chega ao lago): the raw history is cleaned once it is in the current layer

- **Library line.** No reference cleans a raw layer: Nekt keeps the history as an optional module of
  each table (`NK:8635`), Databricks keeps a type 2 history per table, Airbyte kept everything, and
  `S3 Tables` keeps 120 hours of snapshots.
- **Hand-made piece.** The last step of `Updater._update`: `DELETE FROM raw` of every row up to the
  update's highest `_sdc_sequence`, after the current table and its properties are written, in every
  table, the NF-e's XML included. A table declared `history: true` skips it. A crash between the
  properties and the cleaning repeats the cleaning, and the next update finds no new row.
- **Why.** The founder, 2026-11-24: the XML has no history either, and the raw layer is a passage,
  not an archive. Decision 0080.
- **Proof.** `apps/extraction/tests/test_update.py`, "a limpeza", "o xml sem historico" and "a
  limpeza pula o historico".
- **Not proved.** The cleaning on Athena's real `DELETE`: L.7.
- **Revisit when** the founder asks for history of a table, or the raw tables hold more than the
  rounds in flight.

## Connectors (A primeira cópia chega ao lago): the adapter speaks Singer in TypeScript

- **Library line.** `singer-sdk` 0.54.9 builds a tap in Python, and the kit is TypeScript, so a
  tap built with it would declare each system a second time (0071, 0074). `meltano` 4.4.1 runs any
  executable that reads `--config`, `--catalog` and `--state` and writes Singer lines. The card's
  row 11 holds the comparison.
- **Hand-made piece.** One tap for every connector, in `apps/extraction/tap/src/`: `tap.ts` reads
  the command line and the files Meltano hands it, `messages.ts` writes the catalog and the Singer
  messages, `pass.ts` reads each chosen table page by page, and `source.ts` sends the kit's
  requests. The parts copy singer-sdk's own conventions: `x-singer.decimal` for a number, and a
  page that fails out of reach repeated five times on `backoff.expo(factor=2)` with up to one
  second of jitter (`streams/rest.py:856-894`), with a 429's own wait. Bytes go as base64 with
  `contentEncoding`, the way Airbyte types a binary column
  (`airbyte-cdk/bulk/core/base/.../data/AirbyteSchemaType.kt:37`, at `82db089b`) and JSON Schema
  names the encoding; singer-sdk itself writes bytes as hex
  (`singer_sdk/helpers/_typing.py:539`). A pass of a table that follows a change column saves
  the column's greatest value asked before its first page, not the greatest it read, so a row
  changed behind the key walk comes again in the next pass: Airbyte's `cursorUpperBoundQuery`
  (`airbyte-cdk/bulk/toolkits/extract-jdbc/.../read/DefaultJdbcPartition.kt:228-231`).
- **Why.** The live calls and the lake copy must read one definition (0071), and only the kit
  holds it.
- **Proof.** `apps/extraction/tap/src/tap.test.ts` and `tap-pass.test.ts` run the command line
  against the Sankhya and HubSpot doubles; `tap-ceiling.test.ts` changes a low key and then
  writes a high one between two pages, and the next pass reads both. singer-sdk 0.54.9's standard tap battery, run outside
  the repository against the tap's own output, passed 284 tests over the Sankhya double's seven
  tables and 13 over the HubSpot double's one. `test_tap_battery.py` enters with U5.
- **Not proved.** A run under Meltano (U5), the real Sankhya, and a HubSpot token that expires
  during a run: the tap never renews it. A table read through an operation has no ceiling to
  ask, so its pass still saves the latest change it read; no declared table does so today.
- **Revisit when** the kit can be read from Python, or Meltano changes how it calls a tap.

## Mastra 1.83.0: a conversation's changing state lives in a Hub table (step 24.1)

- **Library line.** At `@mastra/pg` version 1.36.0 and `@mastra/memory` version 1.41.1 (the lockfile's),
  `@mastra/pg` `updateThread` (`dist/index.js:12411-12446`) now locks the thread row while it reads
  and merges the metadata it is given (pg #29150). Observational memory still writes the thread title
  through `patchThread` with the full metadata it read earlier, outside that lock
  (`@mastra/memory` `dist/src-MUc-jGgr.js:33712-33728`). That write can put back a value that
  another request changed in between. Reported to Mastra (feedback, 2026-11-01).
- **Hand-made piece.** The Assistant's chosen connections and its place live in
  `builder.assistant_conversation`, which only the Hub writes (`apps/server/src/agents/assistant/chosen.ts`,
  `context.ts`; founder's D11 word, 2026-11-01: "Aprovo as permissoes do b1"). The thread's metadata
  keeps only marks set once at `createSession({ tags })`.
- **Why.** The step's B1: a change of connections made while Mastra saved the title came back on
  the next turn. The Builder's own metadata has the same exposure; per-conversation state that
  changes after creation goes in a Hub table, never in the thread's metadata.
- **Proof.** `instructions.test.ts` "trocar a escolha enquanto o Mastra grava o título": the next
  turn reads only the new choice, and the title stays.

## Mastra 1.83.0: the list of conversations narrowed by title and place (step 24.3.3)

- **Library line.** At `@mastra/core` version 1.83.0 and `@mastra/pg` version 1.36.0 (the lockfile's),
  `listThreads` filters by `resourceId` and by metadata equality only (`@mastra/core` `dist/storage/types.d.ts:183-209`;
  `@mastra/pg` `dist/index.js:12169-12260`, a `@>` containment). It has no title search, no "the key is
  missing" and no "any value of the key".
- **Hand-made piece.** `listedPage` in `apps/server/src/agents/assistant/search.ts`. With a text or a
  place it reads all the person's threads (`perPage: false`) and filters here: the title composed, without
  accent and without case; `HOME` as the missing project mark and `AUTOMATIONS` as the present automation
  mark; then it pages 30 at a time under the same token. Without text or place it is Mastra's own page.
- **Why.** The founder's A a and B a on the list (2026-11-03): the search is on the title, and the filter
  has Todas, Início, each Projeto and Automações. The step measured 500 threads of one person through the
  whole Hub: a read of all of them took about 10 ms, so the read stays whole until a person holds
  thousands of threads. That is the trigger to revisit: a title column or a search index of the Hub's own.
- **Proof.** `list-search.test.ts` "a busca" (accent, case, spaces, nothing found) and "o lugar" (the
  marks, with and without a text): each fails when its comparison or its mark is taken out.

## CLIProxyAPI v8.0.33: unions flattened on the Google sign-in (fix, PR 764)

- **Library line.** At CLIProxyAPI v8.0.33 (`infra/hub.Dockerfile`; unchanged in v8.0.56),
  `internal/util/gemini_schema.go:73-83`, `:941` and `:957-971` drop every `enum` from a tool's
  schema for the Antigravity path and keep a multi-branch `anyOf`; `antigravity_executor_request.go:70-77`
  sends the same cleaned schema to Gemini (commits `7d55d0da` and `5efe9758`).
- **Hand-made piece.** `forCliProxy` in `apps/server/src/harness/model-accounts/google/flat-unions.ts`,
  called by `accountPick` only when the account is `google_cliproxy`. For that step it declares flat
  any tool whose input has a union of objects told apart by a fixed-value field (`cadence` of
  `propose_automation`); `execute` and the validation stay the tool's own, so the card, the route and
  storage see only the correct `Cadence`. Founder, 2026-11-05: "B, mas apenas para o Gemini via CLI PRoxy".
- **Why.** Through the proxy the four branches of `cadence` reach Gemini differing only by a text hint,
  and Gemini never called the tool. With `cadence` flat it called it correctly 6 of 6 in a local proof
  of 18 calls to the company's Google login.
- **Proof.** `google/flat-unions.test.ts` "sem união": the declaration the proxy receives has no union.
- **Revisit when** CLIProxyAPI keeps the tools' `enum` for Gemini, or the `google_cliproxy` path leaves
  the product. Then delete the file, its test, the lines in `processors.ts` and this entry.

## `@mastra/memory` 1.41.1 and CLIProxyAPI v8.0.33: the Automático model on the Google sign-in (fix)

- **Library line.** `@mastra/memory` 1.41.1 picks `gemini-2.5-flash` for Google as the Automático model
  (`src-*.js:23677`), which the proxy does not list, so the memory's calls fell to the conversation's model.
- **Hand-made piece.** `CLIPROXY_AUTO_MODELS` in `auto-memory-model.ts`, read by `modelOf` with the turn's
  account kind, picks the cheap model the proxy serves (`gemini-3.5-flash-lite`) as Mastra's `autoModels`
  option allows. Founder, 2026-11-09: only on the `google_cliproxy` path.
- **Why.** A conversation on `gemini-3.8-flash-high` through the sign-in showed Memória 100% and "O modelo
  não respondeu". The local reproduction showed the Observer asking a model the proxy does not list. The
  fix covers that reproduced cause; the real error of production was not read, and a provider 429 is not
  resolved by it. The trace of a failed call is the `MASTRA_ERROR` line, with the error's name and status.
- **Proof.** `agents/assistant/assistant-memory-cliproxy.test.ts`: the observer's request asks
  `gemini-3.5-flash-lite`, or the conversation's model when the proxy does not serve it.
- **Revisit when** the proxy lists `gemini-2.5-flash`, or the `google_cliproxy` path leaves the product.
  Then delete the constant, the `kind` argument, the test and this entry.

## Mastra 1.83.0: the sign-in kinds an operator opens to a company (Assinatura ChatGPT)

- **Library line.** None. At `@mastra/core` 1.83.0 the model router reaches every provider of
  `dist/provider-registry.json`, and Mastra Code's `auth/storage.ts` (`@mastra/code-sdk` 1.18.0)
  keeps one person's credentials. Neither has a switch per company for a kind of sign-in, and the
  Codex CLI has no company at all.
- **Hand-made piece.** `builder.company_account_kind` (`apps/server/src/harness/model-accounts/tables.ts`)
  and `openKindsOf` in `kinds.ts`, read by `admitOpen` in `sign-ins.ts` when a sign-in starts, when a
  pasted code completes it and on every device-code poll (`sign-in-poll.ts`). The API key is open to
  every company; `claude_subscription`, `google_cliproxy` and `openai_codex` start off.
- **Why.** Decision 0049: each subscription signs in as the vendor's own client and carries the
  vendor's terms, so an operator opens it company by company. Decision 0060 adds `openai_codex`,
  off by default; the founder's "3. Da empresa também sem gambiarra aptch, seguindo nosso padrão e
  lógica" keeps one path for every kind.
- **Proof.** `model-account-kinds.test.ts` "Assinatura ChatGPT vem desligada; o operador a liga e a
  desliga como os outros tipos"; `sign-ins.test.ts` "tipo desligado: start e complete dão 422
  MODEL_ACCOUNT_KIND_OFF"; `openai/sign-in-refusals.test.ts` "tipo desligado: recusa sem chamar a
  OpenAI"; `openai/sign-in.test.ts` "tipo desligado no meio".
- **Revisit when** Mastra or an auth library ships a per-tenant switch of providers or sign-in kinds.

## Mastra 1.83.0: the company's memory through one file (Alinhamento do Assistente)

- **Library line.** `Knowledge` is experimental in `@mastra/core` 1.83.0: the API can change without
  notice, its storage has no migration (`KNOWLEDGE_STORAGE_SCHEMA_VERSION` 4,
  `dist/knowledge/`), a new Mastra that changes the format asks to drop its tables, and
  `knowledgeMemoryScopes` (`dist/evented-execution-4C5qBV8d.js:20944`) makes every run an editor of its
  tenant. The library's pinned text still names the write tool
  (`PinnedStateProcessor`, `dist/evented-execution-4C5qBV8d.js:32477`); its `instructions` option changes
  only the usage block.
- **Hand-made piece.** `apps/server/src/agents/assistant/company-memory.ts` is the only file that
  talks to `Knowledge`. Its scopes make a run a viewer of its thread, its resource and its company
  (`org:$orgId`), and the tool set is the closed `COMPANY_MEMORY_TOOLS` (search, read, list: the
  model never writes, it proposes with `propose_company_memory` and a person who may saves from the
  card, decision 0064). The company's instructions are a page declared and pinned by the
  configuration, written by the host through `PUT .../instructions`. The Mastra navigation routes
  stay off by default and the Hub exposes only its own (`harness/routes/guard.ts`, S39). The
  permission "Memória da empresa" is the Hub's, in `hub/identity/admission.ts`.
- **Why.** A model that may write to the company's memory by the library's own tools would bypass
  the roles; one file and one test keep an experimental storage from spreading.
- **Proof.** `company-memory.test.ts` "o formato do Knowledge" (fails when a Mastra changes the
  schema version: export the pages with `readKnowledgePage` and `listKnowledgeTreeChildren`,
  write them back with `upsertPage` after the reset).
- **Revisit when** Mastra takes `Knowledge` out of experimental, or adds a migration or a way to
  rewrite the pinned text.

## Mastra 1.83.0: the research helper's account, tools and numbered files (Alinhamento do Assistente)

- **Library line.** `AgentController` runs a subagent as a new `Agent` with no processors; its model
  comes only from the synchronous `resolveSubagentModel`, its context is a new object with an empty
  `resourceId`, and the controller's tools are copied from the main agent's
  (`@mastra/core@1.83.0` `dist/agent-controller-BhkzVgCi.js:9120`, `resolveSubagentModel`). Mastra's own
  `subagent` tool takes `forked` and `modelId` from the model; `forked: true` runs the main agent
  itself. No tool file is numbered by the library: the name `reads/<turn>-<n>.json` is ours.
- **Hand-made piece.** `apps/server/src/agents/assistant/research.ts`: the one type `pesquisar`
  with the four read tools of the machine and `connector_read`; `researchOnly`, a processor that
  closes the `subagent` tool to `agentType` and `task` and always calls Mastra's `execute` not
  forked; `researchReads`, the helper's `connector_read` built for each run with the conversation of
  whoever asks, through the same door as the main agent (the 50 calls count by the turn);
  `subagentModel` (`model-accounts/side-calls.ts`, handed to `resolveSubagentModel` by
  `harness/spec/factories.ts`) returns the model of the account the turn is calling, as the
  conversation's title does; and
  `readsFiles` (`agents/assistant/connector-access.ts`) counts the files by the turn's key, because the
  helper's context is another object and its first file would overwrite the turn's first.
- **Why.** The helper must read with the asker's scope and the turn's account, write nothing and never
  open another helper; a count per context object loses the file of one of them.
- **Proof.** `research.test.ts` "o ajudante só lê", "a porta, as 50 e o arquivo", "a conta da
  conversa" and "a falha da conta".
- **Revisit when** Mastra lets a subagent run the input processors, take its tools from the asker's
  context, or report its usage (today a subagent emits none, `:6898-6931`).

## The ceiling of 50 reads per answer (Alinhamento do Assistente)

- **Library line.** Nothing in `@mastra/core` 1.83.0 counts a turn's calls to a system outside the
  model: `stopWhen` sees only the model's loop, and no reference has such a ceiling.
- **Hand-made piece.** `CONNECTOR_CALLS_PER_TURN` and `createSpending` (`hub/connectors/builder-port.ts`):
  a synchronous counter by key (a run for the Builder, a turn for the Assistant), the oldest key
  forgotten past `TURNS_KEPT`, at the Hub's door. It counts the typed reads, the notebook's saves and
  the research helper's reads together, with the tools in parallel.
- **Why.** It protects the company's system; the door is where every read passes.
- **Proof.** `hub/connectors/tool-door.test.ts` "50 por turno" and `assistant-port-note.test.ts`; the
  helper's share in `agents/assistant/research.test.ts` "a porta, as 50 e o arquivo".

## @aws-sdk/client-ecs, client-ssm and client-sqs 3.1175.0, Mastra 1.83.0: the lake copy's start and its end (A primeira cópia chega ao lago)

### The start: one door, `iniciarRodada`, with a start line of its own

- **Library line.** `@aws-sdk/client-ecs` `dist-types/models/models_1.d.ts:3243-3343` (`RunTask`, its `clientToken`
  and `overrides`) and `:2858`. The library runs a task; it keeps no schedule, no run record and no pace.
  `@mastra/core` 1.83.0 `mastra.schedules` keeps a cron per workflow id, and runs the workflow's step.
  The eight systems the study of the clock read keep the schedule in their own control plane, not in
  a cloud scheduler. SSM `PutParameter` answers at most 3 writes a second by default (the study of
  the start).
- **Hand-made piece.** `iniciarRodada` in `apps/server/src/hub/copies/lake-run.ts` is the one door the
  clock, "Rodar agora" and "Ler de novo desde a data" all call. It sweeps the connection's open
  rounds (`lake-sweep.ts`), opens the round (the open-round index refuses a second one), then
  queues the start: one start at a time, at most 3 `PutParameter` a second, then `RunTask` with
  `clientToken` `<round>-<attempt>` and the machine size by `overrides`. `harness/copy-clock/` says only
  when: `cronOf(interval, anchor)` in São Paulo time, set into `mastra.schedules` under the
  connection's id, and a step that calls `iniciarRodada` and ends when it answers. `MANUAL` leaves no
  row. The start line, the machine sizes and the 48 hours of `RUN_STALE_MS` have one owner each in
  `lake-run.ts`.
- **Why.** The library has no per-connection anchor, no start order and no rate keeper; a fixed
  `*/15` cron drifts from the minute the copy was born, and ten starts in a second would meet the
  quota. The workflow step must not run the copy inside the step (the task runs outside the Hub).
- **Proof.** `lake-run.test.ts` "o disparo", "o tamanho da máquina", "uma partida por vez" (the
  parameter double never receives more than 3 in a second), "dois disparos juntos", "a AWS recusa",
  "a AWS não responde"; `lake-sweep.test.ts`; `clock.test.ts` "o relógio conta da hora em que a cópia
  nasceu" and "o relógio só diz quando"; `mastra.test.ts` "o relógio da ligação". On AWS, L.9 ten
  starts in a second (the laboratory output in the pull request of group G4).
- **Revisit when** `@aws-sdk/client-ecs` or Mastra's schedules change, or SSM's default rate does.

### The end: the result and the stop in one queue; the first to arrive closes

- **Library line.** `@aws-sdk/client-sqs` `dist-types/models/models_0.d.ts:1373` (a standard queue
  delivers at least once and keeps no order). The EventBridge rule sends ECS's `STOPPED` to the same
  queue; ECS keeps no record of why a Conexus task ended.
- **Hand-made piece.** `lake-queue.ts` reads the queue only while a round is open, and closes a round
  through `closeLakeRun` in `lake-close.ts`: `UPDATE ... WHERE ended_at IS NULL`, so the first to
  arrive writes the counts, the table's rows and the last run, and the message leaves the queue after
  the close is written. A stop with exit 0 does not close at once: it waits `RESULT_GRACE_MS` for the
  result, which the task sends before it exits (`apps/extraction/src/conexus_extraction/entry.py`), and
  the sweep honours the same wait from the `stoppedAt` ECS gives. Any other stop closes at once.
- **Why.** A standard queue may deliver the stop before the result; marking lost a copy that ended
  is the one error the end must not make. The grace has one owner, `lake-close.ts`.
- **Proof.** `lake-queue.test.ts` "o resultado e a parada", "as 100 mais novas", "a tarefa que
  morreu", "o parâmetro sai no fim", "o banco fora", "o banco que dorme";
  `lake-queue-order.test.ts` "a parada antes do resultado" and "a parada sem resultado depois da
  graça"; `lake-sweep.test.ts` "a varredura espera a graça". The chain with its lines:
  `prova-ordem-resultado-parada` in the pull request of group G4. On AWS, L.3 (the four ends).
- **The grace's base (laboratory, 2026-11-25).** From the `stoppedAt` ECS gives to the stop event in
  the queue: 0.12 s to 0.16 s, read by `ReceiveMessage` 0.34 s to 0.38 s (5 tasks). ECS keeps the task
  about 24.5 s between its exit and `STOPPED`, so the result, which the task sends before it exits,
  arrives about 25 s before the stop on the normal path. The grace does not cover that delay: it covers
  the result's own redeliveries while the database is down, 3 receptions of 30 s plus the 20 s long
  poll, about 110 s, with the margin to 300 s. The delay of a result sent late could not be measured:
  the laboratory has no writer role, and the queue's policy denies the send to anyone else.
- **Revisit when** the queue or the rule changes, or a measured delay of the result exceeds the
  grace.
