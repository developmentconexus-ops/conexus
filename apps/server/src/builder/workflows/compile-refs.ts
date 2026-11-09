import type { Balloon, Condition, Path, Trigger } from '@conexus/hub-api'
import type { FrozenWorkflow } from './frozen.ts'
import type { MastraWorkflowId } from './ids.ts'
import { childOf } from './ids.ts'

/** The type a field of the trigger has: the one thing `{{gatilho.campo}}` and `IF_FIELD_NOT_NUMBER` need to know. */
export type FieldKind = 'text' | 'number'
export type TriggerShape = Readonly<{ fields: Readonly<Record<string, FieldKind>> }>

/** The run's input: `{}` for the clock and for the hand, the two triggers of this step. */
export function triggerShapeOf(trigger: Trigger): TriggerShape {
  switch (trigger.kind) {
    case 'SCHEDULE':
    case 'MANUAL':
      return { fields: {} }
  }
}

/** One list of balloons that compiles to one Mastra workflow, with what it needs to know about its surroundings. */
export type Scope = Readonly<{
  id: MastraWorkflowId
  list: Path
  /** The list starts with `conferir`: the main list and the path of a USE. */
  begin: boolean
  /** The body of a Para cada: its input is one row. */
  item: boolean
  /** The body of a Repetir: its input carries the round, `volta`. */
  loop: boolean
  /** The segments of the USE balloons from the main list down to this one: `b7_0.` inside the other workflow of `b7`. */
  prefix: string
  shape: TriggerShape
  frozen: FrozenWorkflow
}>

/** What a list reads from the input of its workflow, under the key it has there. */
export type Need =
  | { key: string; kind: 'field'; name: string }
  | { key: string; kind: 'out'; balloon: string; field: string }
  | { key: 'conferir_dia'; kind: 'dia' }

export type Ref = Readonly<{ text: string; who: string; field: string }>

const REF = /\{\{\s*([A-Za-z][A-Za-z0-9]*)\.([A-Za-z][A-Za-z0-9]*)\s*\}\}/g

export function refsOf(text: string): Ref[] {
  return [...text.matchAll(REF)].map(([whole, who, field]) => ({
    text: whole,
    who: who ?? '',
    field: field ?? '',
  }))
}

/** The values a balloon takes from the trigger and from the balloons before it, by the key of its mapping. */
export function valuesOf(balloon: Balloon): Readonly<Record<string, string>> {
  switch (balloon.kind) {
    case 'READ':
    case 'WRITE':
    case 'USE':
      return balloon.input
    case 'AGENT':
      return { prompt: balloon.prompt }
    case 'APPROVAL':
      return { question: balloon.question }
    case 'NOTIFY':
      return { message: balloon.message }
    default:
      return {}
  }
}

/** Where the balloon lives in a run, the key the tools find it by: `b3`, or `b7_0.b3` inside a USE. */
export function addressOf(scope: Scope, balloon: Balloon): string {
  return `${scope.prefix}${balloon.id}`
}

/** The step id a balloon has in its workflow: a USE is the nested workflow `bN_0`. */
export function stepIdOf(balloon: Balloon): string {
  return balloon.kind === 'USE' ? `${balloon.id}_0` : balloon.id
}

export function fieldNeed(name: string): Need {
  return { key: name, kind: 'field', name }
}

function needOfRef(scope: Scope, before: ReadonlySet<string>, ref: Ref): Need | null {
  if (ref.who === 'gatilho' && ref.field === 'dia')
    return scope.begin ? null : { key: 'conferir_dia', kind: 'dia' }
  if (ref.who === 'gatilho' || ref.who === 'item') return fieldNeed(ref.field)
  if (before.has(ref.who)) return null
  return { key: `${ref.who}_${ref.field}`, kind: 'out', balloon: ref.who, field: ref.field }
}

/** What a need of a path asks of the list around it: nothing when that list has it, else the same need. */
function lifted(scope: Scope, before: ReadonlySet<string>, need: Need): Need | null {
  if (need.kind === 'dia') return scope.begin ? null : need
  if (need.kind === 'out') return before.has(need.balloon) ? null : need
  return need
}

function conditionOf(balloon: Balloon): Condition | null {
  return balloon.kind === 'IF' ? balloon.when : balloon.kind === 'LOOP' ? balloon.until : null
}

/** The paths a container compiles to, by index; an empty "senão" has no workflow of its own. */
export function childrenOf(scope: Scope, balloon: Balloon): { index: number; scope: Scope }[] {
  const lists: readonly Path[] =
    balloon.kind === 'IF'
      ? [balloon.then, balloon.else]
      : balloon.kind === 'PARALLEL'
        ? balloon.paths
        : balloon.kind === 'FOREACH' || balloon.kind === 'LOOP'
          ? [balloon.body]
          : []
  return lists.flatMap((list, index) =>
    list.length === 0
      ? []
      : [
          {
            index,
            scope: {
              ...scope,
              id: childOf(scope.id, { balloon: balloon.id, index }),
              list,
              begin: false,
              item: balloon.kind === 'FOREACH',
              loop: balloon.kind === 'LOOP',
            },
          },
        ],
  )
}

/** What the mapping before a container, and the input of each path, must carry: every path's needs, and the field its condition reads. */
export function containerNeeds(scope: Scope, balloon: Balloon): Need[] {
  const needs = new Map<string, Need>()
  const condition = conditionOf(balloon)
  if (condition !== null) needs.set(condition.field, fieldNeed(condition.field))
  for (const child of childrenOf(scope, balloon)) {
    if (child.scope.item) continue
    for (const need of needsOf(child.scope)) needs.set(need.key, need)
  }
  return [...needs.values()]
}

/** Every key the list reads from the input of its workflow, in the order it first reads it. */
export function needsOf(scope: Scope): Need[] {
  const needs = new Map<string, Need>()
  const before = new Set<string>()
  function add(need: Need | null): void {
    if (need !== null && !needs.has(need.key)) needs.set(need.key, need)
  }
  for (const balloon of scope.list) {
    for (const text of Object.values(valuesOf(balloon)))
      for (const ref of refsOf(text)) add(needOfRef(scope, before, ref))
    for (const need of containerNeeds(scope, balloon)) add(lifted(scope, before, need))
    before.add(balloon.id)
  }
  return [...needs.values()]
}

export type Source =
  | { value: string | number }
  | { template: string }
  | { initData: true; path: string }

/** A placeholder of Mastra's templates: `${path}`. */
function placeholder(path: string): string {
  return `\${${path}}`
}

/** Where a reference reads, as a path in a template. */
function locatorOf(scope: Scope, before: ReadonlySet<string>, ref: Ref): string {
  if (ref.who === 'gatilho' && ref.field === 'dia')
    return scope.begin ? 'stepResults.conferir.dia' : 'initData.conferir_dia'
  if (ref.who === 'gatilho' || ref.who === 'item') return `initData.${ref.field}`
  const step = scope.list.find((balloon) => balloon.id === ref.who)
  return before.has(ref.who) && step !== undefined
    ? `stepResults.${stepIdOf(step)}.${ref.field}`
    : `initData.${ref.who}_${ref.field}`
}

/** A value of a balloon as a descriptor of Mastra's `mapping`: a constant, a template, or, for exactly one field of the trigger, the field itself so it keeps its type. */
export function sourceOf(scope: Scope, before: ReadonlySet<string>, text: string): Source {
  const refs = refsOf(text)
  const [only] = refs
  if (only === undefined) return { value: text }
  if (
    refs.length === 1 &&
    only.text === text &&
    (only.who === 'gatilho' || only.who === 'item') &&
    only.field !== 'dia'
  )
    return { initData: true, path: only.field }
  return {
    template: text.replace(REF, (whole: string, who: string, field: string) =>
      placeholder(locatorOf(scope, before, { text: whole, who, field })),
    ),
  }
}

/** Where the mapping before a container reads what a path needs. */
export function needSource(scope: Scope, before: ReadonlySet<string>, need: Need): Source {
  if (need.kind === 'dia')
    return scope.begin
      ? { template: placeholder('stepResults.conferir.dia') }
      : { initData: true, path: need.key }
  if (need.kind === 'out') {
    const step = scope.list.find((balloon) => balloon.id === need.balloon)
    return before.has(need.balloon) && step !== undefined
      ? { template: placeholder(`stepResults.${stepIdOf(step)}.${need.field}`) }
      : { initData: true, path: need.key }
  }
  return { initData: true, path: need.name }
}
