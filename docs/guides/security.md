# Security guide

Who may do what, how a person proves who they are, where secrets live and what may leave. This guide
follows the chapters of the [OWASP ASVS 5.0](https://github.com/OWASP/ASVS) and targets its level 2.
Each rule uses the words of [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **must** and **must
not** state a requirement; **should** and **should not** need a stated reason to break; **may** is
a free choice. Each rule ends with the machine that refuses a violation, or "review"; [code C70](code.md) holds
for every promise here. Better Auth's
configuration is its maintainers' skill.

Owners next door: [data](data.md) for grants and transactions, [code](code.md) for routes and
errors, and [architecture](../architecture.md) for where code runs.

## 1. Trust zones (ASVS V15)

- **S1.** The browser **must** be untrusted for anything that carries authority; an id it sends is a
  hint the server resolves. [review]
- **S2.** What an agent returns **must** be treated as adversarial input: the Hub moves an app's
  `main` only forward from the run's base, and reads source only as safe paths and regular files.
  [review]
- **S3.** Generated code **must not** run in the server program. It runs in a Worker with no
  binding, no secret, an empty environment and no network, behind the outbound wall, with bounded
  time, memory and output; each escape names the layer that blocks it [0018]. Model vendors and E2B
  are outside the trust boundary. [review]
- **S4.** The generated handler **must** receive only `db`, `caller` and `connectors`, with `caller`
  filled by the platform. A fourth object is a change of contract [0019]. [app-contract types]
- **S5.** Generated code **must not** keep mutable state at module level; a Worker is reused between
  calls. [verifier]

**Why.** Every zone that runs code someone else wrote is a place an attack starts. Naming the zones
tells each check where it belongs.

**Right.** The Hub reads a candidate's tree as paths and blobs, and never runs its files.

**Wrong.** The Hub trusts a `projectId` the browser sends without resolving the caller's access.

## 2. Who may act (ASVS V8)

- **S6.** Authority **must** be membership of the company that owns the resource, with its role. One
  table **must** map each role to its actions; no role check **may** live anywhere else. [review]
- **S7.** Every read and write **must** go through admission, which returns a proof value. A write
  **must** require the proof, so a query before the check does not compile. [TypeScript]
- **S8.** An action **must** be necessary and never sufficient: each operation rechecks the exact
  subject and its current state. A write that consumes authority owned elsewhere **must** serialize
  with a concurrent revoke through its commit. [review]
- **S9.** The acting person **must** come from the session, never from the request. A route acting
  on a child by id **must** check the child belongs to the parent in its path. [review]
- **S10.** An outsider and an unknown subject **must** get the same not-found; the reason
  (`OUTSIDER`, `FORBIDDEN`, `INACTIVE`) **must** go only to the log. [review]
- **S11.** The last active owner of a company **must not** be removed or demoted. The installation
  administrator is a fact about a person, not a company role, and the last one **must not** be
  revoked. [review]
- **S12.** Sign-up **must** be closed: a person enters only by an invitation, claimed only by the
  e-mail it was sent to, verified by signing in, which grants the role stored by someone allowed to grant it [0016]. A
  sign-up **must not** accept a permission field. [review]
- **S13.** A person **must** be disabled, never deleted. Removing a person **must** withdraw every right they had, and their next request **must**
  be refused. [review]
- **S14.** Authority **must not** be inferred from a provider, model, Mastra or E2B identity, or from
  a storage key, path, URL or a name. An app session **must not** reach a Hub operation. [review]
- **S15.** A second layer of protection **must** enter only with a named threat and a test that fails
  without it. [review]

**Why.** One rule in one place, rechecked on every operation, leaves no path where a stale or forged
right still works.

**Right.** A member asks to remove someone; admission answers `FORBIDDEN`; the response is the same
not-found an outsider gets.

**Wrong.** A route that trusts a `role` field sent in the request body.

## 3. Sessions (ASVS V7)

- **S16.** A copy of the database alone **must** open no Hub session. Who holds the session, and
  how it meets this, is reopened [0013]. [review]
- **S17.** The Hub cookie **must** be `__Host-` prefixed, `Secure`, `HttpOnly`, `SameSite=Lax`, path
  `/`, with no domain. [review]
- **S18.** A session **must** have an idle and a total deadline, both on the clock of the library
  that stamps it; the Hub adds only the total, on the library's own `createdAt`. Founder,
  2026-10-15: "1. A". [review]
- **S19.** Every request **must** read the session row, with no cookie cache. [review]
- **S20.** Sign-out **must** end the session on the server first. A person **must** be able to end
  their own sessions, and an administrator another person's. [review]
- **S21.** A session of one host **must not** be valid on another. App sessions, the Preview session
  and the handoff are Conexus's own. [review]
- **S22.** A handoff to an app **must** be used once: one statement deletes and returns it, checking
  expiry, host and browser. [review]
- **S23.** Better Auth **must** handle password, reset and the attempt limit [0014]. [review]

**Why.** A session is the key to everything a person can do. A short, revocable session that only
its exact host accepts limits what a stolen cookie is worth, and generated apps live on neighbouring
hosts.

**Right.** An administrator removes a person, and their next request is refused.

**Wrong.** A session that stays valid for five minutes in a cookie cache after the person was
removed.

## 4. Browser boundary (ASVS V3)

- **S24.** The Hub **must** be same origin only: no CORS, no credentialed cross-origin API, and the browser leaves only for an app handoff. Every
  write **must** carry the exact `Origin` its access kind names, and an API request `Sec-Fetch-Site`
  `same-origin` or none; there is no CSRF token. [review]
- **S25.** Writes **must** refuse form-encoded and multipart bodies. [review]
- **S26.** The Hub **must** send a Content Security Policy with `script-src 'self'` and no
  `unsafe-inline`, a strict `Referrer-Policy`, and `frame-ancestors 'none'`. [review]
- **S27.** Each route **must** declare a body size limit. [review]
- **S48.** The four access kinds of [code C33](code.md) mean: `page`, a read of any address outside
  `/api/`, where an unknown one gets the screens' page with 404, shown in Portuguese (founder,
  2026-10-15: "1 A 2. A"); `public`, an API `GET` with no session; `entry`, a write with no
  session that also needs `cf-connecting-ip` (S29); `session`, a request whose session is read
  first. Writes follow S24 and S25. The four came with step 3's approved card.
  [`access.test.ts`, `http.test.ts`]

**Why.** A form post from another site is the one request a browser sends with cookies and no
preflight; refusing its media types and checking `Origin` closes it without a second secret.

**Right.** A `POST` from another site fails the `Origin` check before the handler runs.

**Wrong.** A route that reads the cookie itself and skips the access check.

## 5. Abuse

- **S28.** Limits **must** act at three places: Cloudflare by address, the Hub by account and
  company, and sign-in attempts by address per route. Behind the Tunnel the Hub sees one address, so
  it keys on the account. [review]
- **S29.** The header that carries the real client address behind the Tunnel **must** be proved
  before any limit trusts it. [test]
- **S30.** Sign-in **must** have an attempt limit from the day it exists, with a 429 test. [test]

**Why.** Behind the Tunnel every request seems to come from one address, so a limit keyed on it
would lock everyone out at once, and a limit nobody tested is a promise.

**Right.** Ten wrong passwords for one account get 429, and a second account is unaffected.

**Wrong.** A limit keyed on the remote address the server sees.

## 6. Secrets and cryptography (ASVS V11, V13)

- **S31.** A secret **must** be read from a file, through one function that refuses a file others can
  read or an empty one; the environment holds only the file's path. [review]
- **S32.** A stored credential **must** be sealed with the installation key and bound to the row that
  owns it. A retired key **must** only decrypt, and rotation **must** have a rehearsed procedure.
  [review]
- **S33.** The program **must** refuse to start without the installation key, and the founder keeps
  a copy outside the server. [boot check]
- **S34.** A shared model token refresh **must** be reserved in the database, so two refreshes call
  the vendor once, and a refused token **must** be stored and shown as "connect again". [test]
- **S35.** No sandbox, generated app, browser or log **may** receive a durable privileged credential.
  Model calls **must** run in the server program [0030]. [review]
- **S36.** Each privileged adapter **must** have a named owner, its own credential and a destination
  pinned by configuration. There **must not** be a `fetch(url, secret)`; the Builder's web fetch
  carries no credential and goes through the Hub's guard. [review]
- **S37.** Environment files **must** stay out of Git and out of the image. [gitignore, review]

**Why.** A child process inherits the environment, a copied ciphertext opens anywhere unless it is
bound to its row, and a secret that never leaves the program cannot leak through code Conexus does
not control.

**Right.** A model account's key is sealed in the database and opened only for the call.

**Wrong.** A provider key passed into the E2B machine as an environment variable.

## 7. Data and egress (ASVS V14)

- **S38.** Only an admitted, exact revision of a Project **may** be read; a reachable Git object
  **must not** grant disclosure. [review]
- **S39.** Mastra's routes **must** be exposed only from a fixed list, behind the Hub's guard.
  [boot check]
- **S40.** Code, tests, fixtures, docs, commits, pull requests and web searches **must not** carry
  company data, a secret or a machine path. Examples use invented names; evidence stays outside the repository.
  [review]

**Why.** Every outbound call with a credential is a door, and the repository is a door too: what
lands in it is copied to every clone and every model session.

**Right.** A fixture with an invented company and invented figures.

**Wrong.** A helper that takes any URL and attaches the connection's token, or a fixture copied from
a customer's table.

## 8. Logs and traces (ASVS V16)

- **S41.** A log line or span **must not** carry a secret, a token, person-written text, row content
  or an error object. Fields **must** be scalars, and the message a code. [review]
- **S42.** Telemetry **must** leave only through an allowlist of attribute names; anything else is
  dropped and counted. A new field **must** come with a test that plants a string and proves it is
  removed. [test]
- **S43.** The server **must** set the company on spans and on every row Mastra writes; the browser
  **must not** build that owner. [review]
- **S44.** Incoming `traceparent`, `tracestate` and `baggage` from outside **must** be ignored.
  [review]
- **S45.** A security event (sign-in, refusal, session end, administrator change) **must** leave a
  log line with its code and trace id. [review]

**Why.** An incident is investigated from the logs, and a log that leaks a token creates the next
incident. An allowlist fails safe; a redaction list does not.

**Right.** A malformed claim logged with the claim's name, not its value.

**Wrong.** A refresh token printed in a debug line.

## 9. Recovery and accepted risk

- **S46.** A restore **must** treat memberships, sessions and credentials as historical: restored
  sessions are invalid, logins get new passwords, and sign-in stays closed while who is who is not
  yet certain. [review]
- **S47.** An accepted risk **must** be a decision record with its reopening trigger, and a row of
  architecture section 11. [review]

**Why.** A restored database brings back sessions and passwords that were valid at that moment,
not now.

**Right.** After a restore, every app login gets a new password and every person signs in again.

**Wrong.** A restore that brings back a session a person had already ended.
