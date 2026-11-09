# The Hub side of an app

The Builder ends a turn with a version that passed its check ([the Builder turn](builder-turn.md)).
From there the Hub owns the app: it stores the version, puts it on Cloudflare, migrates the app's
database, moves the Prévia to it, and later publishes it, directly or through an approved request.
This page explains that path and the app database underneath it. Code is under
`apps/server/src/hub/` unless a path says otherwise.

## A Project and its app

A Project is a row in `projects.project` (`hub/projects/tables.ts`): a name unique in its
company, an attempt key for idempotent creation, a deletion mark and a `host_label`. The label is
`<name part>--<company nickname>`, built once from the name and never rewritten
(`hostLabelOf` in `packages/hub-api/src/address.ts`). The app's host is that label under the apps'
domain. A Project deleted and created again with the same name gets a new id and the same label,
so the dispatcher cuts old sessions with `PROJECT_REPLACED`.

The first Project of a company also creates the company's Neon project (region São Paulo,
PostgreSQL 18), named `<nickname>-<companyId>` (`hub/projects/company-database.ts`). A claim row
keeps two creations from racing while Neon prepares.

The app itself has its own tables in schema `apps` (`hub/apps/tables.ts`). The `app` row appears
on the first send. It holds two pointers, `live_version_id` (the Prévia) and
`published_version_id`, plus the claim of a send in progress and `database_ready`. Each
`app_version` keeps the Builder's version number, a state (`sending`, `ready`, `failed` or
`pruning`), the manifest and a digest. Files are content-addressed: a `blob` is stored once per
company by SHA-256, and `version_file` rows name the blobs a version uses.

## Sending a version to the Prévia

The end of a Builder turn calls `apps.sendFromBuilder` as the turn's person, with the run id as the
attempt key (`apps/server/src/main.ts`, `hub/apps/app-versions.ts`). `sendVersion`
(`hub/apps/send.ts`) runs in this order, following decision
[0046](../decisions/0046-version-worker-first-migrations-in-one-transaction.md):

1. One transaction stores the blobs, the version as `sending` and the files, and takes the app's
   send claim. A second send while a live claim exists is refused with `APP_VERSION_SENDING`.
2. With no transaction open, the Hub uploads the Worker `v-<versionId>` to the Workers for
   Platforms namespace (`apps/server/src/platform/cloudflare.ts`). The upload carries no binding,
   the CPU limit, tags naming the company and the Project, and the screens as static assets. A
   module that throws at start fails the send as `APP_VERSION_NOT_STARTING`, before any database
   is touched.
3. The Hub asks Neon for the owner's connection string for this act only. If the app's database is
   not ready, it creates the schema and the logins in one transaction.
4. It applies the version's pending migrations as the migration login, all of them in one
   transaction with their ledger rows.
5. A last transaction checks the claim is still this send's, marks the version `ready`, moves
   `live_version_id` to it and marks old versions for pruning.

Before each outside step the send checks that the Project is not being deleted and that the claim
is still its own. A failure marks the version `failed` with its code, frees the claim and leaves
the pointer where it was. The conversation shows the result as the Prévia's state.

Pruning keeps the new version, the published one and the three newest other `ready` versions, and
removes the rest, Worker first (`hub/apps/prune.ts`).

## The Prévia and the published app share a host

There is one Worker per version, and both environments live at the same host. Which version a
visit runs depends on the session's environment, chosen by the route that made the one-use pass
([the app contract and the dispatcher](app-contract-and-dispatcher.md)). A tab opened through
`/apps/open` is `published` and runs `published_version_id`. The Prévia's frame in the Hub
(`apps/web/src/builder/preview/preview.tsx`) gets its pass from `POST /api/apps/frame-handoff`, so
it is `preview` and runs `live_version_id`, or the example app before the first version
(`callTo` in `hub/apps/handoff.ts`). Only company members enter the Prévia.

## Publishing, and going back

Publishing moves only `published_version_id` (`publishIn` in `hub/apps/live.ts`). It runs in one
transaction: lock the app, find a kept `ready` version by number, check that the Project still
grants every connector read the manifest declares (`ungranted`), move the pointer and close any
open request. The Prévia, the Builder's Git and the data stay as they are, and a send in progress
neither blocks it nor fails because of it.

There is no separate rollback. Going back means publishing an earlier kept version, so the reach
is the versions pruning kept. Migrations are not undone. A later version's tables stay, and a
migration that would break the version still running is rolled back
([the app database](#the-app-database)).

## Who publishes and who asks

The fixed roles decide (`hub/identity/roles.ts`). An owner, an administrator or a developer
publishes directly. A member asks: `requestPublish` creates a `PUBLISH_APP_VERSION` request
(`hub/requests/requests.ts`), at most one open per Project, and notifies everyone who may decide.
Someone who could publish is refused with `PUBLISH_REQUEST_NOT_NEEDED`. Only an owner or an
administrator decides, never on their own request. Approving calls the same `publishIn` in the
same transaction, so the connector check and the pointer move are identical. Any publish closes
the open request: `APPROVED` when it is the requested version, `SUPERSEDED` otherwise.

## Who uses the app, with which role

A member of the company enters as `BUILDER` and holds every role. Anyone else needs a row in
`projects.app_access` and enters only the published app, as `USER` with that row's role
(`hub/projects/hosts.ts`). Rows come from app invitations, which only an owner or an
administrator sends. The role offered must be one the published manifest declares
(`hub/projects/app-access.ts`). Revoking access deletes the row and ends the person's app
sessions. A role the published version stops declaring stays on the row and admits nothing.

## The app database

Each Project has one schema, `app_<projectId>`, inside its company's Neon project, and three
logins (`appLogin` in `packages/hub-api/src/app-login.ts`):

- `app_<id>_run` runs the app, with `statement_timeout` 5 s and `transaction_timeout` 6 s;
- `app_<id>_migrate` owns the schema and applies migrations, with no timeouts, so a version's
  migration transaction is not cut;
- `app_<id>_read` reads only, for the Project agents' `app_data_read`.

The Prévia and the published app use the same schema and the same run login. A version that
reaches the Prévia migrates the tables the published app is reading. That is why each migration
batch runs an outcome check in its own transaction
(`apps/server/src/platform/migration-outcome.ts`). It copies every table first and rolls back if
a column disappears, a type changes incompatibly, or a value or a row is lost, so the previous
version keeps reading and writing. Before running, a parser allows only a fixed list of statement
kinds (`apps/server/src/platform/migration-rule.ts`). A migration already applied whose SHA-256
changed is refused.

No password is stored. Each is an HMAC-SHA-256 of the login name under the installation's app
login key, computed by the Hub when it creates the login and by the dispatcher on each call. The
logins exist only inside their company's Neon project, so a derived password opens nothing in
another company's project.

## What the Hub repairs at start

After it starts listening, the Hub runs `apps.repair()` (`hub/apps/repair.ts`) without blocking
start. For each company with an app, it fails sends whose claim expired, finishes marked
deletions, uploads again any missing Worker of a Prévia or published version from the blobs it
keeps, creates the schema and logins again (passwords derive the same), applies the Prévia's
migrations, and prunes what is marked. This covers a database restored to an earlier moment or a
Worker Cloudflare lost. Older kept versions are not uploaded again.

## Deleting a Project

Deletion marks the Project first, so every read, admission and send treats it as gone. Then,
with no transaction open, the Hub removes every version's Worker, drops the schema and the three
logins, deletes the app's rows, releases the Builder's conversations and deletes the Project row
(`hub/apps/removal.ts`, `hub/projects/marked.ts`). A step that does not confirm leaves the mark,
and the next start resumes it. The company's Neon project stays until the company itself is
deleted.
