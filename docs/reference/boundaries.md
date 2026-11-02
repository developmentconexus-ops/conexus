# Boundaries: where Conexus keeps a hand-made piece over its library

[Code C75](../guides/code.md) says to use the library's own mechanism first. This file records each
mechanism that Conexus writes itself instead, with the library line it replaces and the reason. The
versions are the installed ones, except five candidates read from the npm registry and not
installed: Stryker 10.0.0, remark-validate-links 13.1.0, the Cloudflare SDK 7.3.0, zod-openapi 6.0.2
and @asteasolutions/zod-to-openapi 9.1.0. When the library changes, reread the line it names. Every
piece of this file that a row of `scripts/removals.json` protects names that row, and its test
"fails without" the piece; a piece whose tests only "cover" it has no row. The rows this file does
not name protect Hub rules that are not boundaries over a library: the replay of an attempt key,
that only the Operations Central creates a company, the state of a listed invitation, and a write
refused for its media type or its origin.

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
  out, and no single removal row proves either. The tests "ao mesmo tempo, com dois e-mails" and
  "ao mesmo tempo, a mesma pessoa duas vezes" in `first-person.test.ts` fail without the lock
  (removal `first-person-lock`).

### The plain adapter joins that transaction too

- **Library line.** `@better-auth/core/context` exports `getCurrentAdapter`, which the internal
  adapter and the organization plugin's adapter call to reach the open transaction. The invitation
  endpoint's `resend` branch does not: it writes the new expiry through `ctx.context.adapter`
  (`better-auth/dist/plugins/organization/routes/crud-invites.mjs:135-143`), on the library's own
  connection, as the Hub's login, outside the scope.
- **Hand-made piece.** `joiningTransaction` in `apps/server/src/hub/identity/auth.ts` wraps the
  adapter `createAuth` gives the library, so each of its calls goes to `getCurrentAdapter`.
- **Why.** [Data D22](../guides/data.md). The test "renovar: o prazo novo do plugin cai" in
  `invitations.test.ts` fails when the wrapper is taken out (removal
  `library-adapter-joins-transaction`), and so does "renovar: o administrador renovando o convite
  de um dono", where the second phase refuses the escaped write.

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
  becomes one, so the operator invites an owner without a membership, which no endpoint admits.
  Step 6 declared the departure: the Central also invites an owner into an active company, since
  its card has it act on the people as an owner, so the rule "only a company with no member" is
  gone and the mail says "primeiro dono" only for a company with no member (removal
  `owner-invitation-first-owner`; "empresa ativa" in `owner-invitation.test.ts` also checks the
  subject). Members keep the native endpoints: the founder's answer A on the 4.2 code audit,
  2026-10-17 ([delivery L12](../guides/delivery.md)). "convidar: o administrador pedindo dono…" in
  `invitations.test.ts` fails when a member's invitation is written by the adapter instead (removal
  `invitation-member-native-endpoint`): the Hub no longer checks the creator role or an existing
  member itself. "renovar: o administrador renovando o convite de um dono…" fails when a member's
  renewal skips the endpoint (removal `invitation-member-native-renewal`). A member's cancel has no
  such row: the admission already requires `invitation: ["create"]`, every default role that holds
  it also holds `cancel`, and the endpoint writes the same status, so no test can tell the endpoint
  from the adapter there. The test "sem membro" in `hub/operations/clients.test.ts` fails when the
  company is created by the endpoint (removal `operator-not-member`); "recusas" guards that the
  adapter writes inside the Hub's transaction, which it joins through `runWithTransaction` and
  `joiningTransaction` alike, so no single removal row proves either. When the library
  changes, reread `getOrgAdapter`'s signature and these four methods.

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

### The protections of an app's access that the removal rows do not cover (step 18)

Better Auth 1.7.8 and the Hub's own tables, as in the two entries above. These guards keep a
person given an app inside the app; each has a test that covers it, and none has a row in
`scripts/removals.json` yet, so none is proved to fail without it ([T12](../guides/testing.md)):

- the row admits only in the `published` environment (`admitToApp`, `projects/hosts.ts`);
- `admitAppUser`'s (`identity/admission.ts`) refusal of a row holder while the company is marked for deletion (`DELETING`);
- the capability `manageAppAccess` on giving, changing, taking and canceling;
- the cancellation of the app's pending invitations when access is taken;
- the acceptance's own `LIVE` check of the Projeto and the invitation's deadline.

Two have rows: a removed member takes the person's rows of that company (`member-removal-takes-app-access`),
and a one-Projeto revoke checks the Projeto is the company's (`app-access-revoke-own-project`). The
rows for the five above wait on issue #458.

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
- **Why.** Step 5: only the operator deletes, by the client's revision and name (code C38). The
  test "apagar só pela Central" in `sign-up.test.ts` fails when the endpoint opens (removal
  `client-delete-operator-only`); "apagar: concorrência" in `client-deletion.test.ts` deadlocks
  when the operator's row is locked before the company's.

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
  whoever asks, the Central included. A removal row proves each part: the lock
  (`member-company-lock`), the owner count (`member-last-owner`), the rank (`member-actor-rank`),
  the role the caller read (`member-role-from`) and the cancellation (`removed-person-invitations`).
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
  member, admitted on the installation by `admitOperator`, and by `admitCompany` on any company, with
  or without members, under the company's lock when the action writes: it reads and changes the
  people as an owner and invites only an owner. Each answers a nominal proof, `MemberProof`,
  `CompanyOperatorProof` or `OperatorProof`, which the Hub's reads and writes require.
- **Why.** [Security S6, S7, S8, S10 and S11](../guides/security.md). An outsider, an unknown
  company and a role without the action get the same 404, with the reason only in the log. The test
  "fora: o membro" in `companies.test.ts` fails when admission reads any member of the company
  (removal `admission-reads-membership`); "fora: o operador" fails when a person who is not the
  operator may act on a company as the operator (removal `owner-inviter-is-operator`);
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
  `invitation-management.ts` admits current administrators, and the operator on any company, and recognizes explicit canceled replay before comparing revision; accepted,
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
- **Why.** Founder, step 6: 3A (202 always the same, mail after commit), P2 (every link 1 hour),
  P3 (one mail per person per minute), 4A (a recovery ends the other sessions). The tests in
  `password-recovery.test.ts` fail without each piece (removals `recovery-pace-per-person`,
  `recovery-attempt-path`, `recovery-mail-after-commit`, `revoke-sessions-on-reset`,
  `recovery-link-validity`). A mail still in flight when the Hub stops is lost; the person asks
  again.

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
  the database; the review found it reaching the service. Removals `password-check-before-link`,
  `password-check-invitation`, `password-check-deadline` and `password-check-error` take each
  protection out.

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
  `identity/mail/public.tsx`, the frame's door) as two ignored ESM artifacts, one command each, with
  React/DOM 19.2.4 pinned independently from the web. Native aliases resolve those
  versions; the build replaces the dependencies' development-mode constant. No runtime environment
  branch or template substitution is added. `invitation-render.d.mts` and `notification-render.d.mts`
  own the ports used by source and consumer. Local prestart/pretest, pree2e/preremovals and the image
  build generate the same artifacts; removal scratch copies carry these generated inputs as well as
  source.
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
  alone changes nothing; `isolation.test.ts` "positivo" fails when that policy opens (removal
  `person-member-policy`).

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
  esquecido" fails without the role switch (removal `scope-role-set`) and with the member policy
  opened (removal `rls-company-policy`); "o tipo" fails when a read stops naming its scope (removal
  `scope-in-signature`).

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
  `isolation.test.ts` fails without the check on auth.member (removal
  `operator-policy-admin-only`).

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
  it (removal `neon-exact-suffix`).
- **Why.** [Code C37, C57, C65](../guides/code.md). The time is `NEON_PREPARE_BUDGET_MS` (the `find`,
  then the `create`) plus 5 s, so a claim outlives the calls that hold it. Revalidate when
  `projects.create` gains an idempotency key.

## The Builder's clocks and its eval gate (step 13)

- **Clocks.** `setTimeout` and `setInterval` are refused in `apps/server/src/builder/` except in the
  owners `runs/{deadline,lease,copy-retry}.ts` and `conversation/parked.ts`, and `node:timers` and
  `node:timers/promises` are refused except in `conversation/turn-log.ts`, which waits 250 ms for
  short text, and `conversation/parked.ts`, Parar's wait (decision 0051; `biome.json`). Three step 11 files keep their timers out of the rule, with the reason that they
  were written before it: `model-accounts/google/{calls,google}.ts` and `claude/store.ts`. A change
  that touches their timers moves each to a named owner.
- **Eval gate.** `conversation/builder.eval.test.ts` drives the real Builder through the Hub with
  a scripted model and the test machine, then scores what Mastra saved with `checks.calledTool` and
  `checks.noToolErrors` from `@mastra/evals/checks`, and requires the only tool called to be the
  write tool. It does not use `runEvals`: the Builder's `Agent` is private to its controller, and
  `runEvals` takes no tool mocks nor `unmockedToolPolicy` at 1.79.0 (`evals/run/index.d.ts`;
  `ItemToolMock` and `unmockedToolPolicy` live on dataset items, `datasets/experiment/types.d.ts:60-62`).
  The scripted model keys on facts the setup must give it (the app folder, the skill, the tools),
  not on the instructions' sentences. A second case has a person paste a password: it proves the
  secrets rule reaches the model and that the gate fails without it, not that a real model obeys.
  Revisit when `runEvals` takes tool mocks, or the Builder's agent can be a target.

## Mastra 1.79.0: the Builder's end of the turn, open tasks (step 14.2)

- **The end of the turn is Mastra's `isTaskComplete`.** `conversation/builder.ts` gives the Builder's
  `defaultOptions.isTaskComplete` one code scorer, `conexus-check` (`conversation/processors.ts`
  `conexusCheck`), which finds the machine by the conversation in `customContext.controller`. It first
  reads the thread's task list from Mastra's `threadState` store, as `task_check` reads it
  (`tools/builtin/task-tools.ts:385-391` at `6a465f9d`); a turn that ends with tasks open, or with a
  failed app check, scores 0 and Mastra gives the scorer's reason to the model and calls it again
  (`formatCompletionFeedback`, the `task_complete_evaluation` event reaches the screen). Mastra's loop
  has no cap of its own for this, so the rounds count in `CHECK_LIMITS.checks`, kept by the run
  (`Runs.round`); at the limit the scorer passes and the version is saved `unfinished` or `failed`.
  Mastra's own `goal` judges completion with a model, not the list (`agent/goal/scorer.ts:14-28`), so
  it does not serve. Proof: `conversation-check.test.ts`, criterion 15 of step 14.2.

## Mastra 1.79.0: a tool call the model streamed unparseable (defect after v0.20.8)

- **Library line.** Mastra's in-process loop persists a tool call whose JSON it cannot parse with
  `args: undefined` (`@mastra/core/dist/stream-Cf2uTBjB.js:813-848`, after `tryRepairJson`, which
  does not repair truncation), and replays it with `input: invocation.args`
  (`message-list-Bfir0O2V.js:9061-9068`). `@ai-sdk/anthropic` 3.0.133 writes `input: part.input`
  (`dist/index.mjs:3062-3069`), `JSON.stringify` drops the undefined field, and Anthropic answers 400
  `tool_use.input: Field required` to every later request of the conversation. The AI SDK's own loop
  sends such a call as `{}` (`ai/dist/index.mjs:4392`); Mastra has no such rule in
  `DEFAULT_COMPAT_RULES` (`trip-wire-C6DhMdZ8.js`), only the extension point
  `new ProviderHistoryCompat({ additionalRules })`. Mastra's in-process engine also scores an
  errored iteration through `isTaskComplete` (the durable engine skips it, Mastra issue #21897).
- **Hand-made piece.** `toolCallInputRequired` in `model-accounts/tool-call-input.ts` (wired in
  `model-accounts/processors.ts`), a `ProviderHistoryCompat` rule: its `applyToPrompt` sends a
  `tool-call` with no `input` as `{}` in the outbound prompt only; stored messages are not touched, so a conversation already broken
  recovers on its next message. And `judge` in `conversation/processors.ts` returns finished once
  the queue has ended the turn (`turnIn(requestContext)?.outcome`), so a failed turn is not called
  again and no false `MODEL_NO_ACCOUNT` is stored. Visible change: the version of a failed turn
  with open tasks has no check verdict, like a turn that stopped on a question; before, it read
  "unfinished" only because of those false calls.
- **Why.** One bad tool call must never leave a conversation broken. Proof: in
  `conversation-tool-input.test.ts`, "guardou sem argumentos" (an `ask_user` call streamed truncated,
  then two more turns, against a double that answers the 400 and records each replayed `tool_use`
  input) fails without the rule, and "não volta ao modelo" (a call that fails with tasks open,
  through the public door) fails without the check. Not done: `toolStreaming: false` (changes card
  streaming for every call and leaves other providers exposed).

## Mastra 1.79.0 and @mastra/fastify 1.5.23: session routes behind the Hub's guard (step 14.2)

- **A fixed list, one guard.** `conversation/guard.ts` registers six of Mastra's own
  agent-controller routes (a session's state, stream, message, Parar, a card's answer, transcript;
  `FIXED_LIST`)
  through `@mastra/fastify`'s `registerRoute`, each declared `access: 'session'`; every other route
  of `SERVER_ROUTES` is not registered, so it is a 404 (decision 0050, S39). Mastra's `server.auth`
  stays off: the guard reads the Hub's session, finds the thread's owner in its `resourceId` and the
  Hub's index (S10), refuses a browser `requestContext` with 400, and sets the message's author.
  Proof: `conversation-routes.test.ts`, criteria 3, 30 and 31 of step 14.2.
- **The Hub's close closes the open streams.** Mastra's stream route ends only when its request
  leaves (`handlers/agent-controller.ts:581-647` at 1.79.0), so the guard keeps each open stream's
  response and the close destroys them once the runs have said their end, which `@mastra/fastify`
  reads as the request leaving; a session Mastra deletes
  with its Projeto ends its run without an `agent_end`, so `end.ts` lets it go on
  `onSessionDeleted`. Proof: `conversation-stream.test.ts`. Revisit when Mastra's server ends its
  streams on shutdown.

## Mastra 1.79.0: the stream sends the screen what it reads (memory, pace)

- **Library line.** `@mastra/core` 1.79.0 `agent-controller/session.ts` sends the session's whole
  display state after every event (the turn's message and every tool's input and result), which grows
  with the square of a turn's length. The stream route has no option to send a subset.
- **Hand-made piece.** `slim` and `paced` in `apps/server/src/builder/conversation/stream.ts`. `slim`
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
- **Revisit when** Mastra lets a stream send a subset of the display state.

## Mastra 1.79.0: a step's answer without the body of its request

- **Library line.** `@mastra/core` 1.79.0 keeps every step's output, `request.body` included, until
  the session's next run (`MastraModelOutput` `#bufferedSteps[].request`), so a conversation's last
  turn holds every prompt it sent. Nothing of ours or Mastra's reads the body back. The AI SDK's
  own `experimental_include.requestBody: false` (`ai@6.0.309` `generateText` and `streamText`) is
  not reachable here: Mastra's loop reads the provider's `stream.request` itself and takes no
  such option.
- **Hand-made piece.** `bodylessMiddleware` in
  `apps/server/src/builder/model-accounts/claude/models.ts`, a `wrapStream` that drops `request`
  from `doStream()`'s answer.
- **Why.** The Hub's heap grew with the prompts of the last turn of every open conversation.
- **Proof.** `prompt-cache.test.ts` "cada passo do modelo da conta volta sem o corpo do pedido…".
- **Revisit when** Mastra passes an include option to its loop, or stops keeping the request.

## Mastra 1.79.0: Parar waits until Mastra keeps an open card's run

- **Library line.** `@mastra/core` 1.79.0, default engine. The controller ends a run at its
  `tool-call-suspended` chunk (`agent-controller-DO6rGsQm.js:1660-1680`) before the agent's output
  processors save the call and, last, the run's `agentic-loop` snapshot. Parar is Mastra's
  `abortRun` (`:5005-5060`): it denies the open call through `settleSuspendedToolCallsAsDenied`
  (`:1434-1490`), which denies the call in the message it holds and saves it. The agent's output
  processors save their own copy of the call afterwards (`:4220-4222` keeps the held message after
  a suspended end), so memory reads `call` again and the card reads open after Parar.
- **Hand-made piece.** `untilCardsKept` in `apps/server/src/builder/conversation/parked.ts`, called
  by the guard on `POST …/abort` (`guard.ts`). When the session's display state holds an open card,
  it reads `Agent.listSuspendedRuns` (the native storage view of parked runs, which Mastra's own
  answer route reads, `:5859-5893`) until every open card is listed, every 20 ms for at most 2 s,
  then lets Mastra's handler run. Past the bound, Parar goes to Mastra as before.
- **Why.** The screen shows Parar while a card waits (`apps/web/src/builder/conversation/panel.tsx`),
  and the CI flake of step 14.1 was this window (about 5 runs in 301, `main` included). The bound is
  measured: the window from the card on the stream to its run listed was 14 to 30 ms idle and 59 ms
  at most under three CPU hogs (10 runs each); 2 s is about 30 times that, for a remote database
  (code C57). Founder, 2026-10-25: "A1".
- **Proof.** `conversation-waiting.test.ts` "Parar no instante em que o cartão chega, antes de o
  Mastra guardar a chamada": Mastra's save of the open call slowed by 300 ms, Parar as the card
  arrives. Without the wait it reads `call`, 3 runs of 3; with it, `output-denied`, 3 of 3. The
  two Parar tests that flaked in CI failed 2 of 2 with the same slowed save before, and passed 6 of 6
  after. Past the bound, with the save slowed by 5 s, "Parar com o Mastra guardando a chamada
  além do prazo" proves Parar answers within the bound and the turn ends aborted;
  the card's state there is Mastra's old window.
- **Revisit when** Mastra saves the suspension before publishing its chunk on the default engine, as
  1.80.0-alpha.3 does for the durable and evented engines (PR #27352), or Conexus runs the Builder
  on such an engine. Then `parked.ts` and its call leave.

## e2b 2.56.0: the version folder read without following a link (step 14.1)

- **Library line.** `e2b@2.56.0` `files.read(path)` (`index.d.ts:5135-5148`) reads by path and
  follows a link: `FilesystemReadOpts` has no `nofollow`. `files.list` (`index.d.ts:5037-5065`)
  shows a link's `symlinkTarget`, but a link swapped in between the list and the read still passes.
  Mastra 1.79.0 `WorkspaceFilesystem.readFile` has the same shape.
- **Hand-made piece.** `packIn` in `apps/server/src/builder/machine/pack.ts` runs one Node program
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
- **Proof.** Removals `connector-request-origin`, `connector-redirect-refused`,
  `connector-origin-only-local` and `sankhya-read-only-words` (the read door's statement words).
  Tests without a row: `kernel.test.ts` "a classe é obrigatória" and "a porta de leitura só aceita
  operações read", which fail at compile time or at definition rather than by a line a scratch copy
  could remove.
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
- **Proof.** Removals `connector-redirect-refused` and `connector-response-cap`, both through
  `executor.test.ts` "a origem, o redirecionamento e o teto". Tests without a row, each on the
  public door: "o corpo de erro perde os valores da credencial antes de ser lido", "o token sai de
  todo corpo de uma operação, no envelope do gateway e no erro REST", "um erro de programação dentro
  do envio sobe como falha, não vira UNREACHABLE" and "um corpo de erro que não é JSON chega como
  texto e o status decide".
- **Revisit when** Node's `fetch` takes a body cap, or a connector library runs the call in Brazil
  with the credential outside the caller.

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
- **Proof.** Card criterion 21: a read whose route is not in the page fails. No removal row: the test
  needs the live site.
- **Revisit when** Mercado Livre publishes an OpenAPI document, or a read fails on a real account
  (then its answer, without company data, becomes the double's data).

## Mastra 1.79.0: a conversation's changing state lives in a Hub table (step 24.1)

- **Library line.** At `@mastra/pg` version 1.32.0 and `@mastra/memory` version 1.39.0 (the lockfile's),
  `@mastra/pg` `updateThread` (`dist/index.js:12438-12472`) reads the thread,
  merges the new metadata over what it read and writes the whole object, with no lock. Observational
  memory writes the thread title through `patchThread` with the full metadata it read earlier
  (`@mastra/memory` `dist/src-DxZ7N8nO.js:35742-35762`). Either write can put back a value that
  another request changed in between. Reported to Mastra (feedback, 2026-11-01).
- **Hand-made piece.** The Assistant's chosen connections and its place live in
  `builder.assistant_conversation`, which only the Hub writes (`apps/server/src/builder/assistant/chosen.ts`,
  `context.ts`; founder's D11 word, 2026-11-01: "Aprovo as permissoes do b1"). The thread's metadata
  keeps only marks set once at `createSession({ tags })`.
- **Why.** The step's B1: a change of connections made while Mastra saved the title came back on
  the next turn. The Builder's own metadata has the same exposure; per-conversation state that
  changes after creation goes in a Hub table, never in the thread's metadata.
- **Proof.** `instructions.test.ts` "trocar a escolha enquanto o Mastra grava o título": the next
  turn reads only the new choice, and the title stays.
