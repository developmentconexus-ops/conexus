# The kit, piece by piece

Every file below is in `packages/connectors/src/kernel/`. Each piece names its reference and says
whether the situation is the same or how Conexus differs. The kit imports only `zod` and Node. In
production code only `apps/server/src/hub/connectors/` imports it; `.dependency-cruiser.cjs` also
lets tests, the app SDK's types (`calls.ts`) and the recorders in, and `npm run deps` holds that wall
([0056](../../../../docs/decisions/0056-connectors-kit-and-one-executor.md)).

The references are the local checkouts at these commits: Nango `c607ff39`, dlt `8fa90a97`, n8n
`7a384b35`, Airbyte `82db089b`, Mastra with `@mastra/core` 1.83.0. The singer-sdk 0.54.9 is read
through the lake studies, not at the source. NK is the Nekt documentation text saved on
2026-11-19, cited by line.

## The definition

`definition.ts`, `defineConnector`. One connector in one place: id, name, version, the one
`https` origin, the login, the account kind, catalog fields (category, summary, logo), `perProject`,
`callLimit`, subjects, operations, `readDoor`, `writes`, `refusals`, `check`, `numbers` and the
written skill. It throws at import on a repeated id, a subject without an operation, a `from` that is
not earlier, a list read without `callLimit`, a check that needs an earlier read, a reported
account without OAuth, or a written skill that names one of its tools.

Reference: Nango keeps one declarative entry per provider with a `verification` call
(packages/providers/providers.yaml:5-14); Airbyte's manifest carries a `check`. Different
situation: both run the connector's function in their own executor; here the Hub runs it live, and
the kit checks the whole set at load because it is TypeScript, not YAML.

## The operation

`operation.ts`, `defineOperation`. One read or write: `class` (`read`, `write`, `destructive`, no
default), Zod `input` and `output`, `from` and `probe` for the conformance, `request` that builds a
`ProviderRequest`, and `answer` that turns a `ProviderAnswer` into `Answered`: `OK` or one closed
failure (`REFUSED`, `AUTH_REFUSED`, `TOKEN_EXPIRED`, `UNREADABLE`, `BUSY`), each with the provider's
`Native` answer as it came.

- Status map, `outcomeOf`, `failedBy` and `deniesAccess` (403): n8n treats 401 and 403 as a
  rejected credential (packages/cli/src/services/credentials-tester.service.ts:348-353). Same
  situation. `failedBy` never returns `TOKEN_EXPIRED`, the only failure the session renews on: each
  connector maps its own expiry answer first (401 in `mercado-livre/answers.ts` and
  `hubspot/operations/shared.ts`; 401 and a 403 with `GTW3403` in `sankhya/answers.ts`).
- `BUSY` with the wait the provider named (`waitMs`); the Hub waits once (`send.ts`), and the kit
  never retries. Nango marks 5xx, 429 and 401 as retryable
  (packages/shared/lib/services/proxy/retry.ts:56-64) but retries only when the caller sets
  `retries`, default 0 (packages/shared/lib/services/proxy/utils.ts:308). Same situation by default:
  both hand the failure back. Nango differs only when its caller asks for retries.
- `list` with `ListPaging` (`OFFSET`, `CURSOR`, `NONE`) and `changed`: dlt `OffsetPaginator`
  (dlt/sources/helpers/rest_client/paginators.py:489-499) is the same situation, with `max` as its
  `limit` and `ceiling` as its `maximum_offset`. For a cursor, dlt declares where the cursor sits
  (`JSONResponseCursorPaginator`, :844-851); the kit's `answer` returns it as `Rows.seguinte`. Same
  fact, different place.
- `WriteDeclarations` (`uncertain`, `mark`, `idOf`) and `fixed`: no reference declares the three;
  [0062](../../../../docs/decisions/0062-a-write-declares-its-provider-facts.md) cites n8n,
  activepieces and Windmill for `fixed`.

## The request

`request.ts`, `toRequest`. The one place a URL is built: the connector's origin, no redirect, and a
path with `..`, `@` or `\` refused. Nango builds the URL from the connection's base
(packages/shared/lib/services/proxy/utils.ts:440-490) and follows redirects up to a policy's
`maxRedirects` (packages/shared/lib/utils/http.ts:18, :67;
packages/shared/lib/services/proxy/outbound-policy.ts:146). Different situation: the
credential travels on a live call, so the kit is stricter (S36). The `origin` parameter exists only
for the local double.

## The answer shape

`rows.ts`, `Rows`. Every list answer is `{ linhas, temMais }`, plus `seguinte`, `total` and
`parcial` when the provider says them. dlt reads a total by path (paginators.py:123-125), Airbyte by
`DpathExtractor`. The Portuguese names are Conexus's and are the five-place contract
([live](live.md)).

## The login by pasted fields

`auth.ts`, `clientCredentials`. The company pastes its keys; the kit builds the token request,
reads the token and declares the logout. Nango's `TWO_STEP` with a `client_credentials` grant is the
same situation (packages/providers/providers.yaml:143-149). The logout, with `ended` for a 200 that
refuses inside, is in no reference: it comes from the Sankhya, whose session hangs when a token
ends without a logout.

## The login by authorization

`oauth.ts`, `oauth2Code`. PKCE `S256` page, code exchange, refresh, revoke, and two refusal lists:
`grant` (the person must sign in again) and `app` (our app is wrong). Same situation as Nango
(PKCE at packages/server/lib/controllers/oauth.controller.ts:735-745; the `authorization_code` and
`refresh_token` bodies in its Agiloft exchange, packages/shared/lib/clients/provider.client.ts:458
and :479) and n8n (packages/cli/src/oauth/oauth.service.ts:1282-1287). Differences: PKCE is
mandatory here; Nango has it on by default and off per template with `disable_pkce` (:737), and
n8n uses it when `shouldUsePkce` says so. Airbyte declares which refresh answers mean a bad grant
(`refresh_token_error_*`, source-strava/manifest.yaml:90-97); the split into `grant` and `app` is
ours. The app's keys come
from one file the founder holds ([0057](../../../../docs/decisions/0057-connections-by-oauth.md)).

## The credential class

`credential-class.ts`, `SHAREABLE` or `EXCLUSIVE`, required on every login. It says whether a second
session kills the first, so it decides who renews in the copy task
([0077](../../../../docs/decisions/0077-how-a-credential-reaches-the-copy-task.md)). No reference
declares it as data: Nango serializes refreshes with a lock per connection
(packages/shared/lib/services/connections/credentials/refresh.ts:445-457), and Airbyte stores the
rotated refresh. A remendo with its `docs/reference/boundaries.md` entry. Today the Hub picks the
process session or the database lease by the login's kind, not by the class; the copy's Hub (U8)
is the first reader.

## The session

`session.ts`, `sessionOf`, `openSession`, `credentialsSource`, `RENEW_BEFORE_MS`. Reuse the token
while it lives, renew 60 s before its end with the old one logged out first, renew and repeat once
on `TOKEN_EXPIRED`, never repeat a write (`once`), log out at `close`. The Hub's `read.ts`, `check.ts`
and `write.ts` call only `session.call` and `session.once`.

Reference: the singer-sdk renews before a request when the token is no longer valid
(authenticators.py:526-529, from the studies, not reread at the source) and has no margin; Nango keeps a 15-minute margin for OAuth refresh,
with no logout (packages/shared/lib/services/connections/utils.ts:12). Only "renew when no longer
valid" is the same situation. The margin, the logout before renewal, the single repeat and `once`
come from the measured Sankhya (a 300 s token that ends in use). A remendo with its boundaries entry.

## The exact number

`exact-json.ts`, `parseExact`, `parseJson`, and `numbers: 'EXACT' | 'DOUBLE'` per connector. With
`EXACT`, a number a double cannot hold, a fraction or an integer past 2^53, comes back as its source
text; the Hub's `wire.ts` reads every answer through `parseJson`. The singer-sdk reads floats as
`Decimal` (singerlib/json.py:40-44, from the studies, not reread at the source). Same situation at the ends; the kit also
keeps the large integer. Consequence: an app receives `"12.5"`, not `12.5`, so the written skill and
the release note say it.

## The generated skill

`skill.ts`, `readSkill`, `connectorSkill`. The agents read the written frontmatter, then a part
generated from the definition (reads only, or reads and writes with approval, and the subjects by
label), then the written body. Neither part names a tool or lists the operations. Nekt states the
rule: live tool names "can change, so an agent should resolve them at run time rather than
hardcoding them into a skill" (NK:12598-12600). Mastra's `ToolSearchProcessor` gives the agent
`search_tools` and `load_tool` (packages/core/src/processors/processors/tool-search.ts:171). Same
rule, different mechanism: Nekt resolves at run time; the kit generates the part that changes and
refuses the tool name at load.

## The conformance

`conformance.ts`, `runConformance(connector, fake)`, nine cases every connector passes: declared
ids and subjects, the account and catalog fields, a class and probe per operation, each write as a
write, each recorded refusal read and each write's mark in its request, each probe answered in
order, every page of each list walked once, a wrong key refused, and no credential in any request
but the login. Airbyte's acceptance tests check `spec`, `connection`, `discovery` and `basic_read`
against the real service (airbyte-integrations/connectors/source-getlago/acceptance-test-config.yml).
Different situation: the kit runs against a double with recorded refusals, and no reference proves
the credential never leaks.

## Small pieces

`logo.ts` (the provider's square symbol, no script or outside link), `loopback.ts` (the double on
127.0.0.1 for the real executor), `page.ts` (a public documentation page, with a 30 s and 2 MB
ceiling) and `oauth-double.ts`. Ours, with no reference: S40 and the executor's real `fetch` need
them.

## Leftovers of the old copy engine

`copy.ts`, `list.ts`, `conformance-list.ts` and `list-fixture.ts` serve no live call, but they are
still read: the conformance's page walk goes through `conformance-list.ts`, which uses the other
two, `mercado-livre/operations/vendas.ts` imports `Instant` from `copy.ts`, and the index exports
both. U3 moves `Instant`, rewrites the page walk and deletes them; `ListPaging` and `ListRead` stay. `assertNoCopyModels` in `definition.ts` and
`inCopyTurn` in `limits.ts` guard or queue a shape no connector has. Never build on any of them.
