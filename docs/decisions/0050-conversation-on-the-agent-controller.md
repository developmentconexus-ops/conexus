# 0050. The conversation on Mastra's agent controller, the queue in two processors

## Context

Step 12 makes the first model call, on Mastra's `AgentController`.

## Decision

One `AgentController`, one shared Builder agent, one session per conversation, owned by
`company:<id>:person:<id>`. An input processor gives each attempt its account; an error processor,
last, reads the refusal. No model array, no Mastra route.

Founder's calls: a conversation belongs to who started it and is never deleted; it leaves with its
Projeto, person or company. Search and page reading are Mastra's, with no list and no limit: a
page can steer the Builder or carry conversation text in an address, and he accepts that risk; a
limit may come as its own request. A refused account waits for the vendor's hour, else 15 min
(429) or 6 h (402). At most 10 attempts per question. The automatic switch walks the chain in our
processor; the new model reads pages without searching again. Gemini converses through the
account's CLIProxy. Title and memory run on the turn's account. Mastra's login enters only its database.

## Criterion

**Question.** Does one controller keep companies apart, keep each conversation's model, and send
each attempt through the queue's account?

**Fixed.** `@mastra/core` 1.78.0, `memory` 1.38.0, `pg` 1.31.2, `code-sdk` 1.14.0 (subscription
provider copied, Apache-2.0, no prompt cache), CLIProxyAPI v8.0.33.

Checks: 1 two companies, a turn each, own events only; 2 switch a model, restart, the session
reads it; 3 an invented key is refused, then the subscription answers; 4 Claude and Gemini asked to
search answer in Portuguese with search and pages in the stream; 5 our `ui/` against `playground-ui`.

## Result

Run 2026-10-19 on LibSQL: 1 to 3 passed. Check 4 first never ended: the
controller asks before a tool with no rule. Native rules now: `web_fetch`,
`web_search` and `recall` allowed, every other category denied (not `yolo`; step 13 D7). Claude
passes. Gemini reads a page but shows no search; that returns to the founder.
Check 5: ours; `playground-ui` brings 43 dependencies and needs routes the Hub lacks (S39).

## State

Accepted 2026-10-19. Founder: the card's approval, "2. Autorizo".
