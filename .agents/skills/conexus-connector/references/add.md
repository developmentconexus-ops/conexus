# Add a connector

The steps below build a connector in the pattern. Copy shapes from `mercado-livre/` (OAuth, reads
only) and `sankhya/` (pasted login, a read door, a write). A connector outside the step in
construction needs a card first (AGENTS.md; [delivery L1](../../../../docs/guides/delivery.md)).

## Before code

- The system's API documentation, one page per route you will read or write. Each operation cites
  its page, and a test can check the route against it, as `mercado-livre/docs.test.ts` does (online
  only, skipped in CI).
- The credential's class. Measure whether a second login or a renewal kills the first; otherwise it
  is `EXCLUSIVE` ([0077](../../../../docs/decisions/0077-how-a-credential-reaches-the-copy-task.md)).
- Whether answers carry amounts with decimals or integers past 2^53: then `numbers: 'EXACT'`.
- The founder's access for the recordings: a test account or a sandbox. No recording, no operation.
- The kit pieces the system needs that the kit lacks ([gaps](gaps.md)). Each one goes on the card.

## Steps

1. **Make the folder** `packages/connectors/src/<id>/`. The id matches `^[a-z][a-z0-9-]{1,31}$`
   (`ConnectorId`).
2. **Declare the login.** `clientCredentials` for pasted fields, with its token request, token
   answer and logout; or `oauth2Code` with `app: { from: 'installation' }`, PKCE `S256`, the token
   path, `revoke` when the provider has one, and the `grant` and `app` refusal lists. Both take
   `credentialClass`. Cite the provider's page for each fact in a comment.
3. **Write the operations** under `<id>/operations/`, one file per subject, with an `index.ts` that
   passes them to `readsOf` in probe order (the `check` first, each read after the ones its `from`
   names). A small local helper, like `defineRoute` in `mercado-livre/operations/route.ts`, keeps
   each read short. Each operation has:
   - an id in Portuguese, permanent once shipped ([live](live.md));
   - a `summary` and a `label` in Portuguese, read by the agent and by **Testar**;
   - a Zod `input` that refuses what the provider would refuse, and `output`;
   - `request` with the kit's `get` or `post`, never a full URL;
   - `answer` that returns `Rows` and turns every non-2xx into the kit's failure with `failedBy`,
     keeping the provider's code and message in `Native`; a 2xx body never rides on a failure;
   - `probe` and `from`, so the conformance can call it against the double;
   - `list` when it pages, which makes `callLimit` required on the connector.
4. **Record the shapes.** Every body the double sends comes from the real service, with each value
   swapped for an invented one ([testing T29](../../../../docs/guides/testing.md),
   [security S40](../../../../docs/guides/security.md)). `npm run record-connector` records only
   Mercado Livre's cases today; extend `scripts/record-connector.ts` for the new connector. Keep
   refusals as `RecordedRefusal` entries in the definition's `refusals`. A library shape no recording
   holds stops the work (T26).
5. **Declare each write**, if any, with `defineOperation` and `class: 'write'`: `idempotent: false`,
   `uncertain`, `mark`, `idOf`, and `fixed` for fields only the configurer fills
   ([0062](../../../../docs/decisions/0062-a-write-declares-its-provider-facts.md)). List it in
   `writes`, never in `operations`.
6. **Declare the connector** in `<id>/definition.ts` with `defineConnector`: id, name, `version`,
   `origin`, `auth`, `account` (`none`, or `reported` with the `who` read, OAuth only), `category`,
   `summary` in Portuguese, `logo` (the provider's square symbol, an SVG beside it), `numbers`,
   `perProject` (`one` or `many`), `callLimit` (`APP` or `ACCOUNT`, as the provider counts),
   `subjects`, `operations`, `readDoor` when each company has its own tables, `writes`, `refusals`,
   `check` (one read that stands alone) and `skill: { written: readSkill(...) }`.
7. **Write the skill** in `<id>/skill/`: `SKILL.md` with frontmatter (`name: conexus-<id>`, a
   description that says when to read it) and `references/` with one part per subject. Write what
   the definition cannot say: how each route pages, its caps and windows, what each refusal means,
   where an id comes from, and how a number arrives. Never name a tool, never list the operations by
   id, and never promise a tool or screen that does not exist. The kit adds the generated part.
8. **Write the double and the tests.** `<id>/fake.ts` serves the recorded bodies on loopback as a
   `CredentialFake` or an `OAuthFake`, with invented keys. `<id>/<id>.test.ts` calls
   `runConformance(<connector>, <fake>())` and tests each operation through the kit's public
   functions, including each refusal.
9. **Register it.** Add it to `CONNECTORS` in `packages/connectors/src/index.ts`; the Hub lists that
   array and nothing else. In `packages/connectors/src/calls.ts`, add its `perProject` to
   `PerProject` and, when apps read it, its reads to `ConnectorReads` (types only).
10. **Give the installation its OAuth app**, for `oauth2Code`: the key `<id>` with `clientId` and
    `clientSecret` in the file `HUB_CONNECTOR_APPS_FILE` names
    ([0057](../../../../docs/decisions/0057-connections-by-oauth.md)). The founder holds that file.
    The app registers the return address `{publicOrigin}/integrations/return`.
11. **Write the docs.** The card's reference table rows for each piece, with a remendo row's
    `docs/reference/boundaries.md` entry in the same commit; a line for the system in
    `docs/conhecimento/conectores.md`; the release note when values change type for apps (a
    fraction arriving as text under `EXACT`).

## What needs no step

- **Roles.** The server's start hands `CONNECTORS` to the identity through `roleKit()`, which makes
  the connector's resource and operations. No migration.
- **Screens, the Assistant and the Builder.** They read `CONNECTORS` and the generated skill.
- **The wall.** `.dependency-cruiser.cjs` keeps the kit apart; a connector that imports the Hub
  fails `npm run deps`.

## Check it

Run the connector's tests and `node --test packages/app/src/check/connectors.test.ts`, then
`npm run deps` and `npm run check`. When the skill's frontmatter changed, update the request
snapshots ([live](live.md)).
