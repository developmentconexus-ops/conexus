import type { Statement } from './policies.ts'
import { ACCOUNT, actionsOf, REGION, resourcesOf } from './policies.ts'

/** What a call carries that the policies of this package read. */
export type Call = {
  action: string
  resource: string
  principalArn: string
  principalTags: Record<string, string>
  requestTags: Record<string, string>
  /** The service's own condition keys, such as the area an S3 Tables call names. */
  context?: Record<string, string> | undefined
}

/**
 * How IAM decides a call in one account, reduced to the condition operators these policies use.
 * A role's trust that names the caller's role ARN is enough on its own; a trust that names the
 * account also needs the caller's own policy to allow the call (IAM user guide, "Policy
 * evaluation logic", the same-account case; AWS Security Blog, "Announcing an update to IAM role
 * trust policy behavior").
 */
export function mayAssume(trust: Statement[], identity: Statement[], call: Call): boolean {
  if (matching(trust, call, 'Deny').length > 0 || matching(identity, call, 'Deny').length > 0) {
    return false
  }
  const trusted = matching(trust, call, 'Allow')
  if (trusted.some((statement) => namesThe(statement, call.principalArn))) return true
  return trusted.length > 0 && matching(identity, call, 'Allow').length > 0
}

export function allows(identity: Statement[], call: Call): boolean {
  return (
    matching(identity, call, 'Deny').length === 0 && matching(identity, call, 'Allow').length > 0
  )
}

/**
 * Glue asks for the action on the table and on each of its ancestors (AWS Glue guide, "Specifying
 * AWS Glue resource ARNs"). Answers the resources of that chain the policy refuses `action` on.
 */
export function refusedGlueResources(
  identity: Statement[],
  of: Readonly<{ action: string; bucket: string; area: string }>,
): string[] {
  const child = `s3tablescatalog/${of.bucket}`
  return [
    'catalog',
    'catalog/s3tablescatalog',
    `catalog/${child}`,
    `database/${child}/${of.area}`,
    `table/${child}/${of.area}/notas`,
  ]
    .map((resource) => `arn:aws:glue:${REGION}:${ACCOUNT}:${resource}`)
    .filter((resource) => !allows(identity, asked(of.action, resource)))
}

/** A call of a role's own, with no session tag: what its policies and its boundary decide. */
export function asked(action: string, resource: string, principalArn = ''): Call {
  return { action, resource, principalArn, principalTags: {}, requestTags: {} }
}

/** A role holds a call only where its own policy and its boundary both allow it. */
export function allowsWithin(identity: Statement[], boundary: Statement[], call: Call): boolean {
  return allows(identity, call) && allows(boundary, call)
}

function matching(statements: Statement[], call: Call, effect: 'Allow' | 'Deny'): Statement[] {
  return statements.filter(
    (statement) =>
      statement.Effect === effect &&
      actionsOf(statement).some((action) => glob(action, call.action)) &&
      (statement.Resource === undefined ||
        resourcesOf(statement).some((resource) => glob(resource, call.resource))) &&
      Object.entries(statement.Condition ?? {}).every(([operator, keys]) =>
        Object.entries(keys).every(([key, expected]) =>
          holds(operator, valuesOf(key, call), expected),
        ),
      ),
  )
}

function namesThe(statement: Statement, principalArn: string): boolean {
  const principal = statement.Principal?.AWS
  return [principal ?? []].flat().includes(principalArn)
}

function valuesOf(key: string, call: Call): string[] | undefined {
  if (key === 'aws:PrincipalArn') return [call.principalArn]
  const own = call.context?.[key]
  if (own !== undefined) return [own]
  if (key === 'aws:TagKeys') {
    const keys = Object.keys(call.requestTags)
    return keys.length > 0 ? keys : undefined
  }
  const [scope, tag = ''] = key.split('/')
  const tags =
    scope === 'aws:PrincipalTag'
      ? call.principalTags
      : scope === 'aws:RequestTag'
        ? call.requestTags
        : {}
  const value = tags[tag]
  return value === undefined ? undefined : [value]
}

function holds(
  operator: string,
  actual: string[] | undefined,
  expected: string | string[],
): boolean {
  const wanted = [expected].flat()
  if (operator === 'Null') return (actual === undefined) === (wanted[0] === 'true')
  if (operator === 'ForAllValues:StringEquals') {
    return (actual ?? []).every((value) => wanted.includes(value))
  }
  // A negated operator holds when its key is absent, and with several values only when none matches.
  if (actual === undefined) return operator.includes('Not')
  if (operator === 'StringEquals' || operator === 'ArnEquals') {
    return actual.some((value) => wanted.includes(value))
  }
  const like = actual.some((value) => wanted.some((pattern) => glob(pattern, value)))
  if (operator === 'StringLike' || operator === 'ArnLike') return like
  if (operator === 'StringNotLike' || operator === 'ArnNotLike') return !like
  if (operator === 'ArnNotEquals') return !actual.some((value) => wanted.includes(value))
  throw new Error(`the model does not read ${operator}`)
}

function glob(pattern: string, value: string): boolean {
  const source = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replaceAll('*', '.*')
    .replaceAll('?', '.')
  return new RegExp(`^${source}$`).test(value)
}
