# 0050. The conversation on Mastra's agent controller, the queue in two processors

## Context

Step 12 makes the first model call, on Mastra's `AgentController`.

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
| 5 | Prototype: our `ui/` pieces against `playground-ui` | Partial text on reconnect, live region, page part, `Select`; one chosen |

If 1 to 3 fail, the controller returns to the founder; a path refused in 4 leaves the step and
returns to him.

**Not covered.** Load; the published Hub.

## Result

Run 2026-10-19 on the founder's accounts, by a script outside the repository that builds the
controller, agent and processors as the Builder does; its store was LibSQL, not `pg` on
PostgreSQL 18, and it had no observational memory, title or Hub queue. Checks 1 to 3 passed: no
event or message id crossed companies; the switched model came back after a restart and the other
stayed; the invented key got 401 `authentication_error`, then the subscription answered with the
notice. Check 4 failed on both paths: the turn never ended. The recording shows
`tool_approval_required` at the first `web_fetch`, with no `tool_end` and no `agent_end`. The
controller asks before each tool unless its state says `yolo` (`resolveToolApproval`), and the
Builder has no screen that answers; checks 1 to 3 and the controls answered without a tool, and
the offline rehearsal's double never called `web_fetch`, so nothing showed it before. Mastra Code
starts its controller with `yolo: true`; the Builder now does too, and a `web_fetch` turn in
`conversation.test.ts` completes. Claude's search itself ran (a search, five sites, Portuguese
text). Gemini called only `web_fetch` before it stopped, so whether it searches through CLIProxy
is still open. Check 4 runs again on both paths; this record changes with it.

Check 5: ours. `@mastra/playground-ui` 64.0.0, read: 43 dependencies, 10 peers with `client-js`; its chat takes Mastra's types from routes the Hub lacks (S39), adds a second Zod, has no `role="log"`. Ours takes the stream as is, adds no dependency and no `@mastra/*` to the bundle (W7); `conversation.test.tsx` proves it. Reopens if `playground-ui` drops `client-js`.

## State

Proposed 2026-10-19. Founder: the card's approval, "2. Autorizo".
