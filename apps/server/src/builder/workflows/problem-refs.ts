import type { Balloon, WorkflowId, WorkflowProblem } from '@conexus/hub-api'
import type { Ref, TriggerShape } from './compile-refs.ts'
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

type RefContext = Readonly<{
  byId: ReadonlyMap<string, Spot>
  feedsForeach: ReadonlySet<string>
  shape: TriggerShape
  outputsOfUse: (balloon: Balloon) => readonly string[] | null
}>

type Issue = Readonly<{ code: WorkflowProblem['code']; message: string }>

/** A `{{bN.campo}}` of a balloon: the balloon must exist, come before, outside any path, and return the field. */
function balloonRefIssue(context: RefContext, spot: Spot, ref: Ref): Issue | null {
  const target = context.byId.get(ref.who)
  if (target === undefined)
    return { code: 'REF_BALLOON_UNKNOWN', message: `${ref.text}: não existe o balão ${ref.who}.` }
  if (!spot.seen.has(ref.who)) {
    const beforeIt = target.order < spot.order && !spot.inside.includes(target.balloon)
    return beforeIt
      ? {
          code: 'REF_INSIDE_BRANCH',
          message: `${ref.text}: o balão ${ref.who} está dentro de um caminho, e sua saída não sai de lá.`,
        }
      : { code: 'REF_NOT_BEFORE', message: `${ref.text}: o balão ${ref.who} não vem antes deste.` }
  }
  const outputs = outputsOf(target.balloon, context.feedsForeach, context.outputsOfUse)
  return outputs !== null && !outputs.includes(ref.field)
    ? {
        code: 'REF_FIELD_UNKNOWN',
        message: `${ref.text}: o balão ${ref.who} não devolve ${ref.field}.`,
      }
    : null
}

function refIssue(context: RefContext, spot: Spot, ref: Ref): Issue | null {
  const inItem = spot.inside.some((outer) => outer.kind === 'FOREACH')
  if (ref.who === 'item')
    return inItem
      ? null
      : { code: 'REF_BALLOON_UNKNOWN', message: `${ref.text} só existe dentro de um Para cada.` }
  if (inItem)
    return {
      code: 'REF_OUTSIDE_ITEM',
      message: `${ref.text} é de fora do Para cada, e lá dentro só o item chega.`,
    }
  if (ref.who === 'gatilho')
    return ref.field !== 'dia' && context.shape.fields[ref.field] === undefined
      ? {
          code: 'REF_FIELD_UNKNOWN',
          message: `${ref.text}: o gatilho não traz o campo ${ref.field}.`,
        }
      : null
  return balloonRefIssue(context, spot, ref)
}

function contextOf(
  spots: readonly Spot[],
  shape: TriggerShape,
  outputsOfUse: RefContext['outputsOfUse'],
): RefContext {
  const byId = new Map<string, Spot>()
  for (const spot of spots) if (!byId.has(spot.balloon.id)) byId.set(spot.balloon.id, spot)
  const feedsForeach = new Set(
    spots.flatMap((spot) =>
      spot.balloon.kind === 'FOREACH' && spot.previous !== null ? [spot.previous.id] : [],
    ),
  )
  return { byId, feedsForeach, shape, outputsOfUse }
}

/** Every `{{…}}` of a value: where it points, and whether the balloon that holds it may read it there. */
export function refProblems(
  spots: readonly Spot[],
  shape: TriggerShape,
  outputsOfUse: (balloon: Balloon) => readonly string[] | null,
): WorkflowProblem[] {
  const context = contextOf(spots, shape, outputsOfUse)
  const problems: WorkflowProblem[] = []
  for (const spot of spots) {
    const title = spot.balloon.title
    for (const [key, text] of Object.entries(valuesOf(spot.balloon))) {
      const field = 'input' in spot.balloon ? `input.${key}` : key
      for (const ref of refsOf(text)) {
        const issue = refIssue(context, spot, ref)
        if (issue !== null)
          problems.push(problemAt(issue.code, spot, field, `${issue.message} (em “${title}”)`))
      }
    }
  }
  return problems
}
