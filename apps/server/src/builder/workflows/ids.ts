import type { Balloon, Path } from '@conexus/hub-api'
import { BalloonId, childrenOf, WorkflowId } from '@conexus/hub-api'
import type { FrozenWorkflow } from './frozen.ts'

/**
 * The one owner of the ids a published workflow has in Mastra. A segment of a path is
 * `<balloon>_<index>`: `b4_0` is the "se sim" of `b4`, `b4_1` the "senão", `b5_2` the third path of
 * a Ao mesmo tempo, `b6_0` the body of a Para cada or Repetir, `b7_0` the other workflow of a USE.
 */
export type PathStep = Readonly<{ balloon: BalloonId; index: number }>

export type MastraWorkflowId =
  /** `wf-<w>-v<n>[-b4_0[-b7_0…]]`: a published version, or one of its paths. */
  | { kind: 'VERSION'; workflowId: WorkflowId; version: number; path: readonly PathStep[] }
  /** `wf-<w>-teste[-b4_0…]`: the draft under test, or one of its paths. */
  | { kind: 'TEST'; workflowId: WorkflowId; path: readonly PathStep[] }

const SEGMENT = '-(b[0-9]{1,3})_([0-9]{1,2})'
const UUID = '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
const VERSION = new RegExp(`^wf-${UUID}-v([1-9][0-9]{0,8})((?:${SEGMENT})*)$`)
const TEST = new RegExp(`^wf-${UUID}-teste((?:${SEGMENT})*)$`)

function stepsOf(text: string): PathStep[] {
  return [...text.matchAll(new RegExp(SEGMENT, 'g'))].map(([, balloon, index]) => ({
    balloon: BalloonId.parse(balloon),
    index: Number(index),
  }))
}

/** The id Mastra gave, read back; null when it is not one a workflow of the Hub made. */
export function parseMastraWorkflowId(raw: string): MastraWorkflowId | null {
  const version = VERSION.exec(raw)
  if (version !== null) {
    return {
      kind: 'VERSION',
      workflowId: WorkflowId.parse(version[1]),
      version: Number(version[2]),
      path: stepsOf(version[3] ?? ''),
    }
  }
  const test = TEST.exec(raw)
  if (test === null) return null
  return { kind: 'TEST', workflowId: WorkflowId.parse(test[1]), path: stepsOf(test[2] ?? '') }
}

export function mastraWorkflowIdOf(id: MastraWorkflowId): string {
  const path = id.path.map((step) => `-${step.balloon}_${step.index}`).join('')
  return id.kind === 'VERSION'
    ? `wf-${id.workflowId}-v${id.version}${path}`
    : `wf-${id.workflowId}-teste${path}`
}

/** The id of a path inside this one: the same id with one more segment. */
export function childOf(id: MastraWorkflowId, step: PathStep): MastraWorkflowId {
  return { ...id, path: [...id.path, step] }
}

/** The list a path runs, the balloon that holds it (null for the main list) and the frozen workflow whose document has it. */
type FrozenPath = Readonly<{ balloon: Balloon | null; list: Path; frozen: FrozenWorkflow }>

function balloonOf(list: Path, id: BalloonId): Balloon | null {
  for (const balloon of list) {
    if (balloon.id === id) return balloon
    for (const path of childrenOf(balloon)) {
      const found = balloonOf(path, id)
      if (found !== null) return found
    }
  }
  return null
}

/** The balloon and the list a path of the Mastra id stands for, found in the frozen document; null if the document has no such path. */
export function pathOf(frozen: FrozenWorkflow, path: readonly PathStep[]): FrozenPath | null {
  let at: FrozenPath = { balloon: null, list: frozen.draft.balloons, frozen }
  for (const step of path) {
    const balloon = balloonOf(at.list, step.balloon)
    if (balloon === null) return null
    if (balloon.kind === 'USE') {
      const other = at.frozen.uses.find((use) => use.balloonId === balloon.id)
      if (other === undefined || step.index !== 0) return null
      at = { balloon, list: other.frozen.draft.balloons, frozen: other.frozen }
      continue
    }
    const list = childrenOf(balloon)[step.index]
    if (list === undefined) return null
    at = { balloon, list, frozen: at.frozen }
  }
  return at
}
