# 0054. Model defaults for a person and the company, and choices limited to what accounts serve

## Context

Step 12.3 lets a person and the company choose the model and reasoning level with which new
conversations begin, and the founder asked that a choice list only what an account can run.

## Decision

A person and the company each keep a default `{model, effort}` (Meus padrões, Padrões da empresa).
The owner and the administrator change the company's; every member changes their own. A new
conversation copies the default at birth, so a later change touches no existing conversation. Its
model is the first usable of: the one asked for, the person's default, the company's, then the
starter models in order (Claude Sonnet 5.5, GPT-5, Gemini 2.5 Pro), each at its lowest level that
the model accepts. A default with no usable account is skipped and the screens say so. A level the
model does not accept descends to the highest it accepts below, else the lowest. The account used
first is the first of the provider's queue.

Every model choice (composer, defaults, switch queue) lists one thing: the models an account in its
scope serves. Scope is the person's own accounts plus those the company gives them; the company's
screen and queue read the company's. The Hub reads each provider's model list with the account's
credential at link, sign-in, token refresh and a provider 404, and at each start for every account
whose list was never read; Google sign-in reads CLIProxy's `/v1/models` through the account's own
proxy, and an exact id is the contract. A failed read leaves the list unread, and the registry's
chat models stand.

## Criterion

`model-defaults.test.ts`, `model-served.test.ts` and `model-accounts.test.ts` through the Hub's
routes; `tests/e2e/defaults.test.ts` for the founder's script.

## Result

2026-10-21: the Anthropic list recorded from the founder's subscription (13 ids) and CLIProxy's
list from his local proxy (ten ids, three of them registry chat models) are read by the Hub's
schema; CI of https://github.com/developmentconexus-ops/conexus/pull/211 and, for v0.12.10,
https://github.com/developmentconexus-ops/conexus/pull/224 green. OpenAI and Google-key readers
are not recorded, and the server's own proxy is unverified; open points:
https://github.com/developmentconexus-ops/conexus/issues/220.

## State

Accepted 2026-10-21. Founder, 2026-10-20: "Tudo A" (the five choices and both fronts), and
2026-10-21, on the served lists: "A". The starter list and level are his to confirm
(https://github.com/developmentconexus-ops/conexus/issues/215).
