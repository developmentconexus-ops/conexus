# 0050. The conversation on Mastra's agent controller, the queue in two processors

## Context

Step 12's first model call runs on Mastra's `AgentController`.

## Decision

One `AgentController` and Builder agent; one session per conversation, owned by
`company:<id>:person:<id>`. An input processor gives each attempt its account; a last error
processor reads the refusal. No model array.

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
tools run unasked (0053) until step 13. Claude passes; Gemini, no search. Check 5:
`playground-ui` brings 43 dependencies.

## Mastra's routes

The Hub mounts `@mastra/server`'s agent-controller routes by `@mastra/fastify` in its own Fastify
scope, from a fixed list (method and path) checked at boot against `SERVER_ROUTES` (S39). The Hub
creates sessions. The scope's guard answers 404 unless the Better Auth person owns the conversation
and its thread, and refuses a client `requestContext`. These routes do not use the `resourceId`
mapped by `server.auth`, and per-session checks need Enterprise FGA, so ownership stays ours, like
Factory's `routes/session-access.ts` (`e23e7508`). The stream goes uncut. Proved on server 1.79.0
and fastify 1.5.23 (Builder proof, E3, E4).

## State

Accepted 2026-10-19. Founder: the card's approval, "2. Autorizo". Amended 2026-10-20, founder:
"3.A"; 2026-10-22: "A", "Pode seguir"; 2026-10-24: "o resto tudo Mastra", "3. Aceito".
