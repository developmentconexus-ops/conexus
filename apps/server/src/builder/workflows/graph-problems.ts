import type { Path, WorkflowProblem } from '@conexus/hub-api'
import { BalloonId } from '@conexus/hub-api'
import type { DynamicWorkflowGraph } from '@mastra/core/workflows'
import { validateDynamicWorkflow } from '@mastra/core/workflows'
import type { RegistryIndex } from './index.ts'
import { spotsOf } from './problem-walk.ts'

type Issue = ReturnType<typeof validateDynamicWorkflow>[number]

type GraphCode = Extract<WorkflowProblem['code'], `GRAPH_${string}`>

const CODES: Readonly<Record<string, GraphCode>> = {
  'missing-reference': 'GRAPH_MISSING_REFERENCE',
  'incompatible-schema': 'GRAPH_INCOMPATIBLE_SCHEMA',
  'invalid-map-config': 'GRAPH_INVALID_MAP',
  'invalid-map-reference': 'GRAPH_INVALID_MAP',
  'invalid-map-placement': 'GRAPH_INVALID_MAP',
}

const SENTENCES: Readonly<Record<GraphCode, string>> = {
  GRAPH_MISSING_REFERENCE: 'não encontramos uma peça de que o balão precisa',
  GRAPH_INCOMPATIBLE_SCHEMA: 'o que o balão recebe não combina com o que vem antes',
  GRAPH_INVALID_MAP: 'o balão lê um valor de um lugar que não vale',
  GRAPH_OTHER: 'o desenho do workflow não passou na conferência',
}

/** The balloon an entry of the compilation belongs to: `bN-in`, `bN`, `bN-contar` and the `bN_<i>` segments are `bN`; `conferir` has none. */
function balloonOfEntry(entry: string | undefined): BalloonId | null {
  const found = BalloonId.safeParse(entry?.match(/^(b\d{1,3})(?:[-_].*)?$/)?.[1])
  return found.success ? found.data : null
}

function entryOf(issue: Issue): string | undefined {
  return issue.repair?.entryId ?? issue.message.match(/"([^"]+)"/)?.[1]
}

/** Mastra's validation of the compiled definitions, one sentence per issue in Portuguese with the balloon's title, and Mastra's own repair kept. */
export function graphProblems(
  balloons: Path,
  defs: readonly DynamicWorkflowGraph[],
  index: RegistryIndex,
): WorkflowProblem[] {
  const titles = new Map(spotsOf(balloons).map(({ balloon }) => [balloon.id, balloon.title]))
  return defs.flatMap((def) =>
    validateDynamicWorkflow(def, index).map((issue): WorkflowProblem => {
      const balloonId = balloonOfEntry(entryOf(issue))
      const code = CODES[issue.code] ?? 'GRAPH_OTHER'
      const title = balloonId === null ? undefined : titles.get(balloonId)
      const sentence = SENTENCES[code]
      return {
        code,
        severity: 'ERROR',
        balloonId,
        path: `graph:${issue.path}`,
        message: title === undefined ? `${sentence}.` : `“${title}”: ${sentence}.`,
        repair: issue.repair,
      }
    }),
  )
}
