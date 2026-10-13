# Data guide

How Conexus stores data and changes its schema. This guide follows
[Evolutionary Database Design](https://martinfowler.com/articles/evodb.html) by Pramod Sadalage and
Martin Fowler, with the PostgreSQL documentation for roles and constraints. Each rule uses the words
of [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** are defects in
review; **should** and **should not** need a stated reason to break; **may** is a free choice. Each
rule ends with the machine that refuses a violation, or "review". How to use Drizzle or PostgreSQL
is the maintainers' skills; Neon's own sign-in, functions and storage, which its skills offer, are
not used.

Owners next door: [architecture](../architecture.md) for which store holds what, [security](security.md)
for who may act, [code](code.md) for the error model, and [testing](testing.md) for test databases.
The list of database roles and their grants is a data file beside the migrations, not this guide.

## 1. Stores

- **D1.** The Hub's database **must** hold the Hub's tables and, in a schema of its own, the
  Builder's runs and model accounts [0011]. Mastra's tables **must** live in a separate database
  under a login that cannot enter the Hub's [0010]. Conexus code **must not** write Mastra's tables.
  [database grants]
- **D2.** Every Hub table **must** have the company column, and every transaction **must** carry the
  company. The row policy is decided in step 5 [0012]. [review]
- **D3.** A company's app data **must** live in that company's Neon project: one schema and two
  logins per app and environment, one that runs the app and one that migrates it. Preview and
  Published **must** be two schemas, never two branches [0021]. A company project **must not** hold
  a Hub login, and the Hub's database **must not** hold an app login. [review]
- **D4.** Each owner **must** have its own schema, never `public`. [review]

**Why.** Separate stores fail separately, and a grant given by mistake cannot open a wall that is a
separate database. A schema per owner makes ownership visible and keeps grants narrow.

**Right.** A Project's handler reads its own schema in its company's project.

**Wrong.** A Hub store joins a Mastra table to read a conversation's messages.

## 2. Schema and migrations

- **D5.** Drizzle **must** own the schema and generate the migrations, at the version fixed in
  [0005]. What Drizzle cannot generate (a function, a trigger, an extension, a grant) **must** go in
  a custom migration whose comment says why. Nothing **may** be created by hand in a database.
  [review]
- **D6.** A migration **must** only add, so the previous image runs on the migrated database. A
  rename or a drop **must** be a later migration, after no running code reads the old shape: expand,
  move the callers, contract. [CI migration check]
- **D7.** An applied migration **must not** change. [CI migration check]
- **D8.** Someone **must** read the generated SQL before it is applied. [review]
- **D9.** Migrations **must** run by a subcommand before the program starts, on the direct address,
  never a pooled one. The program **must** refuse to start when the database lacks a migration it
  ships with. [boot check]
- **D10.** Roles and grants **must** be created by SQL, never from Neon's console or API. The Hub's
  login **must not** own a table, be a superuser or have `BYPASSRLS`. [catalog check]
- **D11.** The role and grant list **must** change only in a pull request of its own, with the
  founder's word. CI compares the catalog after migration with that list. [catalog check, from the
  first migration]
- **D12.** Grants **must** keep each login's verbs and columns narrow, and **must not** be treated as
  row authorization: admission owns that ([security S7](security.md)). [catalog check, review]
- **D13.** A dropped function **must** name its exact signature and **must not** use `CASCADE`; a
  function a later migration recreates **must** keep every invariant the earlier body enforced, and
  a dropped one **must** leave no caller.
  [review]
- **D14.** Reference data **must** enter by migration or by a generated file, never by a manual
  insert. [review]

**Why.** A database is reproducible only when every change is a file in the repository, applied the
same way everywhere. A rename can come out of a generator as a drop and a create. A login made in
Neon's console joins a group that ignores row policies.

**Right.** A new column in one migration; the code that stops reading the old one ships; a later
migration drops it.

**Wrong.** An edit to a migration that already ran, or a column renamed in place while the previous
image still reads it.

## 3. Where a rule lives

- **D15.** Every always-true rule **must** be a constraint: `NOT NULL`, keys, `CHECK`, partial unique
  indexes, `ON DELETE RESTRICT`, `NUMERIC` for money. [review]
- **D16.** A business rule **must** be a pure TypeScript function over the rows the command read and
  locked. SQL **must not** hold a business rule, and TypeScript **must not** repeat one PostgreSQL
  enforces. [review]
- **D17.** A foreign key across owners **must** only protect identity or containment; any other
  reference across owners is an id without a key. [review]
- **D18.** Each new column **must** have a writer and a reader. [review]

**Why.** A rule in TypeScript is read, tested and changed with the rest of the code. Integrity in
PostgreSQL holds even when the code is wrong, from any program that writes.

**Right.** "The last owner stays" is a function over the locked roster, and a unique index keeps one
open invitation per company and e-mail.

**Wrong.** A `SECURITY DEFINER` function that decides who may invite, or a column written and never
read.

## 4. Access code

- **D19.** A store **must** reach the database only through the database module of `platform/`, and
  only that module **may** import the driver. [dependency-cruiser]
- **D20.** Values **must** always be bound parameters; an outside value **must not** enter
  `sql.raw()`. [review]
- **D21.** Every row read from the database **must** be parsed against its schema, with the
  contract's narrowed types, before it is used, and a row out of shape **must** be refused at the
  read. Founder, 2026-10-13: "3. A". [review]
- **D22.** A unit of work in the Hub **must** be one transaction. A write **must** keep its filter
  visible: `update` and `delete` have a top-level `where`, an upsert's update has its own `where`,
  and `merge` is not used. [review]
- **D23.** A read transaction **should** be `REPEATABLE READ READ ONLY`; a command **should** run in
  `READ COMMITTED` and lock the rows it decides on. Basis: implemented so; kept because it gives a
  read one snapshot and a command one decision point. [review]
- **D24.** A database error **must** be mapped as [code C52](code.md) says, by SQLSTATE and also by
  constraint name. [review]
- **D25.** There **must not** be a session-level lock, or a session setting outside a transaction. A
  single owner **must** be a lease row with an expiry, renewed by activity. [CI search, from the first
  step with a database]
- **D26.** Code **must not** call outside while holding a row lock. [review]
- **D27.** Nothing **may** keep a connection or send a statement while nobody uses Conexus; an idle
  database **must** be able to sleep [0009]. [sleeping-database test]

**Why.** One access path means one place sets the timeouts and the company, and one place a reviewer
reads. A session lock fails behind a pooler and keeps a connection, and with it the database, awake.

**Right.**

```ts
const rows = await tx.update(projects).set({ name })
  .where(and(eq(projects.companyId, companyId), eq(projects.id, projectId)))
  .returning()
return rows.map((row) => ProjectRow.parse(row))
```

**Wrong.** A string built with `+` and sent through a raw client, or `pg_advisory_lock` held for the
life of the process.

## 5. Generated apps

- **D28.** A generated app **must** reach its data only through `db.query(text, values)`, one
  statement in one transaction, and `db.batch` for statements that must succeed or fail together
  [0020]. The rule against two separate writes for one action **must** live in the Builder's server
  skill, and the verifier **must** refuse it before Preview. [verifier]
- **D29.** An app's migrations **must** live in its own Git. The Hub **must** apply them with that
  app's migration login, and the verifier **must** read them as SQL before Preview. [verifier]

**Why.** With one statement per transaction, nothing stays open while an app works, and the
all-or-nothing that an action needs is one batch the verifier can see.

**Right.** `db.batch([insertOrder, decrementStock])`.

**Wrong.** Two `db.query` writes for one action, the second run only if the first touched a row.

## 6. Change with real data

- **D30.** While no installation holds company data, a rename or split **must** be finished in one
  step: the new shape is added, every caller moves, and a later migration of the same step drops the
  old one. After that, the drop waits for a later step. [review]
- **D31.** Once real data exists, a migration **should** be rehearsed on a Neon branch first.
  [review]

**Why.** A transition phase keeps two shapes alive, and it is worth its cost only when real data
must survive the change.

**Right.** A rename adds the new column, moves the row schema and every store, and drops the old
column in a second migration, all in one step.

**Wrong.** A new column beside the old one "for compatibility" before any company exists.
