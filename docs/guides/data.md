# Data guide

How Conexus stores data and changes its schema. This guide follows
[Evolutionary Database Design](https://martinfowler.com/articles/evodb.html) by Pramod Sadalage and
Martin Fowler, with the PostgreSQL documentation for roles and constraints. Each rule uses
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** state a requirement;
**should** and **should not** need a stated reason to break; **may** is a free choice. Each rule ends
with its enforcing machine, or "review". Guidance does not reopen an approved contract or decision;
[delivery L12](delivery.md) decides whether a finding blocks. Maintainers' skills own Drizzle and
PostgreSQL usage; Neon's own sign-in, functions and storage are not used.

Owners next door: [architecture](../architecture.md) for stores and company isolation,
[security](security.md) for authority, [code](code.md) for errors and [testing](testing.md) for proof.
Database roles and grants live beside the migrations, not in a second list here.

## 1. Stores

- **D1.** The Hub's database **must** hold the Hub's tables and, in a schema of its own, the
  Builder's runs and model accounts [0011]. Mastra's tables **must** live in a separate database
  under a login that cannot enter the Hub's [0010]. Conexus code **must not** write Mastra's tables.
  [database grants]
- **D4.** Each owner **should** have its own schema, not `public`. Failure: unrelated migrations
  create the same name and unintentionally widen privileges. [review]

## 2. Schema and migrations

- **D5.** Drizzle **should** own schema and generated migrations at the version fixed in [0005],
  with justified custom SQL for what it cannot generate and reproducible reference data. Examine
  impact, not just syntax. Failure: a manual database edit never reaches the next environment,
  or a generated rename drops data. [review]
- **D6.** A migration **must** only add, so the previous image runs on the migrated database. A
  rename or a drop **must** be a later migration, after no running code reads the old shape: expand,
  move the callers, contract. [CI migration check]
- **D7.** An applied migration **must not** change. [CI migration check]
- **D9.** Migrations **must** run by the program's `migrate` subcommand, which the deploy runs as a
  one-off service before it starts the Hub, on the direct address, never a pooled one. The program
  **must** refuse to start when the database lacks a migration it ships with. [boot check]
- **D10.** Roles and grants **must** be created by SQL, never from Neon's console or API [0038]. The
  Hub's login **must not** own a table, be a superuser or have `BYPASSRLS`. [catalog snapshot]
- **D11.** The role and grant list **must** change only in a pull request of its own, with the
  founder's word. After migration, CI compares a `pg_dump` and `pg_dumpall` snapshot of the catalog
  with that list [0038]. The equality holds on CI's disposable cluster only: Neon adds roles and
  grants of its own. [catalog snapshot, `catalog.test.ts`]
- **D12.** Grants **must** keep each login's verbs and columns narrow, and **must not** be treated as
  row authorization: admission owns that ([security S7](security.md)). [catalog check, review]
- **D13.** Removing a function **should** check its exact signature, callers and the replacement's
  invariants without implicit cascade. Failure: `CASCADE` removes protection another path still
  needs. The migration checker is a heuristic, not a complete SQL parser. [review]
- **D32.** `migrate` **must** set a login's password only when that login, with its key file's
  password, is refused with 28P01. Each `ALTER ROLE ... PASSWORD` stores a new SCRAM salt even for the
  same password; on Neon a restart that rewrote it answered one request with 500, read as a new login
  refused while Neon's proxy still held the old verifier. [`migrate.test.ts`, the verifier unchanged]
- **D33.** An index on an ICU collation (the Projects' unique name, `und-x-icu`) **must** be rebuilt
  with `REINDEX` when the provider's ICU major version changes. PostgreSQL only warns of the
  mismatch, and a stale index lets a duplicate in or hides a row. Failure: "Ação" and "AÇÃO" both insert after an upgrade. [review]

A database is reproducible when every change is a versioned file applied the same way everywhere.
Neon's owner login joins `neon_superuser`; the Hub's runtime login does not [0038].

## 3. Where a rule lives

- **D15.** Always-true integrity **should** use PostgreSQL constraints: nullability, keys, checks,
  partial unique indexes, restricted deletion and exact numeric money. Failure: concurrent requests
  both pass a uniqueness `if` and insert duplicates. [review]
- **D16.** Business rules **should** be explicit TypeScript over the decided rows, with integrity
  left to the database rather than duplicated. Failure: a trigger and a screen compute different
  permissions. [code C26](code.md) owns the single source. [review]
- **D17.** Cross-owner foreign keys **should** protect real identity or containment, not convenience.
  Failure: a convenient FK prevents removal of data its owner already considers removed. [review]
- **D18.** Each new column and contract field **should** have a known writer and consumer. Failure:
  `expiresAt` reaches the client but no screen distinguishes expired from pending. knip cannot
  detect an unread database field. [review]

## 4. Access code

- **D19.** A store **must** reach the database only through the database module of `platform/`, and
  only that module **may** import the driver. [dependency-cruiser]
- **D20.** Values **should** be bound parameters, with raw SQL reserved for controlled structure,
  never external values. Failure: concatenating a submitted filter changes the query. Banning
  every `sql.raw()` would also reject legitimate static SQL. [review]
- **D22.** Effects decided together **should** share one transaction, with visible write scope,
  isolation and locks chosen for the decision, and external effects separated from bounded lock
  holding. Failure: setting a password fails after its one-use link was consumed, or a vendor call
  holds a row lock indefinitely. PostgreSQL's [isolation semantics](https://www.postgresql.org/docs/18/transaction-iso.html)
  explain the choice: repeatable read shares a snapshot but can require retry after concurrent
  updates; read committed with row locks lets the next command decide on the committed row.
  Neither an isolation name nor a ban on `merge` proves atomicity. [review]
- **D25.** There **must not** be a session-level lock, or a session setting outside a transaction. A
  single owner **must** be a lease row with an expiry, renewed by activity. [CI search, from the first
  step with a database]
- **D27.** Nothing **may** keep a connection or send a statement while nobody uses Conexus; an idle
  database **must** be able to sleep [0009]. [sleeping-database test]

## 5. Generated apps

- **D28.** A generated app **must** reach its data only through `db.query(text, values)`, one
  statement in one transaction, and `db.batch` for statements that must succeed or fail together
  [0020]. The rule against two separate writes for one action **must** live in the Builder's server
  skill, and the verifier **must** refuse it before Preview. [verifier]
- **D29.** An app's migrations **must** live in its own Git. The Hub **must** apply them with that
  app's migration login, and the verifier **must** read them as SQL before Preview. [verifier]

## 6. Change with real data

- **D30.** Without company data, a shape transition **should** finish in one step: add, move every
  caller, then drop in a later migration of that step. With real data, follow D6 across steps.
  Failure: keeping two unused shapes forces every future step to synchronize them. [review]
