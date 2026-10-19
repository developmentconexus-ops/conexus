# 0050. The conversation on Mastra's agent controller, the queue in two processors

## Context

Step 12 makes the first model call. Mastra's `AgentController` holds sessions in the process.

## Decision

One `AgentController`, one shared Builder agent, one session per conversation, owned by
`company:<id>:person:<id>` as the server builds it. An input processor gives each attempt its
account (`processInputStep`, `{model: {id, apiKey}}`); an error processor, last, reads the refusal.
No model array, no Mastra route. Basis: Purpose and the founder's step 12 answers; implemented so
in Mastra Code and Mastra Factory.

## Criterion

**Question.** Does one controller keep companies apart, keep each conversation's model, and send
each attempt through the queue's account, on the founder's real accounts?

**Fixed.** `@mastra/core` 1.78.0, `memory` 1.38.0, `pg` 1.31.2, `code-sdk` 1.14.0, CLIProxyAPI
v8.0.33, PostgreSQL 18; the founder's Claude subscription and Google account.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Two companies' sessions in one controller, a turn each | Each subscriber gets only its session's events |
| 2 | Switch a model, restart on the same store | The new session reads it |
| 3 | An invented key first, then the subscription | The first is refused, the second answers |
| 4 | Subscription and Gemini (CLIProxy), each asked to search | Portuguese answers; the stream shows search and pages read |
| 5 | Prototype: our `ui/` pieces against `playground-ui` | Bundle, partial text on reconnect, live region, tool part, `Select`; one chosen here |

If 1 to 3 fail, the controller returns to the founder; a path refused in 4 leaves the step and
returns to him.

**Not covered.** Load; the published Hub.

## Result

Not run.

## State

Proposed 2026-10-19. Founder: the card's approval, "2. Autorizo".
