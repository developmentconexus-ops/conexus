# Security guide

Who may act, how a person proves identity, where secrets live and what may leave. This guide follows
[OWASP ASVS 5.0](https://github.com/OWASP/ASVS), targeting level 2. Each rule uses
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must not** state a requirement;
**should** and **should not** need a stated reason to break; **may** is a free choice. Each rule ends
with its enforcing machine, or "review". A should is not permission to violate an approved security
boundary, contract or decision; [delivery L12](delivery.md) decides whether a finding blocks.
[Code C70](code.md) holds for promises here. Better Auth usage belongs to its maintainers' skill.

Owners next door: [architecture](../architecture.md) for execution zones, hosts and session owners,
[data](data.md) for grants/transactions, and [code](code.md) for routes and errors.

## 1. Trust zones (ASVS `V15`)

- **S2.** Agent output **should** be treated as adversarial input: read only an admitted exact
  revision, safe paths and regular files, moving `main` forward from the run's base without
  overwriting newer work. A reachable Git object is not disclosure authority. Failure: a candidate
  symlink opens a file outside the tree. Prove this boundary when it is built. [review]
- **S4.** The generated handler **must** receive only `db`, `caller` and `connectors`, with `caller`
  filled by the platform. A fourth object is a change of contract [0019]. [app-contract types]
- **S5.** Generated code **must not** keep mutable state at module level; a Worker is reused between
  calls. [the Builder's lint, from step 13]

## 2. Who may act (ASVS `V8`)

- **S6.** Roles and actions **should** have one owner, resolved relative to the company that owns
  the resource, including who can revoke another person's sessions. The operator acts on a client's
  company as a fact of the person, the installation role, never as a member of it. Failure: an
  administrator role in one company is used to alter another. [review]
- **S7.** Every read and write **must** go through admission, which returns a proof value. A write
  **must** require the proof, so a query before the check does not compile. [TypeScript]
- **S8.** Authority consumption **should** recheck the exact resource and current state and
  serialize with concurrent revocation through commit. Failure: permission is revoked after the
  check but the write still commits. A proof type alone cannot guarantee freshness. [review]
- **S9.** Identity and parent/child relationships **should** be resolved by the server, with the
  acting person from the session, not authority supplied by the browser. Failure: changing
  `personId` or spreading a submitted `role` into an insert grants unapproved access. [review]
- **S10.** Unknown subjects and subjects the caller cannot know about **should** return the same
  not-found, with the reason (`OUTSIDER`, `FORBIDDEN`, `INACTIVE`) only in diagnostic logs. Failure:
  403 for an existing id and 404 for an absent one allow company enumeration. [review]
- **S11.** Administration **should** retain at least one active company owner and one installation
  administrator, even under concurrent removals; installation authority is not a company role, and
  the operator is never a member of a client's company. Failure: two transactions each see two
  owners and together remove both. [review]
- **S12.** Entry **should** be granted only to the invited e-mail verified by sign-in and with the
  role an authorized issuer stored, never a permission field from sign-up. Failure: forwarding a
  link to another e-mail transfers a role never granted to that person. [review]
- **S13.** Disabling a person **should** revoke every right without deleting history, refusing the
  next request. Session revocation belongs on the server, available to the holder and authorized
  administrator; deleting a cookie alone does not revoke it. Failure: a cached session lets a
  removed person keep operating. [review]
- **S14.** Technical identity **should** stay separate from Hub authority: vendor/model/Mastra/E2B
  identities, storage keys, paths, URLs and names grant nothing, and app sessions do not authorize
  Hub operations. Failure: a known storage key opens data without admission. [review]
- **S15.** An additional defense **should** address a named threat and have a test that fails
  without it. Failure: a second layer duplicates the first with divergent state and blocks no
  additional attack. [testing T12](testing.md) owns the removal proof. [review]

## 3. Sessions (ASVS `V7`)

- **S17.** The Hub cookie **must** be `__Host-` prefixed, `Secure`, `HttpOnly`, `SameSite=Lax`, path
  `/`, with no domain. [`identity/session.test.ts`, through `npm run test -w @conexus/server`]
- **S18.** Idle and total session deadlines **should** use the session owner's clock and its own
  `createdAt`, retaining the total cap after refresh. The Hub adds only the total deadline.
  Founder, 2026-10-15: "1. A". Failure: a cookie renewed by an older version outlives eight hours;
  current session tests are not proof of every future migration. [review]
- **S22.** An app handoff **should** be consumed atomically once, bound to expiry, host and browser;
  `DELETE ... RETURNING` is one native implementation. Failure: concurrent requests redeem the
  same authorization or take it to another host. [review]

Architecture and decisions [0013], [0014], [0023] and [0024] own the session topology and library
choice, including the guarantee that a database copy alone opens no Hub session.

## 4. Browser boundary (ASVS `V3`)

- **S24.** The Hub **should** enforce its same-origin boundary in `onRequest`, before reading the
  body or running a handler: no CORS or credentialed cross-origin API; the browser leaves only for
  app handoff, whose one door is the `handoff` kind of S48, the single exception to same-origin.
  Writes carry the exact `Origin` their access kind names, and API requests accept
  `Sec-Fetch-Site` only as `same-origin` or absent, without a CSRF token. Writes refuse form-encoded
  and multipart bodies; routes have body limits. Responses keep CSP `script-src 'self'` without
  `unsafe-inline`, strict `Referrer-Policy` and `frame-ancestors 'none'`. Failure: a cross-site
  authenticated GET discloses the person, or a form post bypasses admission. Existing configuration
  and header tests stay; Fastify does not supply this policy automatically. [review]
- **S48.** The six access kinds of [code C33](code.md) mean: `page`, a read of any address outside
  `/api/` but `/apps/open`, where an unknown one gets the screens' page with 404, shown in
  Portuguese (founder, 2026-10-15: "1 A 2. A"); `public`, an API `GET` with no session; `entry`, a write with no
  session that also needs `cf-connecting-ip` (S29); `session`, a request whose session is read
  first; `edge`, a route that exists only on the `HUB_EDGE_PORT` listener, which only the dispatcher
  reaches, and that reads no session or cookie and does not check `Origin` or `Sec-Fetch-Site`;
  `handoff`, a top-level `GET` of `/apps/open` on the public listener, the only route that accepts a
  navigation from another site: `Sec-Fetch-Site` may be any value when `Sec-Fetch-Mode` is
  `navigate` and `Sec-Fetch-Dest` is `document`, each or absent; its session is read first and may
  be absent; it answers a 303 or the screens' page with 404, never a body that names the person.
  Writes follow S24. The first four came with step 3's approved card, the fifth with step 8's, the
  sixth with step 9.1's.
  [`access.test.ts`, `http.test.ts`]

## 5. Abuse

- **S28.** Abuse limits **should** use the identity observable at each boundary: Cloudflare by
  address, Hub by account/company, sign-in attempts by address per route. Failure: limiting by
  the Tunnel's remote address locks out everyone together. S29 and S30 own the origin/429 tests.
  [review]
- **S29.** The header that carries the real client address behind the Tunnel **must** be proved
  before any limit trusts it. [test]
- **S30.** Sign-in **must** have an attempt limit from the day it exists, with a 429 test. [test]

## 6. Secrets and cryptography (ASVS `V11`, `V13`)

- **S31.** The configuration owner **should** read secrets from restricted, nonempty files, with
  only paths in the environment, preserving native exceptions already decided in [0036]. Failure:
  a registration token appears in a process argument or environment. An exception needs an
  explicit decision, not a silent fallback. [review]
- **S32.** Stored credentials **should** be sealed with the installation key and bound to their
  owning row, with retired keys decrypt-only and rotation rehearsed. Failure: copying ciphertext
  to another row changes the connection's identity. [review]
- **S33.** The program **must** refuse to start without the installation key, and the founder keeps
  a copy outside the server. [boot check]
- **S34.** A shared model token refresh **must** be reserved in the database, so two refreshes call
  the vendor once, and a refused token **must** be stored and shown as "connect again". [test]
- **S36.** A privileged adapter **should** have one owner, its own credential and a configured
  authorized destination, never a generic `fetch(url, secret)`; the Builder's credential-free web
  fetch uses the Hub guard. Durable privileged credentials stay out of sandboxes, generated apps,
  browsers and logs; model calls stay in the server as architecture and [0030] decide. Failure:
  a requester-controlled URL receives another system's token. A syntax ban cannot prove this
  secret flow. [review]
- **S37.** Environment files **must** stay out of Git and out of the image. [gitignore, review]

## 7. Data and egress (ASVS `V14`)

- **S39.** Mastra's routes **must** be exposed only from a fixed list, behind the Hub's guard.
  [boot check]
- **S40.** Shared code, tests, fixtures, docs, commits, pull requests and web searches **should** use
  invented examples, with company data, secrets, machine paths and evidence kept outside them.
  Failure: a pull-request correction inserts a machine path. Regex cannot recognize every
  customer's information; AGENTS.md's operational prohibition remains binding. [review]

## 8. Logs and traces (ASVS `V16`)

- **S41.** Logs and spans **should** admit only deliberate scalar diagnostic fields and code
  messages, never secrets, tokens, person-written text, row contents or raw error objects. Secret
  wrappers prevent accidental serialization without a mandatory private-field spelling. Incoming
  external `traceparent`, `tracestate` and `baggage` are ignored rather than trusted as diagnostic
  context. Failure: a library's stderr prints a password hash. JSON format and the outbound
  allowlist alone do not prove safe contents or inbound context selection. [review]
- **S42.** Telemetry **must** leave only through an allowlist of attribute names; anything else is
  dropped and counted. A new field **must** come with a test that plants a string and proves it is
  removed. [test]

## 9. Recovery and accepted risk

- **S46.** Restored memberships, sessions and credentials **should** be treated as historical until
  identity is revalidated: invalidate sessions, issue new login passwords and keep sign-in closed
  while authority is uncertain. Failure: restore resurrects an already revoked session.
  Architecture section 7 owns recovery; section 11 and decision records own accepted risks and
  reopening triggers. [review]
