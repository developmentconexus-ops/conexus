# The app contract and the dispatcher

A generated app is a Cloudflare Worker with no binding, no secret and no network. Everything it
can do arrives through three objects the dispatcher hands it on each call. This page explains
that contract (`packages/app-contract`), how the dispatcher (`apps/edge`) turns a browser
request into a call of the right version, and how the app reaches its database and the company's
connectors. How a version gets built is in [the app package](app-package.md); how it gets stored
and published is in [the Hub side of an app](hub-apps.md).

## What the app receives

The handler contract is `handler(input, { db, caller, connectors })`, typed as `AppProps`
(`packages/app-contract/src/props.ts`):

- `caller` is who is calling: `personId`, `personName`, `projectId`, `projectName` and
  `access`. It never carries an e-mail or a company. `access` is `BUILDER` for a member of the
  company, who holds every role, or `USER` with one role (or none) for a person the app was given
  to.
- `db` has two methods. `query(text, values)` runs one statement in a read-only transaction, so
  PostgreSQL refuses a write. `batch(statements)` runs all of a call's writes in one transaction,
  all or none. An error comes back as the SQLSTATE alone, never the statement or its values
  (`packages/app-contract/src/db.ts`).
- `connectors` has `call(connector, operation, input, connection?)` and `connections(connector)`
  and answers with data such as `OK`, `NOT_GRANTED`, `BUSY` or `DEADLINE`, never the provider's
  raw reply (`packages/app-contract/src/connectors.ts`).

The app before its first version, the example app, gets only `caller`.

## Operations, handlers and roles

An app declares its operations as Zod schemas in `shared/operations.ts` and their handlers in
`server/handlers.ts`. `serveApp` is the Worker's `fetch` (`packages/app-contract/src/runtime.ts`).
It answers `GET /api/caller` and `POST /api/<operation>`, and gives 404 `OPERATION_NOT_FOUND` for
anything else. For each call it checks, in order:

1. the caller's role, refusing with 403 `ROLE_FORBIDDEN` before it reads the body;
2. the input against the operation's schema (400 `INPUT_INVALID`);
3. the handler, where a throw becomes 500 `HANDLER_FAILED` and the log keeps only the
   operation and the error's name;
4. the output, encoded through the schema (500 `OUTPUT_INVALID`).

Roles are a plain map of name to label (`defineRoles`). In an app that declares roles, every
operation must name the roles that may run it, or `'everyone'`; `serveApp` refuses to start
otherwise. A role the current version no longer declares reads as no role, so it runs nothing.
On the screen side, `can(access, role)` mirrors that rule only to hide a button; the server's
`ROLE_FORBIDDEN` is the guarantee (`packages/app/src/client.ts`).

The screens call operations through `createApi(operations)`, which posts JSON and checks the
answer against the same schema. "Generated" means typed from the same `operations` value: the
check writes `src/conexus/api.gen.ts` as one line, `export const api = createApi(operations)`.
When the dispatcher redirects because the session ended, the client reloads the page so the
person passes through the Hub again.

The manifest (`packages/app-contract/src/manifest.ts`) is what a version declares to the
platform: its entry file, its assets, its migrations, its roles and the connector reads it calls.
The Hub reads it at publish and on every connector call. The operations themselves are not in
it: each call is checked by the app's own Zod.

## One request, from the browser to the version

Every host under the apps' domain reaches the dispatcher Worker (`apps/edge/wrangler.jsonc`). A
host is one app's label (`packages/hub-api/src/address.ts`). The dispatcher holds no table of apps
or versions; it asks the Hub on every call (`apps/edge/src/dispatch.ts`):

1. It parses the host into a label and refuses a write whose `Origin` is not the app's own.
2. It reads the app session cookie `__Host-conexus-app`. Without one, it starts the handoff
   described below.
3. With one, it asks the Hub `GET /api/app-sessions/current` over Workers VPC. `hubOf` is the
   only code that touches that binding (`apps/edge/src/hub.ts`). On the server, a second
   Fastify listener serves the routes marked `access: 'edge'` and nothing else
   (`apps/server/src/platform/edge-server.ts`).
4. The Hub checks everything again, now (`admitCall` in `apps/server/src/hub/apps/handoff.ts`).
   The session's hash and host must match a row. The Hub session it hangs from must still be
   live, which is why an app session has no sign-out of its own. The host must still name the
   same Project. And the person must still be admitted: a member as `BUILDER`, or a person with an
   access row, in the published app only, as `USER` with that row's role
   (`apps/server/src/hub/projects/hosts.ts`).
5. The session records its environment, `preview` or `published`. The Hub answers with the
   version for that environment (the Prévia's version or the published one), the run login's
   address, and the `caller` it built (`callTo` in `handoff.ts`).
6. The dispatcher loads the version's Worker `v-<versionId>` from the Workers for Platforms
   namespace and passes `caller`, a `db` and a `connectors`. Both are `WorkerEntrypoint` stubs of
   the dispatcher itself, so the database key and the session token stay in the dispatcher.
7. It strips its own cookies from the request and forces the content security policy,
   `nosniff` and `no-referrer` on the answer (`apps/edge/src/headers.ts`). A throw, a CPU cut or
   a missing Worker gives a 502 page.

Static files never reach the Worker's code. They are uploaded with the version as Workers static
assets with `run_worker_first: false` and single-page-application fallback
(`apps/server/src/platform/cloudflare.ts`), so the platform answers them first.

### The one-use handoff

An app lives on another domain, so the Hub's cookie never reaches it. In a tab, the dispatcher
sets a random binding cookie and redirects to the Hub's `/apps/open` with the binding's hash. The
Hub, holding the person's session, creates a pass that expires in 60 seconds and redirects to the
app's `/__conexus/passagem`. Inside the Prévia's frame, the dispatcher serves a small entry page
that posts the host and binding to the Hub page, which calls `POST /api/apps/frame-handoff`
(`apps/edge/src/entry.ts`). In both cases the dispatcher redeems the pass. The Hub deletes the
pass row only when the code, the binding, the host and the deadline all match, and creates the
app session in the same transaction. A tab's session is `published`; a frame's is `preview`.

## The database path

The dispatcher's `Db` entrypoint holds the run login's name, host and database, and the call's
deadline (`apps/edge/src/db.ts`). It derives the password on each call as an HMAC-SHA-256 of the
login name under `APP_LOGIN_KEY` (`packages/hub-api/src/app-login.ts`). The Hub derives the same
password when it creates the login, so no password is stored or sent. Each `db` call is a new
HTTP transaction through Neon's serverless driver, and nothing carries between calls.

## Call limits

`APP_CALL_LIMITS` holds the numbers (`packages/app-contract/src/limits.ts`), and each has one
place that enforces it:

| Limit | Value | Where |
| --- | --- | --- |
| CPU | 50 ms | the version's upload, and again in the dispatcher's options (`DISPATCH_OPTIONS`) |
| `db` calls | 50 a call | the platform's subrequest limit, in the same options |
| Whole call | 10 s | a race in `toApp`; past it the browser gets a 502 page, and the stubs refuse new work |
| Statement | 5 s | `statement_timeout` on the run login |
| Transaction | 6 s | `transaction_timeout` on the run login |

The race stops the dispatcher waiting; it does not cancel the app's Worker. The `db` stub does
stop work: it aborts a Neon request in flight at the deadline and refuses a new one after it.

## Connector calls

An app declares the reads it calls with `defineConnectors` and calls them through
`connectorsOf`, typed from the connector kit (`packages/app/src/connectors.ts`). The types come
from `@conexus/connectors/calls`, which holds types only, so no line of the kit lands in the app's
bundle.

A call travels from the app to the dispatcher's `Connectors` stub, then to the Hub's
`POST /api/app-connector-calls` with the app session (`apps/edge/src/connectors.ts`). The Hub
admits the session again and reads the manifest of the session's version
(`apps/server/src/hub/connectors/app-calls.ts`). It answers `NOT_GRANTED`, telling no more, when
the version did not declare that read, when the operation is not a read, or when the Project has
no usable connection of that connector. Otherwise it opens the sealed credential in a short
transaction, holds no database connection during the call, and reads through `readThrough`
(`apps/server/src/hub/connectors/read.ts`). That path parses the input, waits for the connection's
turn (one call at a time per connection), and calls the executor.

The executor is the one place the Hub opens a credential and talks to a provider
(`apps/server/src/hub/connectors/executor.ts`). It sends to the connector's pinned origin,
follows no redirect, redacts secrets from the reply and turns it into the kit's answer.

An app reaches reads only. The types offer no write. Publishing refuses a version that declares
an operation that is not a read (`ungranted()` in the Hub's grants). Every call checks again. The
app speaks as its version, held to its manifest, not as the person calling; the role check
happened at publish. Writes exist only for Project agents, behind approval
([agents and automations](agents-and-automations.md)).

## The outbound wall

Both Workers for Platforms namespaces send every `fetch` a Worker makes to the outbound Worker,
which logs `EDGE_OUTBOUND_REFUSED` and answers 403 (`apps/edge/src/outbound.ts`). In the browser,
the content security policy allows only the app's own origin
(`packages/app-contract/src/page.ts`). The `db` and `connectors` stubs run in the dispatcher,
outside the app's Worker, and they are the app's only way out.
