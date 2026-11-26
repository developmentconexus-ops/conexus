# The build brief

The instructions that start a build session: what firstmate writes and the builder follows. The
failure this prevents: in the G3 of Registro e conformidade, the session whose brief said "no local
typecheck" left a top commit that did not compile, its one Bloqueia in two blind reviews; the
session with this brief left every commit green, in less time and fewer tokens, with one stop
against three. One pair, under unequal conditions; the one clear difference, the typecheck, came
from the instruction.

## What the brief carries

1. **At the top, in at most 120 words, the goal and the done line.** The goal: the unit or group,
   the base commit and the branch. Done: each of the unit's criteria green by its test, `npm run
   check:local` green, the group's checkpoint run. The card's "Pronto quando" block is the done line
   when the card has one; the brief points to it and writes none of its own.
2. **The state file.** The builder creates `criteria.json` first, beside the task's notes and
   outside the repository ([delivery L21](../../../../docs/guides/delivery.md)): one item per
   criterion, with its number, test, state (`nao_iniciado`, `verde` or `vermelho`) and proof, and
   the reference rows opened. It keeps the file current, with short progress notes beside it.
3. **The verification it may run.** `npm run check:local` on each commit before its push
   (step 7) and the checkpoint's batch, one heavy process at a time.
4. **The named stops.** Criterion against criterion, criterion against the code, a shape outside
   the contract, and a reference the builder could not open are each a `needs-decision` with the
   evidence ("Stop and ask"), never a choice made in the code. The stops to avoid: announcing the
   next step without doing it, and offering an alternative "se preferir".
5. **The house rules by pointer.** "The method is the repository's; this brief does not repeat it":
   `AGENTS.md`, this skill, the card and pstack `poteto-mode`. A rule the brief restates drifts
   from its guide.
6. **Open the reference before using it.** Before using a reference table row, the builder opens
   its reference at the cited `file:line` and records it in `criteria.json`.

## The references

- Claude's prompting guide,
  https://platform.claude.com/docs/pt-BR/build-with-claude/prompt-engineering/claude-prompting-best-practices,
  read 2026-11-17: "Seja claro e direto" (the goal, the format and the constraints, for a reader
  without context); "Fluxos de trabalho em múltiplas janelas de contexto", items 2 and 5 (tests
  tracked in a structured file such as `tests.json`; tools that verify without a person); "Melhores
  práticas de gerenciamento de estado" (structured state, free-form progress notes, git).
- The Opus 5.5 page of the same guide, `prompting-claude-opus-5-5`, read 2026-11-17: in an
  autonomous run, a checklist the model updates, since a turn that ends in text is a report and
  not proof of completion; name the early stops to avoid and the stops wanted.
