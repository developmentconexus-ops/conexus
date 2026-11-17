---
name: conexus-eval
description: "Measures whether a change makes a Conexus agent (the Assistant, the Builder) answer better, as an experiment: one question with its hypothesis, arms that differ in one thing, a versioned Mastra dataset with SQL-computed ground truth, a small round read trace by trace for error analysis, then a sized round through the real harness, scored by code first, with paired confidence intervals and native cost from the traces. Use when instructions ask which of two prompts, tools, models, ontology shapes or knowledge layouts is better, or whether a change to an agent regressed."
---

# Eval

## When to use

A question of the form "does X make the agent answer better (or cheaper) than Y?", where X and Y
are two states of one agent: a prompt, a tool, a model, an Ontology shape, a Knowledge layout.
Also the regression check of a change to the Assistant's or the Builder's harness, which the
Alinhamento do Assistente requires against the U11 scorecard baseline, same judge on both
sides.

Not for: one behavior with one right answer (a test, testing T14), a screen (`conexus-qa`), or a
library's shape (`npm run record`, testing T26).

## Who

An agent that wrote none of the arms. Rounds with a paid model run only with the founder's word for
that round's model, size and ceiling in dollars.

## What it receives

The question, in one sentence, with its decision: what the founder does with each possible result.
The Conexus commit the arms run at. The lab folder the instructions name, outside the repository
(delivery L21).

## Steps

1. **Question and hypothesis.** Write the question, the hypothesis, the metric that decides it and
   the smallest difference worth acting on (say, 8 points of accuracy). Write what
   result would refute it. A question without a decision attached stops here.
2. **Arms.** Each arm differs from the baseline in one named thing. Everything else is the same
   object: the Conexus commit, the system prompt bytes, the tool set, the model and effort, the
   data, the dataset version, the scorers. Name the baseline (today's `main`). Record each arm's
   configuration in the experiment's `metadata`.
3. **Fidelity.** The agent under test is the real harness: the Hub's `AgentController`, its mode,
   instructions, closed tool set, processors, memory and Knowledge, driven through the Hub's
   routes, as `assistant.scorecard.test.ts` drives it (`subscribed`, `created`, `talking`). Never a
   bare `Agent` with a short prompt standing in for the Assistant: Mastra's `targetType: 'agent'`
   calls `agent.generate` without the controller's instructions, toolsets, `activeTools` or
   `maxSteps`. An arm that needs code (a new tool) runs on a branch of the Conexus at a named
   commit. If an arm cannot run on the real harness, say so in the report's first line: the round
   then measures the idea, not the agent.
4. **Dataset to report.** Steps 4 to 11 (dataset, scorers, rounds, error analysis, judge
   calibration, sizing, report), what invalidates a round and the statistics are in
   [rounds](references/rounds.md).

## Never

- Never compare arms on a bare agent and present it as the Assistant.
- Never tune an arm on the held-out questions.
- Never report an average without its interval, or a difference without its pairing.
- Never report a cost from anywhere but the traces' `estimatedCost`, with the price's source (the
  package's snapshot; list price under a subscription); a null cost is reported as null. (The
  founder asked for native cost only, 2026-11-16.)
- Never call a paid model without the founder's word for that round: the real-model cases are
  opt-in (`CONEXUS_EVAL_REAL_MODEL`), and testing T14 says what a real-model proof claims.
- Never put company data in a dataset (security S40); the data is synthetic, in the shape of a reference platform.

## Stop and ask

- The question has no decision attached.
- An arm cannot run on the real harness without a change to the Conexus that has no card.
- The sized round costs more than the ceiling the founder gave.

## What it produces

The report in the lab folder: the question, the arms with their commit, the dataset version, the
experiment ids, the error taxonomy, the table of step 11, and what the round did not prove.
