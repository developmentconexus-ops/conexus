import type { Balloon } from '@conexus/hub-api'
import type { DynamicWorkflowGraph } from '@mastra/core/workflows'
import { Failure } from '../../platform/failure.ts'
import type { Need, Scope, Source, TriggerShape } from './compile-refs.ts'
import {
  addressOf,
  containerNeeds,
  needSource,
  needsOf,
  scopesOf,
  sourceOf,
  triggerShapeOf,
  valuesOf,
} from './compile-refs.ts'
import type { ObjectSchema } from './compile-schema.ts'
import {
  loopOutputSchema,
  negated,
  outputSchemaOf,
  pathSchema,
  predicateOf,
  shapeSchema,
  usedSchema,
} from './compile-schema.ts'
import type { FrozenWorkflow } from './frozen.ts'
import type { MastraWorkflowId } from './ids.ts'
import { childOf, mastraWorkflowIdOf } from './ids.ts'
import { WORKFLOW_TOOL } from './tools.ts'

export type { TriggerShape }

type Entry = DynamicWorkflowGraph['graph'][number]

const TOOL_OF = {
  READ: WORKFLOW_TOOL.read,
  AGENT: WORKFLOW_TOOL.agent,
  APPROVAL: WORKFLOW_TOOL.approval,
  WRITE: WORKFLOW_TOOL.write,
  NOTIFY: WORKFLOW_TOOL.notify,
} as const

function mapping(id: string, config: Readonly<Record<string, Source>>): Entry {
  return { type: 'mapping', id, mapConfig: JSON.stringify(config) }
}

function sourcesOf(
  scope: Scope,
  before: ReadonlySet<string>,
  needs: readonly Need[],
): Record<string, Source> {
  return Object.fromEntries(needs.map((need) => [need.key, needSource(scope, before, need)]))
}

/** A path is one workflow of its own, and the container names it by the id it was registered under. */
function pathEntry(scope: Scope, balloon: Balloon, index: number) {
  return {
    type: 'workflow',
    id: `${balloon.id}_${index}`,
    workflowId: mastraWorkflowIdOf(childOf(scope.id, { balloon: balloon.id, index })),
  } as const
}

/** The leaf balloon: its `mapping` and the tool. A READ right before a FOREACH of a `many` read is the raw list. */
function leafEntries(scope: Scope, balloon: Balloon, index: number, before: ReadonlySet<string>) {
  if (
    balloon.kind === 'READ' ||
    balloon.kind === 'AGENT' ||
    balloon.kind === 'APPROVAL' ||
    balloon.kind === 'WRITE' ||
    balloon.kind === 'NOTIFY'
  ) {
    const values = Object.fromEntries(
      Object.entries(valuesOf(balloon)).map(([key, text]) => [key, sourceOf(scope, before, text)]),
    )
    const many =
      balloon.kind === 'READ' &&
      scope.list[index + 1]?.kind === 'FOREACH' &&
      scope.frozen.reads.some((read) => read.balloonId === balloon.id && read.many)
    return [
      mapping(`${balloon.id}-in`, { ...values, balloon: { value: addressOf(scope, balloon) } }),
      {
        type: 'tool',
        id: balloon.id,
        toolId: many ? WORKFLOW_TOOL.readMany : TOOL_OF[balloon.kind],
      },
    ] satisfies Entry[]
  }
  return []
}

type Defs = DynamicWorkflowGraph[]
type Container<K extends Balloon['kind']> = Extract<Balloon, { kind: K }>

/** The paths of a container as workflows of their own, registered before the one that names them. */
function pathsOf(scope: Scope, balloon: Balloon, defs: Defs) {
  const kids = scopesOf(scope, balloon)
  for (const kid of kids) pathDef(kid.scope, defs, pathSchema(kid.scope, needsOf(kid.scope)))
  return kids
}

/** What the mapping before a container carries: the input of its paths and the field its condition reads. */
function carried(scope: Scope, balloon: Balloon, before: ReadonlySet<string>) {
  return sourcesOf(scope, before, containerNeeds(scope, balloon))
}

function conditionalEntries(
  scope: Scope,
  balloon: Container<'IF'>,
  before: ReadonlySet<string>,
  defs: Defs,
): Entry[] {
  const kids = pathsOf(scope, balloon, defs)
  const yes = predicateOf(balloon.when)
  return [
    mapping(`${balloon.id}-in`, carried(scope, balloon, before)),
    {
      type: 'conditional',
      id: balloon.id,
      steps: kids.map((kid) => pathEntry(scope, balloon, kid.index)),
      predicates: kids.map((kid) => (kid.index === 0 ? yes : negated(yes))),
    },
  ]
}

function parallelEntries(
  scope: Scope,
  balloon: Container<'PARALLEL'>,
  before: ReadonlySet<string>,
  defs: Defs,
): Entry[] {
  const kids = pathsOf(scope, balloon, defs)
  return [
    mapping(`${balloon.id}-in`, carried(scope, balloon, before)),
    {
      type: 'parallel',
      id: balloon.id,
      steps: kids.map((kid) => pathEntry(scope, balloon, kid.index)),
    },
  ]
}

/** The Para cada takes the raw list the READ before it returned, so no mapping stands between them. */
function foreachEntries(scope: Scope, balloon: Container<'FOREACH'>, defs: Defs): Entry[] {
  pathsOf(scope, balloon, defs)
  return [{ type: 'foreach', id: balloon.id, step: pathEntry(scope, balloon, 0) }]
}

/** The body of a Repetir ends with the counter, which carries the round and the fields of the input to the next round. */
function loopEntries(
  scope: Scope,
  balloon: Container<'LOOP'>,
  before: ReadonlySet<string>,
  defs: Defs,
): Entry[] {
  const [body] = scopesOf(scope, balloon)
  if (body !== undefined) {
    const needs = containerNeeds(scope, balloon)
    const carry = Object.fromEntries(
      needs.map((need): [string, Source] => [need.key, { initData: true, path: need.key }]),
    )
    const count = [
      mapping(`${balloon.id}-contar-in`, {
        ...carry,
        volta: { initData: true, path: 'volta' },
        balloon: { value: addressOf(scope, balloon) },
      }),
      { type: 'tool', id: `${balloon.id}-contar`, toolId: WORKFLOW_TOOL.count },
    ] satisfies Entry[]
    pathDef(body.scope, defs, pathSchema(body.scope, needs), count)
  }
  return [
    mapping(`${balloon.id}-in`, {
      ...carried(scope, balloon, before),
      volta: { value: 0 },
    }),
    {
      type: 'loop',
      id: balloon.id,
      loopType: 'dountil',
      step: pathEntry(scope, balloon, 0),
      predicate: predicateOf(balloon.until),
    },
  ]
}

/** Another workflow as a path of this version: its frozen document, with its own `conferir` and nothing that names a definition of the other. */
function usedEntries(
  scope: Scope,
  balloon: Container<'USE'>,
  before: ReadonlySet<string>,
  defs: Defs,
): Entry[] {
  const other = scope.frozen.uses.find((use) => use.balloonId === balloon.id)
  if (other === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: { reason: 'USE_WITHOUT_FROZEN', balloon: balloon.id },
    })
  }
  const keys = Object.keys(balloon.input)
  const child: Scope = {
    id: childOf(scope.id, { balloon: balloon.id, index: 0 }),
    list: other.frozen.draft.balloons,
    begin: true,
    item: false,
    loop: false,
    prefix: `${scope.prefix}${balloon.id}_0.`,
    shape: triggerShapeOf(other.frozen.draft.trigger),
    frozen: other.frozen,
  }
  pathDef(child, defs, usedSchema(child, keys))
  const given = Object.fromEntries(
    Object.entries(balloon.input).map(([key, text]) => [key, sourceOf(scope, before, text)]),
  )
  return [mapping(`${balloon.id}-in`, given), pathEntry(scope, balloon, 0)]
}

function entriesOf(
  scope: Scope,
  balloon: Balloon,
  index: number,
  before: ReadonlySet<string>,
  defs: Defs,
): Entry[] {
  switch (balloon.kind) {
    case 'IF':
      return conditionalEntries(scope, balloon, before, defs)
    case 'PARALLEL':
      return parallelEntries(scope, balloon, before, defs)
    case 'FOREACH':
      return foreachEntries(scope, balloon, defs)
    case 'LOOP':
      return loopEntries(scope, balloon, before, defs)
    case 'USE':
      return usedEntries(scope, balloon, before, defs)
    default:
      return leafEntries(scope, balloon, index, before)
  }
}

function listOf(scope: Scope, defs: Defs): Entry[] {
  const entries: Entry[] = scope.begin
    ? [{ type: 'tool', id: 'conferir', toolId: WORKFLOW_TOOL.check }]
    : []
  scope.list.forEach((balloon, index) => {
    const before = new Set(scope.list.slice(0, index).map((each) => each.id))
    entries.push(...entriesOf(scope, balloon, index, before, defs))
  })
  return entries
}

function pathDef(
  scope: Scope,
  defs: Defs,
  inputSchema: ObjectSchema,
  ending: readonly Entry[] = [],
): void {
  const graph = [...listOf(scope, defs), ...ending]
  defs.push({
    id: mastraWorkflowIdOf(scope.id),
    inputSchema,
    outputSchema: ending.length > 0 ? loopOutputSchema(inputSchema) : outputSchemaOf(scope.list),
    graph,
  })
}

/**
 * A published version, or the draft under test, as Mastra's dynamic definitions: one for each path
 * first, the main one last (the order `addDynamicWorkflows` registers them in). A pure function of
 * the frozen document: the same version always compiles to the same definitions.
 */
export function compiled(
  id: MastraWorkflowId,
  frozen: FrozenWorkflow,
  trigger: TriggerShape,
): DynamicWorkflowGraph[] {
  const defs: DynamicWorkflowGraph[] = []
  const scope: Scope = {
    id,
    list: frozen.draft.balloons,
    begin: true,
    item: false,
    loop: false,
    prefix: '',
    shape: trigger,
    frozen,
  }
  pathDef(scope, defs, shapeSchema(trigger))
  return defs
}
