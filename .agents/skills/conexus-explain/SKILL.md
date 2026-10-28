---
name: conexus-explain
description: "Explains a Conexus step to the founder, in Portuguese: for \"quero entender a etapa X\" it always yields one page read on a computer plus a short summary in the chat, in eight fixed parts; also answers his ad hoc design questions. Read only."
---

# Conexus explain

Explain the technical design of a step so the founder can understand it and question it. Fit the
depth of an ad hoc question to what he asks and to the knowledge he shows.

## What you deliver

For "quero entender a etapa X" (before the card's approval or after build and review), always both:

1. **One page**, in Portuguese, written for reading on a computer, in the eight parts of
   [outline](references/outline.md), in that order. Write it outside the repository (code S40: no
   company data, secret or machine path) and give its link or path.
2. **A short summary in the chat**, in Portuguese: what the step changes for the person, the verdict
   and the decisions asked.

An ad hoc question gets a chat answer in proportion to it; use the outline's parts only when they
help.

## Reading list

Fixed. Read these for the step, in order, and reuse confirmed context:

1. The card's founder's page and its reference table.
2. The step's study, and the decisions the card cites.
3. The `docs/reference/stack.md` rows and the library skills of the stack the step touches; for
   Mastra, the maintainers' `mastra` skill and the types of the installed version.
4. The guides the card names. The [documentation map](../../../docs/index.md) names their owners.
5. The reference repositories at their frozen commits (`~/conexus-study/refs/`, `MANIFEST.md`),
   read for the real code you quote.
6. After build: the pull requests and the reviews.

## Rules

- Tell what is planned from what is built. For a proposal, mark every part as a proposal; for a
  build, check the code and name each `file:line`. Point out divergences and what you could not
  verify. Do not invent decisions or historical reasons.
- Quote real code, short, with its path and line; never a paraphrase presented as an excerpt.
- Without access to the installed version of a library, state that limit; do not conclude that an
  API does not exist.
- Answer in Portuguese, and explain each technical term the first time it appears; the glossary
  collects them.

## Limits

The outline makes no rule: the repository's current sources win. Read only: do not change the
repository, run mutations, implement, install or grant an approval. This skill supports
understanding; it does not replace code review, tests or operational validation.
