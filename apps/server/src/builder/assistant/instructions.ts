import { readFileSync } from 'node:fs'
import type { FixedRole, Role } from '@conexus/hub-api'
import { fixedNameOf } from '@conexus/hub-api'
import type { AgentInstructions } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { Failure } from '../../platform/failure.ts'
import { fixedSystem, TITLE } from '../controller-kit/public.ts'
import { turnDate } from '../conversation/public.ts'

/**
 * The Assistant's observer: the conversation's title and what a business conversation keeps, never
 * the task list, which the signals rebuild at each step (card of the alignment, U4).
 */
export const ASSISTANT_OBSERVER = `${TITLE.ask.observer} Observe as a business analyst: keep numbers with where they came from (which connection, which read, which file), the codes and meanings the person taught, the filters and periods asked, the files made or received and what they hold, and what was handed to the Builder. Do not observe \`<current-task-list>\` or \`<task-list-update>\`; they are rebuilt.`

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

const ROLE_WORDS = {
  owner: 'owner',
  admin: 'administrator',
  developer: 'developer',
  member: 'member',
} as const satisfies Record<FixedRole, string>

function roleWord(role: Role): string {
  const fixed = fixedNameOf(role)
  return fixed === undefined ? role : ROLE_WORDS[fixed]
}

/** Who the conversation is with and where it lives, read for its turn. */
export type Speakers = {
  company: string
  person: string
  role: Role
  /** What the person wrote of their work in the company; `null` while they wrote nothing. */
  jobTitle: string | null
  department: string | null
  /** The Projeto's name in a Projeto's conversation; none on the Início. */
  projectName: string | undefined
}

/**
 * What the person's role and the run allow of the tools that depend on them, read once per run by
 * the one that builds the tools: the block says in words what the tools leave out.
 */
export type Mays = {
  note: boolean
  automate: boolean
  byAutomation: boolean
  companyMemory: boolean
}

const NO_NOTE =
  'You cannot note on a connection here: write the concept, the mapping and the query, ready for an owner or an administrator to note, and say that you did not note it.'
const NO_AUTOMATION =
  "The person's role does not create automations: when what they ask repeats at a time, say in text that only the owner, the administrators and the developers create them and that the person can ask one of them, and offer no card."
const NO_COMPANY_MEMORY =
  'You cannot save company memory here: propose it with propose_company_memory and say that only an owner or an administrator saves it, with the Save button of the card.'
const AUTOMATION_RUN =
  'This conversation is the run of an automation the person already created and nobody is waiting: do what the message asks and answer with the result, and never offer to create that automation again.'

/** The sentences of the tools this run lacks, so the fixed message stays the same for everyone. */
function toolSentences(may: Mays): string[] {
  return [
    ...(may.note ? [] : [NO_NOTE]),
    ...(may.automate ? [] : [NO_AUTOMATION]),
    ...(may.companyMemory ? [] : [NO_COMPANY_MEMORY]),
    ...(may.byAutomation ? [AUTOMATION_RUN] : []),
  ]
}

/** The weekday in English with the date, as Sao Paulo counts it: the model reads the date, not the calendar. */
function dated(): string {
  const date = turnDate()
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  )
  return `${date} (${weekday})`
}

/** What the person wrote of their work, "<job title>, <department>" or the one they wrote. */
function workOf(speakers: Pick<Speakers, 'jobTitle' | 'department'>): string {
  return [speakers.jobTitle, speakers.department].filter((part) => part !== null).join(', ')
}

/**
 * The conversation's block: the company, the person, today, the place and the chosen connections,
 * and what the tools this run lacks leave unsaid; no other rule of how to answer. `may` is the
 * Assistant's: the agents and the Construtor have no such tools.
 */
export function blockOf(
  speakers: Speakers,
  chosen: readonly { name: string; connector: string }[],
  may?: Mays,
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
    `Person: ${speakers.person} (${[roleWord(speakers.role), workOf(speakers)].filter(Boolean).join('; ')}).`,
    `Today: ${dated()}, America/Sao_Paulo.`,
    `Place: ${place}.`,
    `Connections in this conversation: ${connections}.`,
    ...(may === undefined ? [] : toolSentences(may)),
  ].join(' ')
}

/**
 * Two system messages (`P1`, `L1`): the fixed one with its own cache mark, then the conversation's
 * block, which the Hub marks as the last one; resolved again on each call of the agent.
 */
export function assistantInstructions(deps: {
  offeredOf: (
    requestContext: RequestContext,
  ) => Promise<readonly { name: string; connector: string; chosen: boolean }[]>
  speakersOf: (requestContext: RequestContext) => Promise<Speakers | undefined>
  maysOf: (requestContext: RequestContext) => Promise<Mays>
}) {
  return async ({ requestContext }: { requestContext: RequestContext }) => {
    const [speakers, offered, may] = await Promise.all([
      deps.speakersOf(requestContext),
      deps.offeredOf(requestContext),
      deps.maysOf(requestContext),
    ])
    if (speakers === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'PROMPT_WITHOUT_CONVERSATION' },
      })
    }
    const chosen = offered.filter((each) => each.chosen)
    return [
      fixedSystem(FIXED),
      { role: 'system', content: blockOf(speakers, chosen, may) },
    ] satisfies AgentInstructions
  }
}
