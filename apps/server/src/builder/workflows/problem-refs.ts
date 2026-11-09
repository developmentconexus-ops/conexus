import type { Balloon, WorkflowId, WorkflowProblem } from '@conexus/hub-api'
import type { TriggerShape } from './compile-refs.ts'
import { refsOf, valuesOf } from './compile-refs.ts'
import type { FrozenWorkflow } from './frozen.ts'
import type { Spot } from './problem-walk.ts'
import { problemAt } from './problem-walk.ts'

const OUTPUTS: Readonly<Record<string, readonly string[]>> = {
  READ: ['resultado'],
  AGENT: ['texto', 'conversationId'],
  APPROVAL: ['aprovado', 'por'],
  WRITE: ['resultado', 'marca'],
  NOTIFY: ['avisados'],
  LOOP: ['volta'],
}

/** What `{{bN.campo}}` may name in a balloon: its output by kind; the `IF` and a read that only feeds a `FOREACH` have none to name. */
function outputsOf(
  balloon: Balloon,
  feedsForeach: ReadonlySet<string>,
  outputsOfUse: (balloon: Balloon) => readonly string[] | null,
): readonly string[] | null {
  if (balloon.kind === 'USE') return outputsOfUse(balloon)
  if (balloon.kind === 'READ' && feedsForeach.has(balloon.id)) return []
  return OUTPUTS[balloon.kind] ?? []
}

/** What a USE returns: the output of the last balloon of the other workflow, as that version froze it; unknown when the other is not published. */
export function lastOutputsOf(
  workflows: readonly Readonly<{ workflowId: WorkflowId; frozen: FrozenWorkflow | null }>[],
): (balloon: Balloon) => readonly string[] | null {
  return (balloon) => {
    const other =
      balloon.kind === 'USE'
        ? workflows.find((each) => each.workflowId === balloon.workflowId)
        : undefined
    const last = other?.frozen?.draft.balloons.at(-1)
    return last === undefined ? null : last.kind === 'USE' ? null : (OUTPUTS[last.kind] ?? [])
  }
}

/** Every `{{…}}` of a value: where it points, and whether the balloon that holds it may read it there. */
export function refProblems(
  spots: readonly Spot[],
  shape: TriggerShape,
  outputsOfUse: (balloon: Balloon) => readonly string[] | null,
): WorkflowProblem[] {
  const byId = new Map<string, Spot>()
  for (const spot of spots) if (!byId.has(spot.balloon.id)) byId.set(spot.balloon.id, spot)
  const feedsForeach = new Set(
    spots.flatMap((spot) =>
      spot.balloon.kind === 'FOREACH' && spot.previous !== null ? [spot.previous.id] : [],
    ),
  )
  const problems: WorkflowProblem[] = []
  for (const spot of spots) {
    const title = spot.balloon.title
    const inItem = spot.inside.some((outer) => outer.kind === 'FOREACH')
    for (const [key, text] of Object.entries(valuesOf(spot.balloon))) {
      for (const ref of refsOf(text)) {
        const field = 'input' in spot.balloon ? `input.${key}` : key
        function at(code: WorkflowProblem['code'], message: string): void {
          problems.push(problemAt(code, spot, field, `${message} (em “${title}”)`))
        }
        if (ref.who === 'item') {
          if (!inItem) at('REF_BALLOON_UNKNOWN', `${ref.text} só existe dentro de um Para cada.`)
          continue
        }
        if (inItem) {
          at('REF_OUTSIDE_ITEM', `${ref.text} é de fora do Para cada, e lá dentro só o item chega.`)
          continue
        }
        if (ref.who === 'gatilho') {
          if (ref.field !== 'dia' && shape.fields[ref.field] === undefined)
            at('REF_FIELD_UNKNOWN', `${ref.text}: o gatilho não traz o campo ${ref.field}.`)
          continue
        }
        const target = byId.get(ref.who)
        if (target === undefined) {
          at('REF_BALLOON_UNKNOWN', `${ref.text}: não existe o balão ${ref.who}.`)
        } else if (!spot.seen.has(ref.who)) {
          const beforeIt = target.order < spot.order && !spot.inside.includes(target.balloon)
          at(
            beforeIt ? 'REF_INSIDE_BRANCH' : 'REF_NOT_BEFORE',
            beforeIt
              ? `${ref.text}: o balão ${ref.who} está dentro de um caminho, e sua saída não sai de lá.`
              : `${ref.text}: o balão ${ref.who} não vem antes deste.`,
          )
        } else {
          const outputs = outputsOf(target.balloon, feedsForeach, outputsOfUse)
          if (outputs !== null && !outputs.includes(ref.field))
            at('REF_FIELD_UNKNOWN', `${ref.text}: o balão ${ref.who} não devolve ${ref.field}.`)
        }
      }
    }
  }
  return problems
}
