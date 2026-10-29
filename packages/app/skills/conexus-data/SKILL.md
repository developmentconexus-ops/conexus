---
name: conexus-data
description: How an app saves data and runs logic on the server. Covers the operations in `shared/operations.ts` written in Zod, their handlers in `server/handlers.ts` with `query` and `write`, tables and migrations, who is calling, the values PostgreSQL gives back, failures and the limits of a call. Use before designing an app's tables or changing `shared/operations.ts` or anything in `server/`.
---

# Server logic and saved data

An app that saves or reads data has a server; a page with nothing saved has none (`conexus-app`). The platform contract owns two files, and the check builds the app's server from them:

- `shared/operations.ts` exports `operations`, made with `defineOperations` from `@conexus/app`: each operation's name, its `input` and its `output`, in Zod, and, in an app with roles, who calls it. It also exports `roles` then (see Roles). The screens and the server import the same file, so a field renamed there fails the check everywhere it is used.
- `server/handlers.ts` exports `handlers`, made with `defineHandlers(operations, { ... })`, one handler per operation, and `migrations`, the tables.

`references/operations.ts` and `references/handlers.ts` are a complete pair that passes the check; the screens of `conexus-app` call them. Each one's first line names where it goes.

Every piece this skill names comes from `@conexus/app`. When one is missing from the installed `@conexus/app`, such as an export that does not exist or a field `caller` lacks, stop and tell the person which piece is missing and that the rule it carries cannot hold yet. Never imitate the piece on the screen or in a handler, and never say the rule holds.

## Operations

- The browser calls an operation by name with a JSON body. The app's server checks the input with the operation's own Zod before the handler runs, and the output with it after, so a handler only sees what its input declares: `z.email()`, `z.uuid()`, a default, a union of objects and a refinement all hold.
- Input is always an object. An operation's name is letters and digits, starting with a letter.
- Use the Zod the app needs, but what is sent and answered travels as JSON: a `Date`, a `BigInt`, a `Map` or a `Set` does not, and the check fails with `OPERATION_NOT_JSON`, the operation and the path. A date is `z.iso.date()` text, or `isoDate` from `src/lib/date-codec.ts` (a `z.codec` over `z.iso.date()` and `z.date()`) when the handler or the screen needs a `Date`. A transform in an output must be a codec, since the server encodes the output back with it.
- For a field with fixed values, such as a status, export the list from `shared/operations.ts` and use `z.enum(LIST)`, so the handlers, the types and the screens' words all follow one list.
- Export from `shared/operations.ts` the types the screens need, with `z.output` and `z.input`.

## Handlers

- A handler is `(input, { db, caller }) => output`, typed by its operation: an object built with a field the output does not declare, or without one it requires, fails the check instead of failing in front of the person.
- `caller` is the person using the app, set by Conexus from their sign-in: `personId`, `personName`, `projectId`, `projectName` and `access`, how they hold the app (see Roles). The browser cannot change it. To record who did something, read `caller`; never add a name or author field to the input.
- Read with `query(db, RowSchema, text, values)`: it returns the rows, each checked against `RowSchema`. `db.query` runs in a read-only transaction.
- Write with `write(db, [{ text, values }, ...])`: every statement of the list runs in one transaction, all or none. Put a change and the row that records it in the same `write`.
- Always pass values as parameters (`$1`, `$2`), never inside the text. Tables live in this app's own schema: do not prefix them with a schema name.
- Postgres `integer` arrives as a number; `bigint`, `count(*)` and `numeric` arrive as text, so cast a count with `::int` in SQL and keep decimals as text, which the screens format with `lib/format.ts`; sums belong in SQL. Read a `timestamptz` with `z.coerce.date()` and return it as ISO text, as the example's `When` does. Alias columns to the names the output declares, for example `opened_at AS "openedAt"`.
- `server/` runs in a Worker: no file system, no environment variables and no network, since the platform refuses every request the app sends out. It reaches only `db`.
- One call may use 50 ms of CPU and 50 `db` calls, 10 s in all, and 5 s per statement.

## Roles

An app has roles only when the plan names them, because the person said different people may do different things. Without roles, everyone with access to the app may call every operation, and nothing here applies.
- `shared/operations.ts` exports `roles`, made with `defineRoles` from `@conexus/app`: each role's name (lowercase letters, digits and `_`, starting with a letter) and the label the person reads in Quem usa o app, in Portuguese. The example has two.
- In an app with roles, every operation names `roles`: a list of the declared roles that may call it, or `'everyone'` for every person with access. An operation with no `roles`, or naming a role the app does not declare, stops the check, and the message names the operation.
- The server refuses a caller whose role is not listed with `ROLE_FORBIDDEN`, before the input is read and before the handler runs. Never test the role inside a handler to refuse; list it on the operation.
- `caller.access` is `{ kind: 'BUILDER' }` for the people who build the app, who hold every role, or `{ kind: 'USER', role }` for a person given the app with one role, or `null`. `can(caller.access, 'manager')` from `@conexus/app` tells whether the role holds. A role the app stops declaring is no role: its person reaches only the `'everyone'` operations.
- A rule that shows different rows to different roles, such as a seller seeing only their own, is a filter in the handler on `caller.personId` and `can`. The example's `listTickets` does it. The role on the operation locks the call; the filter narrows the rows.

## Failures

An expected failure is part of the output, and the screen shows it. Nothing found is data: an empty list or a field left out, as `getTicket` does. A refused statement throws `DatabaseRefused`, with the PostgreSQL code alone; a handler that throws answers `HANDLER_FAILED`, and a caller whose role the operation does not list gets `ROLE_FORBIDDEN`; the screen shows the platform's sentence for each (`failureOf` in `conexus-app`). Never return an error message of your own to the screen.

## Migrations

`migrations` is a list of `{ id, statements }`, applied in order, each once, when a version is sent. An `id` is lowercase letters, digits, `_` and `-`, such as `001_ticket`; each statement is one SQL statement. Never edit a migration a sent version carried; add the next one.

- A record that moves through statuses keeps its history in a table of its own: one row per change, with who made it and when.
- Saved data only moves forward. A migration may add tables, columns, indexes and constraints, and copy into what it added. It never drops, renames or retypes a saved column or table, never deletes or overwrites saved rows (filling only empty ones, `WHERE column IS NULL`, is fine), and never makes the previous version send a field it does not know. Conexus applies every pending migration in one transaction and keeps it only if every saved value is still there and the previous version still reads and writes; otherwise the version does not enter.
- To rename, add the new column and copy. To remove a field, take it off the screens; what was saved stays. A saved row is fixed on the app's screen, never by a migration. A fixed list lives in Zod (`z.enum`), never in a `CHECK`; to change an existing `CHECK` list, drop the `CHECK` and keep the list in Zod. Nothing is truly deleted in this version: say so to the person.
- No functions with `SECURITY DEFINER` or `EXECUTE`, no function body that changes rows other than inserting or setting `NEW`, no views, `DO` blocks, extensions, roles, grants or other schemas, no row level security, policies or rules, and no transaction control (`BEGIN`, `COMMIT`, `SET`): they act after the transaction, where Conexus cannot check them, and the version is refused. Write literals with standard-conforming strings.
- The same list refuses `CREATE TYPE ... AS ENUM` (use a `text` column and the list in Zod), `CREATE SEQUENCE` (use a `serial` or identity column), `RAISE EXCEPTION` in a trigger (check in the handler and return the failure as output) and one item holding two statements (one item for each).
- A trigger function always ends in `RETURN NEW`, in a `BEFORE` and in an `AFTER` trigger; `RETURN NULL` is refused.

## The browser side

The check writes the screens' client into `src/conexus/api.gen.ts` from `shared/operations.ts` on every run. How a screen calls an operation is in `conexus-app`.
