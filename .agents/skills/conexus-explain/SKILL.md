---
name: conexus-explain
description: "Explains a Conexus step to the founder, in Portuguese, at two fixed moments: before he approves its card, and after build and review with the merge ask; also answers his ad hoc design questions. Read only."
---

# Conexus explain

Explain the technical design of the change so the founder can understand it and question it. Fit
the depth to his question and to the knowledge he shows.

## Preparation

1. Identify the target from the context: card, plan, diff or implementation. Read the material
   that matters, the code involved and the repository's rules that apply. Reuse confirmed context;
   do not reread the whole project.
2. Tell what is planned from what is built. For a proposal, explain the intended design; for an
   implementation, check the code. Point out divergences and what you could not verify. Do not
   invent decisions or historical reasons.
3. Read the guides the step's card names for the target. The [documentation
   map](../../../docs/index.md) names their owners. The questions come from those guides' rules and
   from the real change. A demonstrated defect may be pointed out without citing a guide.
4. When Mastra is involved, use the maintainers' `mastra` skill and check the documentation and
   types of the installed version. Say what the framework keeps and what Conexus adds. Without
   access to the installed version, state that limit; do not conclude that an API does not exist.

## The answer in the chat

Follow [outline](references/outline.md): moment A before the card's approval, moment B with the
merge ask, an ad hoc question in proportion to it. Keep within the outline's word budget; evidence
goes in an appendix outside it.

## Limits

Answer the founder in Portuguese, and explain each technical term briefly the first time it
appears. The outline makes no rule: the repository's current sources win.

Read only. Do not change files, run mutations, implement, install or grant an approval. This skill
supports understanding; it does not replace code review, tests or operational validation.
