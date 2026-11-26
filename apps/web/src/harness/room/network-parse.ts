import { MACHINE_TOOL, NetworkAnswer, NetworkAsked, NetworkResult } from '@conexus/hub-api'
import { z } from 'zod'
import type { Suspended } from './messages.ts'

const NETWORK_TOOL = MACHINE_TOOL.requestNetwork

const CardScope = NetworkAnswer.shape.scope.exclude(['REFUSED'])
type CardScope = z.infer<typeof CardScope>

const Suspension = NetworkAsked.extend({ scopes: z.array(CardScope).min(1) })

type NetworkEnd =
  | { state: 'conversation' | 'company' | 'refused' }
  | { state: 'not-open'; reason: Extract<NetworkResult, { kind: 'NOT_OPEN' }>['reason'] }

export type NetworkCardItem = {
  kind: 'card'
  cardKind: 'network'
  id: string
  toolCallId: string
  toolName: typeof NETWORK_TOOL
  asked: NetworkAsked | undefined
} & ({ state: 'open'; scopes: readonly CardScope[] } | NetworkEnd)

export function networkAskedOf(args: unknown): NetworkAsked | undefined {
  return NetworkAsked.safeParse(args).data
}

function cardEndOf(result: unknown): NetworkEnd | undefined {
  const said = NetworkResult.safeParse(result).data
  switch (said?.kind) {
    case undefined:
      return undefined
    case 'OPEN':
      if (said.scope === 'ALREADY') return undefined
      return { state: said.scope === 'COMPANY' ? 'company' : 'conversation' }
    case 'REFUSED':
      return { state: 'refused' }
    case 'NOT_OPEN':
      return { state: 'not-open', reason: said.reason }
    default:
      return said satisfies never
  }
}

export function networkItemOf(
  call: { toolCallId: string; toolName: string; state: string; args: unknown; result?: unknown },
  suspension: Suspended | undefined,
  at: 'open' | 'result' | 'closed' | 'none',
  stopped: boolean,
): NetworkCardItem | undefined {
  if (call.toolName !== NETWORK_TOOL) return undefined
  const card = {
    kind: 'card',
    cardKind: 'network',
    id: call.toolCallId,
    toolCallId: call.toolCallId,
    toolName: NETWORK_TOOL,
  } as const
  switch (at) {
    case 'open': {
      const waiting = Suspension.safeParse(suspension?.suspendPayload).data
      if (waiting === undefined) return undefined
      const { scopes, ...asked } = waiting
      return { ...card, state: 'open', asked, scopes }
    }
    case 'result': {
      const end = cardEndOf(call.result)
      return end === undefined ? undefined : { ...card, ...end, asked: networkAskedOf(call.args) }
    }
    case 'closed': {
      const asked = networkAskedOf(call.args)
      const denied = stopped || call.state === 'output-denied'
      return denied && asked !== undefined ? { ...card, state: 'refused', asked } : undefined
    }
    case 'none':
      return undefined
    default:
      return at satisfies never
  }
}
