import type { PersonId, WorkflowDraft, WorkflowId, WorkflowProblem } from '@conexus/hub-api'
import { compiled } from './compile.ts'
import { triggerShapeOf } from './compile-refs.ts'
import { freezeOf } from './freeze.ts'
import type { FrozenWorkflow, ReadyDraft } from './frozen.ts'
import { readyDraftOf } from './frozen.ts'
import { graphProblems } from './graph-problems.ts'
import {
  agentProblems,
  approverProblems,
  foreachProblems,
  usedProblems,
  writeProblems,
} from './problem-kinds.ts'
import { lastOutputsOf, refProblems } from './problem-refs.ts'
import { balloonProblems, documentProblems } from './problem-rules.ts'
import type { Spot } from './problem-walk.ts'
import { spotsOf } from './problem-walk.ts'
import type { Seen } from './problem-world-rules.ts'
import { operationProblems, peopleProblems } from './problem-world-rules.ts'
import type { World } from './world.ts'

/** The problems, and, for a draft with no `ERROR`, the draft branded ready with what publishing would freeze. */
export type Problems = Readonly<{
  problems: WorkflowProblem[]
  ready: ReadyDraft | null
  frozen: FrozenWorkflow | null
}>

/** What the world says now, read once for the draft. */
async function seenOf(world: World, publisher: PersonId): Promise<Seen> {
  const [kits, agents, workflows, people, speaker] = await Promise.all([
    world.offered(),
    world.agents(),
    world.workflows(),
    world.people(),
    world.speakerOf(publisher),
  ])
  return { kits, agents, workflows, people, speaker }
}

function worldProblems(
  world: World,
  seen: Seen,
  self: WorkflowId,
  publisher: PersonId,
  spot: Spot,
): Promise<WorkflowProblem[]> | WorkflowProblem[] {
  const { balloon } = spot
  switch (balloon.kind) {
    case 'READ':
      return operationProblems(world, seen, spot, balloon)
    case 'WRITE':
      return Promise.all([
        operationProblems(world, seen, spot, balloon),
        writeProblems(world, seen, spot, balloon, publisher),
        approverProblems(seen, spot, balloon),
      ]).then((each) => each.flat())
    case 'AGENT':
      return [
        ...agentProblems(seen, world, spot, balloon),
        ...approverProblems(seen, spot, balloon),
      ]
    case 'APPROVAL':
      return approverProblems(seen, spot, balloon)
    case 'NOTIFY':
      return peopleProblems(seen, spot, balloon.people)
    case 'USE':
      return usedProblems(world, seen, self, spot, balloon)
    case 'FOREACH':
      return foreachProblems(seen, spot, balloon)
    default:
      return []
  }
}

/**
 * Every problem of a draft, the only owner of them: the Conexus rules first (the draft alone, then
 * the world behind the port), and, for a draft with none, Mastra's validation of what it compiles
 * to. A draft with no `ERROR` comes back branded ready, the only one that compiles (card, U1).
 */
export async function problemsOf(
  world: World,
  self: WorkflowId,
  draft: WorkflowDraft,
  publisher: PersonId,
): Promise<Problems> {
  const spots = spotsOf(draft.balloons)
  const shape = triggerShapeOf(draft.trigger)
  const seen = await seenOf(world, publisher)
  const problems = [
    ...documentProblems(spots, draft.balloons.length),
    ...balloonProblems(spots, shape),
    ...refProblems(spots, shape, lastOutputsOf(seen.workflows)),
    ...(
      await Promise.all(spots.map((spot) => worldProblems(world, seen, self, publisher, spot)))
    ).flat(),
  ]
  if (problems.some((each) => each.severity === 'ERROR'))
    return { problems, ready: null, frozen: null }
  const ready = readyDraftOf(draft)
  const frozen = freezeOf(seen, ready)
  const defs = compiled({ kind: 'TEST', workflowId: self, path: [] }, frozen, shape)
  const graph = graphProblems(draft.balloons, defs, world.registryOf(defs))
  return graph.length === 0
    ? { problems: [], ready, frozen }
    : { problems: graph, ready: null, frozen: null }
}
