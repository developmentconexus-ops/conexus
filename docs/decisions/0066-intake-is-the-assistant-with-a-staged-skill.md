# 0066. The intake is the Assistant with a staged skill

## Context

A company starts at zero. Founder, 2026-11-12: "O que eu queria montar é, tipo, um intake de
informação", "pensando mais num fluxo", "seja crítico". The intake study traced Mastra Code, the
Factory, Twenty's setup agent, Kiro, Mitra, Dify and Palantir's AI FDE. Founder, 2026-11-12: "D
Aprovado", `"H1"`, `"I1"`.

## Decision

- The intake is an agent with a skill whose stages say what to learn and when each is done, the
  shape of `conexus-plan-new`, with `ask_user` cards, the task list and approval gates in code. A
  workflow never runs the conversation; workflows take only mechanical work, the inventory of
  [0064]. Mastra: agents when "the steps aren't known in advance", workflows when "clearly defined
  upfront".
- Stages never name a table: Palantir's domain before source. How to read a system stays in each
  connector's skill.
- The Assistant owns the entry conversation, since the Builder lives in a Projeto; the Builder
  owns each demand from the Assistant's briefing. No new agent.
- `H1`: the entry asks only what holds for the whole company, then the first demand; an area's rules
  come with its demand.
- `I1`: a question the owner cannot answer stays open, with what it leaves off, on Início.
- D: the same intake serves the owner alone and with our implementation person, whom the owner
  invites as an administrator when the client buys implementation; the owner approves the first
  revision. No new role; the operator never becomes a member.
- Each intake is recorded. A stage becomes a fixed step when its path, written after one intake,
  predicted the next.

## Not decided yet

Sending a question to a colleague with a deadline (`I2`); how many intakes freeze a stage.

## Reopens when

Questions go to other people with deadlines (`I2`): then a workflow with `suspend` and recipients,
Dify's Human Input form, wins.

## State

Accepted 2026-11-12 ("D Aprovado", `"H1"`, `"I1"`).

[0064]: 0064-company-ontology-in-hub-tables-by-approved-proposals.md
