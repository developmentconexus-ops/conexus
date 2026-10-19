# 0049. Model accounts: any provider's key, two sign-ins, one queue per provider

## Context

The founder's answers of 2026-10-18 and 19 widen [0030]: every provider, several accounts, a
company's people choosing models.

## Decision

An account belongs to a company or to a person in it, of one kind: `api_key`, for any provider of
the installed router registry that needs only a key; `claude_subscription`, by `@mastra/code-sdk`'s
paste-code sign-in; `google_cliproxy`, by CLIProxyAPI's Antigravity login, on `127.0.0.1`. Each
owner keeps one queue per provider, in its order; a person's is their own, then the company's
assigned to them, in the company's position, then the company's. The operators choose a company's
sign-in kinds, which bind personal accounts too; the key is always on. No test when linking. Sealed
with the installation key file. Basis: the founder's answers to the step 11 studies and card.

## Criterion

**Fixed.** `@mastra/core` 1.78.0, `@mastra/code-sdk` 1.14.0, CLIProxyAPI v8.0.33 by sha256.

1. Key-only providers, derived from the installed registry; no credential.
2. Claude: sign in, one token, the raw `expires_in`, one refresh, 20 turns without 401 or 403.
3. Google: the Antigravity login; one token on `127.0.0.1` through the `google` router with `url`
   and the process's key; a renewed login comes back.
4. Each reply noted; a refusal on terms returns to the founder.

If 2 or 3 fails, that kind stays off and returns to the founder.

## Result

1: 2026-10-19, offline, zero `fetch`: 216 providers, 210 key-only (gateway `models.dev`, no
`${VAR}` URL; Google's two variables name one key), 7,778 models. Out: `cloudflare-workers-ai`,
`databricks`, `snowflake-cortex`, `neon`, `infomaniak`, `netlify`. 2: 10:59Z, the founder's
subscription: sign-in 200, raw `expires_in` 28,800 s, refresh 200 with 28,800 s, 20 of 20 turns 200.
3: login 200, but the proof's model list came back empty and no call ran; to rerun. 4: no refusal.
No live key call: the founder holds no API key; tests prove the key path against a double.

## State

Proposed 2026-10-19. Founder: "sM APROVO E CONFIRMO". Supersedes [0030].
