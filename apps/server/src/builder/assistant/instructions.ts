import { readFileSync } from 'node:fs'
import type { Role } from '@conexus/hub-api'
import type { AgentInstructions } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import type { SessionScope } from '../../hub/connectors/public.ts'
import { Failure } from '../../platform/failure.ts'
import { turnDate } from '../conversation/public.ts'

/**
 * The fixed message, the same bytes in every conversation of every company (criterion 13a): what
 * Conexus is, shared with the units after this one (`conexus.md`), then the Assistant (`assistant.md`).
 */
const FIXED = [
  readFileSync(new URL('../conversation/prompt/conexus.md', import.meta.url), 'utf8'),
  readFileSync(new URL('./prompt/assistant.md', import.meta.url), 'utf8'),
]
  .map((text) => text.trim())
  .join('\n\n')

/** The fixed message's own cache mark: the Hub marks only the last system message (`promptCacheMiddleware`). */
const CACHED = { anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } } } as const

const ROLE_WORDS = {
  owner: 'owner',
  admin: 'administrator',
  member: 'member',
} as const satisfies Record<Role, string>

/** Who the conversation is with and where it lives, read for its turn. */
export type Speakers = {
  company: string
  person: string
  role: Role
  /** The Projeto's name in a Projeto's conversation; none on the Início. */
  projectName: string | undefined
}

/** The conversation's block: the company, the person, today, the place and the chosen connections; no rule of how to answer. */
function blockOf(
  speakers: Speakers,
  chosen: readonly { name: string; connector: string }[],
): string {
  const place =
    speakers.projectName === undefined
      ? 'Início'
      : `Projeto "${speakers.projectName}", which reads only the connections it received`
  const connections =
    chosen.length === 0
      ? 'none'
      : chosen.map((each) => `${each.name} (${each.connector})`).join(', ')
  return [
    `Company: ${speakers.company}.`,
    `Person: ${speakers.person} (${ROLE_WORDS[speakers.role]}).`,
    `Today: ${turnDate()}, America/Sao_Paulo.`,
    `Place: ${place}.`,
    `Connections in this conversation: ${connections}.`,
  ].join(' ')
}

/**
 * Two system messages (`P1`, `L1`): the fixed one with its own cache mark, then the conversation's
 * block, which the Hub marks as the last one; resolved again on each call of the agent.
 */
export function assistantInstructions(deps: {
  scopeOf: (requestContext: RequestContext) => Promise<SessionScope | undefined>
  chosenOf: (
    requestContext: RequestContext,
  ) => Promise<readonly { name: string; connector: string; chosen: boolean }[]>
  speakersOf: (scope: SessionScope) => Promise<Speakers>
}) {
  return async ({ requestContext }: { requestContext: RequestContext }) => {
    const scope = await deps.scopeOf(requestContext)
    if (scope === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'PROMPT_WITHOUT_CONVERSATION' },
      })
    }
    const [speakers, offered] = await Promise.all([
      deps.speakersOf(scope),
      deps.chosenOf(requestContext),
    ])
    const chosen = offered.filter((each) => each.chosen)
    return [
      { role: 'system', content: FIXED, providerOptions: CACHED },
      { role: 'system', content: blockOf(speakers, chosen) },
    ] satisfies AgentInstructions
  }
}
