import type { TableRef } from '@conexus/hub-api'
import type { ModelName } from './treat-task.ts'
import { modelNameOf } from './treat-task.ts'

/** The company's models in the run's order, each with the tables its SQL reads. */
export type ModelGraph = readonly Readonly<{ name: ModelName; inputs: readonly TableRef[] }>[]

/** How each model last ended in the company's current lake; a model with no entry was never built there. */
export type LastStatus = ReadonlyMap<ModelName, 'BUILT' | 'FAILED' | 'SKIPPED'>

function downstreamOf(
  graph: ModelGraph,
  tables: ReadonlySet<string>,
  starts: (name: ModelName) => boolean = () => false,
): ReadonlySet<string> {
  const found = new Set<string>()
  for (let grew = true; grew; ) {
    grew = false
    for (const { name, inputs } of graph) {
      if (found.has(name)) continue
      const reads = inputs.some(({ layer, table }) => {
        const input = modelNameOf(layer, table)
        return tables.has(input) || found.has(input)
      })
      if (!reads && !starts(name)) continue
      found.add(name)
      grew = true
    }
  }
  return found
}

function namesOf(tables: readonly TableRef[]): ReadonlySet<string> {
  return new Set(tables.map(({ layer, table }) => modelNameOf(layer, table)))
}

export function awaitingFirstCopy(
  graph: ModelGraph,
  uncopied: readonly TableRef[],
): ReadonlySet<string> {
  return downstreamOf(graph, namesOf(uncopied))
}

/**
 * The models a run asks for: those that read a changed table, those not built last time (never
 * built, failed or skipped) and every model below one of them. A copy joins the ones not built only
 * when it touches some model's input (card criterion 26); none when nothing is to treat.
 */
export function selection(
  graph: ModelGraph,
  changed: readonly TableRef[],
  last: LastStatus,
): readonly ModelName[] {
  const touched = namesOf(changed)
  const reads = graph.some(({ inputs }) =>
    inputs.some(({ layer, table }) => touched.has(modelNameOf(layer, table))),
  )
  if (!reads) return []
  const chosen = downstreamOf(graph, touched, (name) => last.get(name) !== 'BUILT')
  return graph.filter(({ name }) => chosen.has(name)).map(({ name }) => name)
}
