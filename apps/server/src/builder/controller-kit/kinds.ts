import type { CompanyId as CompanyIdType, PersonId as PersonIdType } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER, BUILDER_CONTROLLER, CompanyId, PersonId } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'

/**
 * Each conversation controller: its key in Mastra (`/agent-controller/<id>/…`) and the prefix of
 * the resource its threads are kept under. The owners of today do not change: the Builder's is
 * `company:<c>:person:<p>`, the Assistant's `assistant:company:<c>:person:<p>`.
 */
export const CONTROLLER_KINDS = {
  builder: { id: BUILDER_CONTROLLER, prefix: '' },
  assistant: { id: ASSISTANT_CONTROLLER, prefix: 'assistant:' },
} as const satisfies Record<string, { id: string; prefix: string }>

export type ControllerKind = keyof typeof CONTROLLER_KINDS
export type Owner = { companyId: CompanyIdType; personId: PersonIdType }
/** Which controller's a thread is, by the resource it is kept under (C21). */
export type ResourceOwner = Owner & { kind: ControllerKind }

const KINDS = Object.keys(CONTROLLER_KINDS).filter((key): key is ControllerKind =>
  Object.hasOwn(CONTROLLER_KINDS, key),
)
const PREFIXES = KINDS.map((kind) => CONTROLLER_KINDS[kind].prefix)

// A prefix that begins another would read one controller's thread as the other's. The Builder's
// empty one is the exception: every owner's rest begins with `company:`, which no prefix does.
for (const prefix of PREFIXES) {
  const begins = PREFIXES.some(
    (other) => other !== prefix && prefix !== '' && other.startsWith(prefix),
  )
  if (begins || prefix.startsWith('company:')) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CONTROLLER_PREFIX_AMBIGUOUS' } })
  }
}

const escaped = [...PREFIXES]
  .sort((a, b) => b.length - a.length)
  .map((prefix) => prefix.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&'))
const RESOURCE = new RegExp(
  `^(?<prefix>${escaped.join('|')})company:(?<companyId>[^:]+):person:(?<personId>[^:]+)$`,
)
const OwnerSchema = z.object({ companyId: CompanyId, personId: PersonId })

/** The resource Mastra keeps a conversation of this controller under: the company with the person. */
export function resourceOf(kind: ControllerKind, owner: Owner): string {
  return `${CONTROLLER_KINDS[kind].prefix}company:${owner.companyId}:person:${owner.personId}`
}

/** Whose a thread is, and of which controller, from the resource Mastra keeps it under, or none. */
export function ownerOfResource(resourceId: unknown): ResourceOwner | undefined {
  const groups = typeof resourceId === 'string' ? RESOURCE.exec(resourceId)?.groups : undefined
  const owner = OwnerSchema.safeParse(groups)
  const kind = KINDS.find((each) => CONTROLLER_KINDS[each].prefix === groups?.prefix)
  if (!owner.success || kind === undefined) return undefined
  return { kind, ...owner.data }
}
