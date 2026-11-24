# Add a connector

A connector is one value of `defineConnector` in `packages/connectors`, the kit. The Hub runs every
connector through one executor ([0056](../decisions/0056-connectors-kit-and-one-executor.md)), so a
new connector adds a folder to the kit and two registrations, and no code to the Hub. The kit is the
only place that names a provider ([security S36](../guides/security.md)). Start from the Mercado
Livre folder, `packages/connectors/src/mercado-livre/`; what is left of the copies of a connector's
rows is [the Sync](../explanation/sync.md).

## Steps

1. **Make the folder** `packages/connectors/src/<id>/`. The id matches `^[a-z][a-z0-9-]{1,31}$`
   (`ConnectorId`, `kernel/definition.ts`).
2. **Declare the connector** in `<id>/definition.ts` with `defineConnector`. It names the id, the name,
   the version, the fixed `origin`, the login (`auth`: `oauth2Code` for an OAuth provider), the
   `account` kind, the `category`, the `summary`, the `logo` (an SVG file beside it), whether a Projeto
   takes `one` connection or `many` (`perProject`), the `callLimit`, the `subjects`, the `operations`,
   the `check` that proves a connection and the `skill`. `defineConnector` throws at import when an
   operation id repeats, a subject has no operation or a write does not write.
3. **Write the operations** under `<id>/operations/`, one `Operation` per read, with its input and
   output schemas and its documentation page. A write is declared in `writes` and takes the fixed fields
   the operation names ([0062](../decisions/0062-a-write-declares-its-provider-facts.md)).
4. **Write the skill** in `<id>/skill/SKILL.md`, which the Builder and the Assistant read to know what
   each operation means. `readSkill` loads the folder.
5. **Register the connector** in `CONNECTORS` in `packages/connectors/src/index.ts`. The Hub lists
   this array and nothing else, and the screen and the Assistant read it.
6. **Register the typed reads** in `packages/connectors/src/calls.ts`: add the connector's reads to
   `ConnectorReads` and its `perProject` to `PerProject`. Types only: an app's bundle carries no line
   of the kit.
7. **Write the fake and the test.** The fake answers the provider's origin with no network
   (`<id>/fake.ts`). The test calls `runConformance(connector, fake)` (`kernel/conformance.ts`), which
   every connector passes, then tests each operation against the fake. A shape no recording holds
   is recorded from the real provider, never typed ([testing T26](../guides/testing.md)).
   `npm run record-connector` records only Mercado Livre's four reads today, so another connector
   extends `scripts/record-connector.ts`.
8. **Give the installation its OAuth app**, for an `oauth2Code` connector whose `app` is `from:
   'installation'`: the key `<id>` in the file `HUB_CONNECTOR_APPS_FILE`, with its `clientId` and
   `clientSecret` ([0057](../decisions/0057-connections-by-oauth.md)). The founder holds that file.
   HubSpot's entry is the example: `{ "hubspot": { "clientId": "...", "clientSecret": "..." } }`, and
   the app made at HubSpot registers the return address `{publicOrigin}/integrations/return`, the one
   address every connector's login comes back to.

## What needs no step

- **Roles.** The server's start hands `CONNECTORS` to the identity through `roleKit()`
  (`apps/server/src/hub/connectors/role-kit.ts`), which makes the connector's resource and operations.
  There is no migration.
- **The screens and the Assistant.** They read `CONNECTORS`.
- **The walls.** `.dependency-cruiser.cjs` keeps the kit apart from the rest, so a connector that
  imports the Hub fails `npm run deps`.

## Check it

Run the connector's tests, then `npm run deps` and `npm run check`.
