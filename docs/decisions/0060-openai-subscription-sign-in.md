# 0060. OpenAI subscription sign-in through the Codex client

## Context

The founder's answers of 2026-11-05 add the ChatGPT subscription as a model account, as the Claude
one is: "1. B igual mastra code e igual fizemos para Claude", "2. Sua recomendação",
"3. Da empresa também sem gambiarra aptch, seguindo nosso padrão e lógica".
It amends [0049].

## Decision

An account may be of a third sign-in kind, `openai_codex`, provider `openai`, by the Codex client's
device code: the Hub asks `auth.openai.com` for a short code, shows it with the page to open, asks
the vendor once per interval until the person has typed it, then trades the grant for
`{ access, refresh, expires, accountId }`, sealed whole. The code is carried from Mastra Code, as the
Claude sign-in is. The kind is off for every company until an operator turns it
on. The account is the person's or the company's by the Claude kind's path, with no rule of its own,
and renews through the one lease-based renewal of every subscription.

## Criterion

**Fixed.** `@mastra/core` 1.82.0 (`@mastra/code-sdk` 1.18.0), Codex CLI at `970111f`.

1. OpenAI: sign in, one token, the raw `expires_in`, one refresh with two conversations at once, 20
   turns without 401 or 403, one with reasoning off.
2. The status the endpoint gives a model the subscription does not serve is written in the result.

If 1 fails, that kind stays off and returns to the founder.

## Result

2026-11-05, the founder's use of the step on v0.24.32: "Cara, deu tudo certo, tá? Testei,
funcionou." and "pode finalizar aos 5 ... Não precisa ter esse teste, não." Criterion 2 and the
rest of 1 stay unmeasured (ISSUE-02); a 404 keeps [0054]'s rule.

## Consequences

The Hub presents itself to OpenAI as the Codex application, and OpenAI recommends an API key for
automation: an account may be blocked without notice, and the key path (0049) stays. The model
endpoint is not a public API and may change.

## Reopens when

OpenAI blocks the client or changes the device flow.

## State

Accepted 2026-11-05, at the founder's use. Amends [0049].
