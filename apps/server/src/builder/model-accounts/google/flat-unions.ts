import type { ProcessInputStepArgs } from '@mastra/core/processors'

type Schema = { [key: string]: unknown }
type Tools = NonNullable<ProcessInputStepArgs['tools']>

const JSON_SCHEMA = 'http://json-schema.org/draft-07/schema#'

function isSchema(value: unknown): value is Schema {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function propertiesOf(branch: Schema): Record<string, Schema> {
  const properties: Record<string, Schema> = {}
  if (!isSchema(branch.properties)) return properties
  for (const [name, property] of Object.entries(branch.properties)) {
    if (isSchema(property)) properties[name] = property
  }
  return properties
}

function namesOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((one) => typeof one === 'string') : []
}

/** The one value a branch fixes a property to, by `const` or by a one-value `enum`. */
function fixedOf(property: unknown): string | undefined {
  if (!isSchema(property)) return undefined
  if (typeof property.const === 'string') return property.const
  const values = property.enum
  return Array.isArray(values) && values.length === 1 && typeof values[0] === 'string'
    ? values[0]
    : undefined
}

/** The property every branch fixes to a value of its own, if there is one. */
function discriminatorOf(branches: Schema[]): string | undefined {
  const [first] = branches
  if (first === undefined || branches.length < 2) return undefined
  return Object.keys(propertiesOf(first)).find((key) => {
    const values = branches.map((branch) => fixedOf(propertiesOf(branch)[key]))
    return values.every((value) => value !== undefined) && new Set(values).size === values.length
  })
}

/** Each property said once, in the first branch's shape; `undefined` when two branches shape one differently. */
function sharedProperties(branches: Schema[], key: string): Record<string, Schema> | undefined {
  const properties: Record<string, Schema> = {}
  for (const branch of branches) {
    for (const [name, property] of Object.entries(propertiesOf(branch))) {
      if (name === key) continue
      const seen = properties[name]
      if (seen !== undefined && JSON.stringify(seen) !== JSON.stringify(property)) return undefined
      properties[name] = property
    }
  }
  return properties
}

/** Each property that not every branch has says for which values of the discriminator it is. */
function saidFor(properties: Record<string, Schema>, branches: Schema[], key: string): void {
  for (const [name, property] of Object.entries(properties)) {
    const of = branches
      .filter((branch) => name in propertiesOf(branch))
      .map((branch) => String(fixedOf(propertiesOf(branch)[key])))
    if (of.length === branches.length) continue
    const only = `Only for ${of.join(', ')}.`
    properties[name] = {
      ...property,
      description: property.description ? `${only} ${property.description}` : only,
    }
  }
}

/** The names every branch requires. */
function requiredByAll(branches: Schema[]): string[] {
  return branches
    .map((branch) => namesOf(branch.required))
    .reduce((all, each) => all.filter((name) => each.includes(name)))
}

/**
 * One object for the union: the discriminator as an `enum` of every value, each other property once,
 * required only where every branch requires it, and said for which values it is. `undefined` when
 * two branches give one property two shapes.
 */
function flatOf(branches: Schema[], key: string): Schema | undefined {
  const properties = sharedProperties(branches, key)
  if (properties === undefined) return undefined
  saidFor(properties, branches, key)
  const values = branches.map((branch) => String(fixedOf(propertiesOf(branch)[key])))
  return {
    type: 'object',
    properties: { [key]: { type: 'string', enum: values }, ...properties },
    required: requiredByAll(branches),
  }
}

/** The schema with each union of objects told apart by a fixed property made one object. */
function withFlatUnions(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(withFlatUnions)
  if (!isSchema(schema)) return schema
  const walked = Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [key, withFlatUnions(value)]),
  )
  for (const union of ['anyOf', 'oneOf'] as const) {
    const branches = walked[union]
    if (!Array.isArray(branches) || !branches.every(isSchema)) continue
    const key = discriminatorOf(branches)
    const flat = key === undefined ? undefined : flatOf(branches, key)
    if (flat === undefined) continue
    delete walked[union]
    return { ...walked, ...flat }
  }
  return walked
}

function declaredOf(tool: unknown): unknown {
  const schema = isSchema(tool) ? tool.parameters : undefined
  return isSchema(schema) && 'jsonSchema' in schema ? schema.jsonSchema : schema
}

/**
 * The step's tools for CLIProxy's Google path, which drops every `enum` and so makes the branches of
 * such a union indistinguishable: a tool whose declaration has one is declared flat. Its `execute`
 * and the validation of its own schema stay, so the input is checked and read in its own shape.
 * `undefined` when the account is not that path or no tool changes.
 */
export function forCliProxy(accountKind: string, tools: Tools | undefined): Tools | undefined {
  if (accountKind !== 'google_cliproxy' || tools === undefined) return undefined
  const flatTools: Tools = { ...tools }
  for (const [name, tool] of Object.entries(tools)) {
    const declared = declaredOf(tool)
    const flat = withFlatUnions(declared)
    if (!isSchema(flat) || JSON.stringify(flat) === JSON.stringify(declared)) continue
    flatTools[name] = Object.assign({}, tool, { parameters: { $schema: JSON_SCHEMA, ...flat } })
  }
  return Object.keys(flatTools).some((name) => flatTools[name] !== tools[name])
    ? flatTools
    : undefined
}
