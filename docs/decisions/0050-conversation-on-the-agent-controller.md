# 0050. The conversation on Mastra's agent controller, the queue in two processors

## Context

Step 12's first model call runs on Mastra's `AgentController`.

## Decision

One `AgentController` and Builder agent; one session per conversation, owned by
`company:<id>:person:<id>`. An input processor gives each attempt its account; a last error
processor reads the refusal. No model array, no Mastra route.

Founder's calls: a conversation belongs to its starter, is never deleted, leaves with its Projeto,
person or company. Search and page reading are Mastra's, unlimited; a page may steer the Builder
or leak conversation text in an address, accepted. A refused account waits the vendor's hour,
else 15 min (429) or 6 h (402); at most 10 attempts per question; our processor walks the chain.
Gemini uses the account's CLIProxy. Title and memory use the turn's account. Mastra's login enters
only its database.

## Criterion

**Question.** Does one controller keep companies apart, each conversation's model, each
attempt's queue account?

**Fixed.** `@mastra/core` 1.78.0, `memory` 1.38.0, `pg` 1.31.2, `code-sdk` 1.14.0, CLIProxyAPI
v8.0.33.

Checks: 1 companies apart; 2 model kept over restart; 3 invented key refused, then subscription
answers; 4 Claude and Gemini search in Portuguese; 5 our `ui/` against `playground-ui`.

## Result

Run 2026-10-19 on LibSQL: 1 to 3 passed. Check 4 hung: the controller asks before an unruled tool;
tools run unasked (0053) until step 13. Claude passes; Gemini shows no search. Check 5 counted
dependencies: `playground-ui` brings 43, needing routes the Hub lacks (S39).

## Why not Mastra's routes

Read in Mastra's source at `9d2e7398` (`@mastra/server` 1.79.0-alpha.3, not installed). Its routes
take `resourceId` from the URL, check a coarse permission
(`packages/server/src/server/handlers/agent-controller.ts:94-108`, `:175`); per-resource checks
need Enterprise FGA, barred from production without a licence (`ee/LICENSE:7`). Its stream has no
replay and sends the browser arguments, results and reasoning; the Hub sends Mastra's own messages and events,
cut once, on its owner-checked routes. Revisit when open-source Mastra checks
session owners or replays its stream, or most of its interactive surface is needed.

## State

Accepted 2026-10-19. Founder: the card's approval, "2. Autorizo". Amended 2026-10-20, founder:
"3.A", and 2026-10-22: "A", "Pode seguir".
