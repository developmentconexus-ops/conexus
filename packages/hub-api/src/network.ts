import { parse } from 'tldts'
import { z } from 'zod'
import { InCompany } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'

export const NETWORK_LIMITS = { domains: 10, reason: 200 } as const

/**
 * The development list (founder, 2026-11-26, "Escolha C: a"). Exact names: a name joins only with
 * the failure that asked for it (the criterion of decision 0051).
 */
export const DEVELOPMENT_HOSTS = [
  ...['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org'],
  ...['github.com', 'codeload.github.com', 'objects.githubusercontent.com'],
  ...['deb.debian.org', 'security.debian.org'],
] as const

// The URL parser drops a default port, an empty query and a line break without a trace, so they are
// refused in the text as typed.
const MORE_THAN_A_HOST = /[\s/\\?#@:%]/

function domainOf(typed: string): string | null {
  if (MORE_THAN_A_HOST.test(typed)) return null
  const host = URL.parse(`https://${typed}`)?.hostname
  if (host === undefined) return null
  const starred = host.startsWith('*.')
  const name = starred ? host.slice(2) : host
  const listed = parse(name, { allowPrivateDomains: true })
  // `tldts` names no suffix for an IP address or for a text that is no hostname.
  if (listed.publicSuffix === null || !name.includes('.') || name.endsWith('.')) return null
  if (/(^|\.)(e2b\.(app|dev)|localhost)$/.test(name)) return null
  const starOverPublicSuffix = starred && listed.domain === null
  if (starOverPublicSuffix) return null
  return host
}

/** A domain the machines may reach: lowercase, punycode, an optional leading `*.` whose base is not a public suffix. */
export const NetworkDomain = z
  .string()
  .overwrite((typed) => domainOf(typed) ?? typed)
  .refine((domain) => domainOf(domain) === domain)
  .brand<'NetworkDomain'>()
export type NetworkDomain = z.infer<typeof NetworkDomain>

const Reason = z.string().trim().min(1).max(NETWORK_LIMITS.reason)
const TypedDomain = z.string()

export const NetworkAsked = z.object({
  domains: z.array(NetworkDomain).min(1).max(NETWORK_LIMITS.domains),
  reason: Reason,
})
export type NetworkAsked = z.infer<typeof NetworkAsked>

export const NetworkAnswer = z.object({ scope: z.enum(['CONVERSATION', 'COMPANY', 'REFUSED']) })
export type NetworkAnswer = z.infer<typeof NetworkAnswer>

const Domains = z.array(NetworkDomain)

/** What `request_network_access` answers: the model's line and the closed card read it. */
export const NetworkResult = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('OPEN'),
    domains: Domains,
    scope: z.enum(['ALREADY', 'CONVERSATION', 'COMPANY']),
  }),
  z.object({ kind: z.literal('REFUSED'), domains: Domains }),
  z.object({
    kind: z.literal('NOT_OPEN'),
    domains: Domains,
    reason: z.enum(['ROLE', 'AUTOMATION', 'MACHINE_UNAVAILABLE', 'DATABASE']),
  }),
])
export type NetworkResult = z.infer<typeof NetworkResult>

/**
 * `LIST` holds the company's and the conversation's domains; `ALL` answers while the company has the
 * whole internet on.
 */
export type NetworkOpened = { kind: 'LIST'; hosts: readonly NetworkDomain[] } | { kind: 'ALL' }

export const NetworkDomainId = z.uuid().brand<'NetworkDomainId'>()
export type NetworkDomainId = z.infer<typeof NetworkDomainId>

/**
 * A domain of the company's list. `grantedBy` is `null` when the company can no longer read that
 * person's name.
 */
export const CompanyNetworkDomain = z.object({
  id: NetworkDomainId,
  domain: NetworkDomain,
  reason: z.string(),
  grantedBy: z.string().nullable(),
  grantedAt: z.iso.datetime(),
})
export type CompanyNetworkDomain = z.infer<typeof CompanyNetworkDomain>

/**
 * The company's whole internet, turned on. `openedBy` is `null` when the company can no longer read
 * that person's name.
 */
export const CompanyNetworkOpen = z.object({
  openedBy: z.string().nullable(),
  openedAt: z.iso.datetime(),
})
export type CompanyNetworkOpen = z.infer<typeof CompanyNetworkOpen>

const DOMAINS = '/api/companies/{companyId}/network/domains'
const OPEN_ALL = '/api/companies/{companyId}/network/open-all'

const READS = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]
const WRITES = [...READS, 'NOT_IN_ROLE'] as const satisfies readonly FailureCode[]

export const listNetworkDomains = defineOperation({
  id: 'listNetworkDomains',
  summary:
    'Lists the domains every machine of the company may reach beyond the package registries, with why, who opened each and when.',
  access: 'session',
  method: 'GET',
  path: DOMAINS,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ domains: z.array(CompanyNetworkDomain) }) },
  failures: READS,
})

export const addNetworkDomain = defineOperation({
  id: 'addNetworkDomain',
  summary:
    'Opens a domain to every machine of the company; a domain already open answers its row, unchanged.',
  access: 'session',
  method: 'POST',
  path: DOMAINS,
  bodyLimit: 2 * 1024,
  input: { params: InCompany, body: z.object({ domain: TypedDomain, reason: Reason }) },
  success: { status: 200, body: CompanyNetworkDomain },
  failures: [...WRITES, 'REQUEST_MALFORMED', 'NETWORK_DOMAIN_INVALID'],
})

export const removeNetworkDomain = defineOperation({
  id: 'removeNetworkDomain',
  summary: 'Closes a domain of the company’s list.',
  access: 'session',
  method: 'DELETE',
  path: `${DOMAINS}/{domainId}`,
  bodyLimit: 1024,
  input: { params: InCompany.extend({ domainId: NetworkDomainId }) },
  success: { status: 204 },
  failures: WRITES,
})

export const readOpenAllNetwork = defineOperation({
  id: 'readOpenAllNetwork',
  summary:
    'Reads whether every machine of the company may reach any domain: who turned the whole internet on and when, or nothing while it is off.',
  access: 'session',
  method: 'GET',
  path: OPEN_ALL,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ open: CompanyNetworkOpen.nullable() }) },
  failures: READS,
})

export const openAllNetwork = defineOperation({
  id: 'openAllNetwork',
  summary:
    'Lets every machine of the company reach any domain; already on answers who turned it on, unchanged.',
  access: 'session',
  method: 'PUT',
  path: OPEN_ALL,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: CompanyNetworkOpen },
  failures: WRITES,
})

export const closeAllNetwork = defineOperation({
  id: 'closeAllNetwork',
  summary:
    'Sends every machine of the company back to its lists, whether the whole internet was on or not.',
  access: 'session',
  method: 'DELETE',
  path: OPEN_ALL,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 204 },
  failures: WRITES,
})
