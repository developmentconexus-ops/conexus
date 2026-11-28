import type { CompanyId, ConversationId, NetworkDomain, PersonId } from '@conexus/hub-api'
import {
  DEVELOPMENT_HOSTS,
  MACHINE_TOOL,
  NETWORK_LIMITS,
  NetworkAnswer,
  NetworkAsked,
  NetworkResult,
} from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import { Failure } from '../../platform/failure.ts'
import type { RunScope, Speakers } from '../spec/public.ts'
import type { NetworkStore } from './store.ts'

const CardScope = NetworkAnswer.shape.scope.exclude(['REFUSED'])
type CardScope = z.infer<typeof CardScope>

const Card = NetworkAsked.extend({ scopes: z.array(CardScope).min(1) })

const ACTION_OF = {
  CONVERSATION: 'openConversationNetwork',
  COMPANY: 'manageNetwork',
} as const satisfies Record<CardScope, string>

function networkScopes(
  identity: Pick<IdentityPorts, 'allows'>,
  role: Parameters<IdentityPorts['allows']>[0],
): CardScope[] {
  return CardScope.options.filter((scope) => identity.allows(role, ACTION_OF[scope]))
}

type Asking =
  | {
      kind: 'ASKS'
      companyId: CompanyId
      conversationId: ConversationId
      personId: PersonId
      scopes: readonly CardScope[]
    }
  | {
      kind: 'LIST_ONLY'
      companyId: CompanyId
      conversationId: ConversationId
      why: 'ROLE' | 'AUTOMATION'
    }

/** Who a run can ask: nobody in an automation's run, and nobody whose role holds no answer. */
function askingOf(run: RunScope | undefined, scopes: readonly CardScope[]): Asking {
  if (run?.conversation.kind !== 'THREAD') {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: { reason: 'NETWORK_WITHOUT_CONVERSATION' },
    })
  }
  const { companyId, personId } = run.owner
  const where = { companyId, conversationId: run.conversation.id }
  if (!run.attended) return { kind: 'LIST_ONLY', ...where, why: 'AUTOMATION' }
  if (scopes.length === 0) return { kind: 'LIST_ONLY', ...where, why: 'ROLE' }
  return { kind: 'ASKS', ...where, personId, scopes }
}

/** Who a run of the person's own can ask, their role read now. */
export async function askingByRole(
  deps: {
    identity: Pick<IdentityPorts, 'allows'>
    speakersOf(run: RunScope): Promise<Pick<Speakers, 'role'>>
  },
  run: RunScope | undefined,
): Promise<Asking> {
  if (run === undefined) return askingOf(run, [])
  return askingOf(run, networkScopes(deps.identity, (await deps.speakersOf(run)).role))
}

type Deps = {
  store: Pick<NetworkStore, 'opened' | 'grant'>
  machines: { reopen(conversationId: ConversationId): Promise<boolean> }
  /** Who the run can ask; the resume reads it again, so a role lost since the card counts. */
  asking(requestContext: RequestContext): Promise<Asking>
}

const OPENED = {
  ALREADY: 'already allowed',
  CONVERSATION: 'allowed for this conversation',
  COMPANY: 'allowed for the whole company',
} as const

const WHERE =
  'Say in one sentence that the owner or an administrator allows them in Configurações, Internet.'

const NOT_OPEN = {
  ROLE: `The person's role does not allow opening them this way. ${WHERE}`,
  AUTOMATION: `This is the run of an automation and nobody is there to allow them. ${WHERE}`,
  MACHINE_UNAVAILABLE:
    'They are allowed, but your machine did not take the change; it takes it again before a next command.',
  DATABASE: 'The list could not be read or written now; try again later.',
} as const

function lineOf(result: NetworkResult): string {
  const domains = result.domains.join(', ')
  switch (result.kind) {
    case 'OPEN':
      return `Open to your machine, ${OPENED[result.scope]}: ${domains}.`
    case 'REFUSED':
      return `The person refused, so these stay closed: ${domains}. Do not ask for them again unless the person asks.`
    case 'NOT_OPEN':
      return `Not open: ${domains}. ${NOT_OPEN[result.reason]}`
    default:
      return result satisfies never
  }
}

const DESCRIPTION = [
  'Opens domains to your machine, whose network otherwise reaches only the development list (the npm and PyPI registries, GitHub and the Debian mirrors for apt) and the domains the company or this conversation already allowed.',
  `Pass every domain you need in one call, at most ${NETWORK_LIMITS.domains}: a host name such as loja.exemplo.com.br, or *. before a domain for every name under it; never a URL, a path or a port.`,
  'Write `reason` in Brazilian Portuguese, in a few words the person reads on the card.',
  'Allowed domains open at once; a person answers a card for the others, and in an automation, or for a person whose role does not allow domains, they stay closed.',
].join(' ')

/** A name is covered by itself or by a `*.` entry above it, at any depth, as E2B matches it. */
function covered(domain: NetworkDomain, open: readonly string[]): boolean {
  return open.some(
    (each) => domain === each || (each.startsWith('*.') && domain.endsWith(each.slice(1))),
  )
}

async function unlessDatabaseDown(
  domains: NetworkDomain[],
  work: () => Promise<NetworkResult | undefined>,
): Promise<NetworkResult | undefined> {
  try {
    return await work()
  } catch (error) {
    if (!(error instanceof Failure && error.code === 'DATABASE_UNAVAILABLE')) throw error
    return { kind: 'NOT_OPEN', domains, reason: 'DATABASE' }
  }
}

async function reopened(
  machines: Deps['machines'],
  conversationId: ConversationId,
  open: Extract<NetworkResult, { kind: 'OPEN' }>,
): Promise<NetworkResult> {
  if (await machines.reopen(conversationId)) return open
  return { kind: 'NOT_OPEN', domains: open.domains, reason: 'MACHINE_UNAVAILABLE' }
}

async function answered(
  deps: Deps,
  asking: Asking,
  card: NetworkAsked,
  { scope }: NetworkAnswer,
): Promise<NetworkResult> {
  const { domains, reason } = card
  if (scope === 'REFUSED') return { kind: 'REFUSED', domains }
  if (asking.kind === 'LIST_ONLY') return { kind: 'NOT_OPEN', domains, reason: asking.why }
  if (!asking.scopes.includes(scope)) return { kind: 'NOT_OPEN', domains, reason: 'ROLE' }
  const { companyId, conversationId, personId } = asking
  try {
    await deps.store.grant({ scope, companyId, conversationId, personId, domains, reason })
  } catch (error) {
    // The role may go between the read above and the write, which reads it again and refuses.
    if (!(error instanceof Failure && error.code === 'NOT_IN_ROLE')) throw error
    return { kind: 'NOT_OPEN', domains, reason: 'ROLE' }
  }
  return reopened(deps.machines, conversationId, { kind: 'OPEN', domains, scope })
}

async function asked(
  deps: Deps,
  asking: Asking,
  { domains, reason }: NetworkAsked,
  suspend: (card: z.infer<typeof Card>) => Promise<void>,
): Promise<NetworkResult | undefined> {
  const open = await deps.store.opened(asking)
  const missing =
    open.kind === 'ALL'
      ? []
      : domains.filter((domain) => !covered(domain, [...DEVELOPMENT_HOSTS, ...open.hosts]))
  if (missing.length === 0) {
    return reopened(deps.machines, asking.conversationId, {
      kind: 'OPEN',
      domains,
      scope: 'ALREADY',
    })
  }
  if (asking.kind === 'LIST_ONLY') {
    return { kind: 'NOT_OPEN', domains: missing, reason: asking.why }
  }
  await suspend({ domains: missing, reason, scopes: [...asking.scopes] })
  return undefined
}

/**
 * `request_network_access`: what is already allowed opens at once; the rest waits on the person's
 * card (Mastra's suspend and resume), or stays closed where nobody can allow it. A `resumeData`
 * the model writes in the arguments is refused before the tool runs (`refuseUnaskedResume`).
 */
export function requestNetworkTool(deps: Deps) {
  return createTool({
    id: MACHINE_TOOL.requestNetwork,
    description: DESCRIPTION,
    inputSchema: NetworkAsked,
    suspendSchema: Card,
    resumeSchema: NetworkAnswer,
    outputSchema: NetworkResult,
    execute: async (args, { requestContext, agent }) => {
      // A resume skips the input schema (`@mastra/core@1.86.0` `tool-Z3bykc1m.js:1066-1070`).
      const request = NetworkAsked.parse(args)
      if (requestContext === undefined || agent?.suspend === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'NETWORK_WITHOUT_RUN' } })
      }
      const { resumeData, suspendPayload, suspend } = agent
      // The answer opens what the card showed, never what the arguments say.
      const card = resumeData === undefined ? undefined : NetworkAsked.parse(suspendPayload)
      const domains = [...new Set((card ?? request).domains)]
      return unlessDatabaseDown(domains, async () => {
        const asking = await deps.asking(requestContext)
        if (card !== undefined && resumeData !== undefined) {
          return answered(deps, asking, { ...card, domains }, resumeData)
        }
        return asked(deps, asking, { ...request, domains }, async (shown) => {
          await suspend(shown)
        })
      })
    },
    toModelOutput: (output) => {
      const result = NetworkResult.safeParse(output)
      return result.success ? { type: 'text', value: lineOf(result.data) } : undefined
    },
  })
}
