import type { FixedRole, NetworkAnswer, Role } from '@conexus/hub-api'
import { fixedNameOf } from '@conexus/hub-api'

/** Today as `YYYY-MM-DD` in `America/Sao_Paulo` (Conexus OS `e0353c36` `harness/prompt.ts:91-92`). */
export function turnDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now)
}

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
 * the one that builds the tools.
 */
export type Mays = {
  note: boolean
  automate: boolean
  byAutomation: boolean
  companyMemory: boolean
  /** The answers the person's role allows on a domain's card; none in an automation's run. */
  network: readonly Exclude<NetworkAnswer['scope'], 'REFUSED'>[]
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
 * Assistant's alone.
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
