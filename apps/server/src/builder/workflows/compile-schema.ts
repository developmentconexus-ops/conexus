import type { Condition, Path } from '@conexus/hub-api'
import type { Predicate } from '@mastra/core/predicate'
import type { FieldKind, Need, Scope, TriggerShape } from './compile-refs.ts'

type JsonSchema = Record<string, unknown>
export type ObjectSchema = {
  type: 'object'
  properties: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean
}

function kindSchema(kind: FieldKind): JsonSchema {
  return { type: kind === 'number' ? 'number' : 'string' }
}

function fieldSchema(shape: TriggerShape, name: string): JsonSchema {
  return kindSchema(shape.fields[name] ?? 'text')
}

/** The input of the main workflow: the fields of the trigger. */
export function shapeSchema(shape: TriggerShape): ObjectSchema {
  const names = Object.keys(shape.fields)
  return {
    type: 'object',
    properties: Object.fromEntries(names.map((name) => [name, fieldSchema(shape, name)])),
    ...(names.length === 0 ? {} : { required: names }),
  }
}

/**
 * The input of a path: the fields of the trigger it uses with their type, and one text for each
 * output of a balloon outside it. The path of a Para cada takes one row, whose fields the Hub does not
 * know: any key is allowed, and never a bare `{ type: 'object' }`, which Mastra turns into an empty
 * item (the card's rule 7).
 */
export function pathSchema(scope: Scope, needs: readonly Need[]): ObjectSchema {
  if (scope.item) {
    return {
      type: 'object',
      properties: Object.fromEntries(needs.map((need) => [need.key, {}])),
      additionalProperties: true,
    }
  }
  const properties: Record<string, JsonSchema> = Object.fromEntries(
    needs.map((need) => [
      need.key,
      need.kind === 'field' ? fieldSchema(scope.shape, need.name) : { type: 'string' },
    ]),
  )
  const keys = needs.map((need) => need.key)
  if (scope.loop) properties.volta = { type: 'integer' }
  // The body of a Repetir gets its own output back as its next input, which holds only what the counter returns for certain: the round.
  return { type: 'object', properties, required: scope.loop ? ['volta'] : [...keys] }
}

/** The input of the path of a USE: what the balloon gives the other workflow, field by field. */
export function usedSchema(scope: Scope, keys: readonly string[]): ObjectSchema {
  return {
    type: 'object',
    properties: Object.fromEntries(keys.map((key) => [key, fieldSchema(scope.shape, key)])),
    required: [...keys],
  }
}

/** A Para cada returns the list of its bodies, so a workflow that ends in one has no object schema (the card's rule 10). */
export function outputSchemaOf(list: Path): JsonSchema {
  return list.at(-1)?.kind === 'FOREACH' ? {} : { type: 'object' }
}

/** Mastra's predicate for a field of the trigger against a number. */
export function predicateOf(condition: Condition): Predicate {
  return {
    op: condition.op,
    left: { path: `inputData.${condition.field}` },
    right: { literal: condition.than },
  }
}

/** The "senão": the same predicate negated, so exactly one of the two paths runs. */
export function negated(predicate: Predicate): Predicate {
  return { op: 'not', arg: predicate }
}

/**
 * What the body of a Repetir returns: the counter carries the input on, so the output has the
 * input's keys and the balloon's id. Mastra refuses a loop whose output cannot be the next input.
 */
export function loopOutputSchema(input: ObjectSchema): ObjectSchema {
  return {
    type: 'object',
    properties: { ...input.properties, balloon: { type: 'string' } },
    required: ['balloon', 'volta'],
  }
}
