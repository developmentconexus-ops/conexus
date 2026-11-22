import { Template } from 'aws-cdk-lib/assertions'
import { z } from 'zod'
import { conexusApp } from '../lib/app.ts'

export const ACCOUNT = '111122223333'
export const REGION = 'us-east-2'

const Strings = z.union([z.string(), z.array(z.string())])
const Statement = z.object({
  Sid: z.string().optional(),
  Effect: z.enum(['Allow', 'Deny']),
  Action: Strings,
  Resource: Strings.optional(),
  Principal: z.record(z.string(), Strings).optional(),
  Condition: z.record(z.string(), z.record(z.string(), Strings)).optional(),
})
export type Statement = z.infer<typeof Statement>
const Document = z.object({ Statement: z.array(Statement) })
const Resource = z.object({
  Type: z.string(),
  Properties: z.record(z.string(), z.unknown()),
  DeletionPolicy: z.string().optional(),
  DependsOn: z.array(z.string()).optional(),
})
type Resource = z.infer<typeof Resource>
const Resources = z.record(z.string(), Resource)
type Resources = z.infer<typeof Resources>

const PSEUDO = new Map([
  ['AWS::Partition', 'aws'],
  ['AWS::AccountId', ACCOUNT],
  ['AWS::Region', REGION],
])
const Ref = z.object({ Ref: z.string() }).strict()
const GetAtt = z.object({ 'Fn::GetAtt': z.tuple([z.string(), z.string()]) }).strict()
const Join = z.object({ 'Fn::Join': z.tuple([z.string(), z.array(z.unknown())]) }).strict()

/**
 * A template's resources with their intrinsics read as plain text, so a test compares policies as
 * IAM will read them: pseudo parameters take the invented account and region, a `Ref` reads
 * `{Name}` and an attribute `<Name.Attribute>`, a logical id's hash dropped.
 */
export function readableResources(template: unknown): Resources {
  return Resources.parse(resolve(z.object({ Resources: z.unknown() }).parse(template).Resources))
}

export function readable(stack: 'preparation' | 'platform' | 'lake'): Resources {
  return readableResources(Template.fromStack(conexusApp()[stack]).toJSON())
}

/** A stack's outputs, read as `readableResources` reads resources. */
export function readableOutputs(stack: 'platform' | 'lake'): Record<string, string> {
  const { Outputs } = z
    .object({ Outputs: z.record(z.string(), z.unknown()) })
    .parse(Template.fromStack(conexusApp()[stack]).toJSON())
  return z
    .record(
      z.string(),
      z.object({ Value: z.string() }).transform((output) => output.Value),
    )
    .parse(resolve(Outputs))
}

function resolve(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(resolve)
  if (value === null || typeof value !== 'object') return value
  const ref = Ref.safeParse(value)
  if (ref.success) return PSEUDO.get(ref.data.Ref) ?? `{${withoutHash(ref.data.Ref)}}`
  const attribute = GetAtt.safeParse(value)
  if (attribute.success) {
    const [id, name] = attribute.data['Fn::GetAtt']
    return `<${withoutHash(id)}.${name}>`
  }
  const join = Join.safeParse(value)
  if (join.success) {
    const [separator, parts] = join.data['Fn::Join']
    return parts.map(resolve).join(separator)
  }
  return Object.fromEntries(Object.entries(value).map(([name, inner]) => [name, resolve(inner)]))
}

function withoutHash(logicalId: string): string {
  return logicalId.replace(/[0-9A-F]{8}$/, '')
}

/** The one resource whose logical id, its hash dropped, is `id`. */
export function find(resources: Resources, id: string): Resource {
  const found = Object.entries(resources).filter(([name]) => withoutHash(name) === id)
  const [only] = found
  if (found.length !== 1 || !only) throw new Error(`${found.length} resources named ${id}`)
  return only[1]
}

/** Every statement of a role's inline policies, or of a managed or bucket policy. */
export function statementsOf(resource: Resource): Statement[] {
  const { PolicyDocument, Policies = [] } = z
    .object({
      PolicyDocument: Document.optional(),
      Policies: z.array(z.object({ PolicyDocument: Document })).optional(),
    })
    .parse(resource.Properties)
  const documents = PolicyDocument
    ? [PolicyDocument]
    : Policies.map((policy) => policy.PolicyDocument)
  return documents.flatMap((document) => document.Statement)
}

export function trustOf(resource: Resource): Statement[] {
  return z.object({ AssumeRolePolicyDocument: Document }).parse(resource.Properties)
    .AssumeRolePolicyDocument.Statement
}

export function actionsOf(statement: Statement): string[] {
  return typeof statement.Action === 'string' ? [statement.Action] : statement.Action
}

export function resourcesOf(statement: Statement): string[] {
  const resource = statement.Resource ?? []
  return typeof resource === 'string' ? [resource] : resource
}

export function bySid(statements: Statement[], sid: string): Statement {
  const found = statements.find((statement) => statement.Sid === sid)
  if (!found) throw new Error(`no statement ${sid}`)
  return found
}
