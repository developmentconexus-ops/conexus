import type { WorkflowProblem } from '@conexus/hub-api'
import { BALLOONS_MAX } from '@conexus/hub-api'
import type { TriggerShape } from './compile-refs.ts'
import type { Spot } from './problem-walk.ts'
import { problemAt } from './problem-walk.ts'

/** The rules that read only the draft: how many balloons, the ids, what is missing, what is not built yet, and the `IF`. */
export function documentProblems(spots: readonly Spot[], mainCount: number): WorkflowProblem[] {
  const problems: WorkflowProblem[] = []
  if (mainCount === 0) {
    problems.push({
      code: 'NO_BALLOONS',
      severity: 'ERROR',
      balloonId: null,
      path: 'balloons',
      message: 'O workflow ainda não tem nenhum balão.',
    })
  }
  if (spots.length > BALLOONS_MAX) {
    problems.push({
      code: 'WORKFLOW_TOO_MANY_BALLOONS',
      severity: 'ERROR',
      balloonId: null,
      path: 'balloons',
      message: `O workflow tem ${spots.length} balões, e o limite é ${BALLOONS_MAX}.`,
    })
  }
  const first = new Map<string, Spot>()
  for (const spot of spots) {
    const id = spot.balloon.id
    if (first.has(id)) {
      problems.push(
        problemAt(
          'DUPLICATE_ID',
          spot,
          'id',
          `Dois balões têm o mesmo número, ${id}: “${spot.balloon.title}”.`,
        ),
      )
    } else first.set(id, spot)
  }
  return problems
}

function missingOf(spot: Spot): string | null {
  const { balloon } = spot
  switch (balloon.kind) {
    case 'READ':
    case 'WRITE':
      return balloon.connectionId === null || balloon.operation === null
        ? 'a ligação e a operação'
        : null
    case 'AGENT':
      return balloon.agent === null ? 'o agente' : null
    case 'USE':
      return balloon.workflowId === null ? 'o workflow' : null
    default:
      return null
  }
}

const LATER = new Set(['PARALLEL', 'FOREACH', 'LOOP'])

/** What a balloon needs filled before it can run, and the kinds that arrive in a later step. */
export function balloonProblems(spots: readonly Spot[], shape: TriggerShape): WorkflowProblem[] {
  const problems: WorkflowProblem[] = []
  for (const spot of spots) {
    const { balloon } = spot
    const missing = missingOf(spot)
    if (missing !== null) {
      problems.push(
        problemAt(
          'BALLOON_INCOMPLETE',
          spot,
          null,
          `Falta escolher ${missing} em “${balloon.title}”.`,
        ),
      )
    }
    if (LATER.has(balloon.kind)) {
      problems.push(
        problemAt(
          'BALLOON_KIND_LATER',
          spot,
          'kind',
          `“${balloon.title}” ainda não pode ser usado: este tipo de balão chega numa etapa seguinte.`,
        ),
      )
    }
    if (balloon.kind === 'IF') {
      if (balloon.then.length === 0) {
        problems.push(
          problemAt(
            'IF_EMPTY',
            spot,
            'then',
            `O “se sim” de “${balloon.title}” não tem nenhum balão.`,
          ),
        )
      }
      if (shape.fields[balloon.when.field] !== 'number') {
        problems.push(
          problemAt(
            'IF_FIELD_NOT_NUMBER',
            spot,
            'when.field',
            `“${balloon.title}” compara ${balloon.when.field}, que não é um número do gatilho.`,
          ),
        )
      }
    }
  }
  return problems
}
