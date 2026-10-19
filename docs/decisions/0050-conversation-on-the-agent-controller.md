# 0050. The conversation on Mastra's agent controller, the queue in two processors

## Context

Step 12 makes the first model call, on Mastra's `AgentController`.

## Decision

One `AgentController`, one shared Builder agent, one session per conversation, owned by
`company:<id>:person:<id>`. An input processor gives each attempt its account; an error processor,
last, reads the refusal. No model array, no Mastra route. As in Mastra Code.

## Criterion

**Question.** Does one controller keep companies apart, keep each conversation's model, and send
each attempt through the queue's account?

**Fixed.** `@mastra/core` 1.78.0, `memory` 1.38.0, `pg` 1.31.2, `code-sdk` 1.14.0 (its subscription
provider copied with its Apache-2.0 notice, no prompt cache), CLIProxyAPI v8.0.33; the founder's
accounts.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Two companies, a turn each | Each gets only its own events |
| 2 | Switch a model, restart | The new session reads it |
| 3 | An invented key first, then the subscription | The first is refused, the second answers |
| 4 | Subscription and Gemini, asked to search | Portuguese; search and pages in the stream |
| 5 | Our `ui/` against `playground-ui` | One chosen |

If 1 to 3 fail, the controller returns to the founder; a path refused in 4 leaves the step.

## Result

Run 2026-10-19 by a script outside the repository that builds the Builder's controller and
processors, on LibSQL. Checks 1 to 3 passed. Check 4 first never ended: the controller asks
before any tool without a rule (`tool_approval_required`), and no screen answers. The Builder now
gives native rules: `web_fetch`, `web_search` and `recall` are `read`, allowed; every other
category is denied (not `yolo`; founder, step 13 D7). Re-run: Claude passes 4 (a search, five
sites, Portuguese). Gemini through CLIProxy reads a page but shows no search, so it keeps
`web_fetch` only and its search returns to the founder.

Check 5: ours. `playground-ui` 64.0.0 brings 43 dependencies and needs routes the Hub lacks (S39);
ours adds none (W7).

## State

Proposed 2026-10-19. Founder: the card's approval, "2. Autorizo".
