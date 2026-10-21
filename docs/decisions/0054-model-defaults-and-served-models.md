# 0054. Model defaults for a person and the company, and choices limited to what accounts serve

## Context

Step 12.3 lets a person and the company choose where new conversations begin; the founder asked
that a choice list only what an account can run.

## Decision

A person and the company each keep a default `{model, effort}` (Meus padrões, Padrões da empresa);
the owner and the administrator change the company's, each member their own. A new conversation
copies the default at birth. Its model is the first usable of: the one asked for, the person's
default, the company's, then the starters (Claude Sonnet 5.5, GPT-5, Gemini 3.8 Flash as CLIProxy
names it, Gemini 3.5 Flash Lite). A default no account serves is skipped, and the screens say so. A
level the model does not accept descends to the highest it accepts below, else the lowest. The
account used first is the first of the provider's queue.

Every model choice (composer, defaults, switch queue) lists only what an account in its scope
serves: the person's own and those given them, or the company's. The Hub reads each provider's list
with the account's credential at link, sign-in, token refresh, a provider 404 and start (if never
read); a Google sign-in reads its CLIProxy's `/v1/models`. A list counts by the registry's exact
ids, except CLIProxy's own names: a sign-in offers each Gemini or Gemma chat model it lists as it
names it, `gemini-3.8-flash-high` at its named level, and no Claude or GPT model, which are not
Google's. A failed read leaves the list unread, and the registry's chat models stand.

## Criterion

`model-defaults`, `model-served`, `served-reads` and `model-accounts` tests through the Hub's
routes; `tests/e2e/defaults.test.ts` for the script.

## Result

2026-10-21: the founder's recorded Anthropic (13 ids) and CLIProxy (ten ids) lists read with the
Hub's schema; CI of https://github.com/developmentconexus-ops/conexus/pull/211 and
https://github.com/developmentconexus-ops/conexus/pull/224 green. OpenAI and Google-key readers
are not recorded, nor is the server's own proxy: https://github.com/developmentconexus-ops/conexus/issues/220.

## State

Accepted 2026-10-21. Founder, 2026-10-20: "Tudo A" (the five choices and both fronts), and
2026-10-21, on the served lists: "A". The starter list and level: https://github.com/developmentconexus-ops/conexus/issues/215.
