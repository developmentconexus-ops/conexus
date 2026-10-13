---
name: conexus-explain
description: "Explains to the founder, in Portuguese, the technical design of a Conexus step card, plan, refactoring or implementation, before he approves it or after it is built, especially when he asks about responsibilities, architecture, code structure, types and contracts. Read only."
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
3. Read the guides the step's card names for the target. The
   [documentation map](../../../docs/index.md) names their owners. The questions come from those
   guides' rules and from the real change. Use the repertoire in
   [questions](references/questions.md) for owner, data flow, guarantees, alternatives and the
   limits of the evidence. A demonstrated defect may be pointed out without citing a guide.
4. When Mastra is involved, use the maintainers' `mastra` skill and check the documentation and
   types of the installed version. Say what the framework keeps and what Conexus adds. Without
   access to the installed version, state that limit; do not conclude that an API does not exist.

## The answer in the chat

### 1. Overview

In a few sentences, explain what changes and the flow between the parts. In a refactoring, show
the change of structure and the behaviour that must stay.

### 2. The technical questions that matter in this change

Write the questions as subheadings, usually three to five, in proportion to the scope, and answer
them yourself; do not turn the explanation into a questionnaire for the founder.

In each answer, show how the solution works, why the split makes sense and what the choice costs.
Use the real names of modules, types, functions and interfaces, with short excerpts or signatures
when they make the design concrete. Mark proposed examples as proposals.

Point at the sources in the card or as `file:line`. Tie decisions to the rules that apply through
the concrete mechanism. Tell the intended guarantee from the implemented mechanism and from the
evidence already seen. An inference about why a choice was made is labelled as an inference.

### 3. What deserves questioning

Show the relevant choices, limits, conflicts or open decisions. Tell a demonstrated problem from a
risk or a doubt; do not invent findings to fill the section.

## Limits

Answer the founder in Portuguese, and explain each technical term briefly the first time it
appears. The reference offers a repertoire, not new rules: the repository's current sources win.

Read only. Do not change files, run mutations, implement, install or grant an approval. This skill
supports understanding; it does not replace code review, tests or operational validation.
