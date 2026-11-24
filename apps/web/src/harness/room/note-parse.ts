import { BUILDER_TOOL } from '@conexus/hub-api'
import { z } from 'zod'
import type { Suspended } from './messages.ts'

const NOTE_SAVE_TOOL = BUILDER_TOOL.connectorNoteSave

/** What the notebook's save asks, as the call says it and as it suspends: what the card lists. */
const NoteAsked = z.looseObject({
  connection: z.string(),
  concept: z.string(),
  mapping: z.string(),
  provingQuery: z.string(),
})
export type NoteAsked = z.infer<typeof NoteAsked>

function parseNoteAsked(input: unknown): NoteAsked | undefined {
  return NoteAsked.safeParse(input).data
}

/** What the card answers: the person's yes or no. */
export type NoteResume = { approved: boolean }

const Result = z.looseObject({ kind: z.string() })

/** How a call the person answered ended, as the notebook's save said it; none for a result the card does not tell (the schema's refusal, a spent turn). */
function noteEndOf(result: unknown): 'saved' | 'declined' | 'refused' | undefined {
  switch (Result.safeParse(result).data?.kind) {
    case 'SAVED':
      return 'saved'
    case 'NOT_SAVED':
      return 'declined'
    case 'NOT_GRANTED':
      return 'refused'
    default:
      return undefined
  }
}

/** The notebook's save, parked on the person's yes (U19): what it asks, and how it ended. */
export type NoteCardItem = {
  kind: 'card'
  cardKind: 'note'
  id: string
  toolCallId: string
  toolName: typeof NOTE_SAVE_TOOL
  state: 'open' | 'saved' | 'declined' | 'refused'
  asked: NoteAsked | undefined
}

/**
 * The card of the notebook's save: open while the call waits, how the notebook ended it once the
 * person answered, declined when the stop closed it. None for a call that never asked or that
 * failed, which stays a row.
 */
export function noteItemOf(
  call: { toolCallId: string; toolName: string; args: unknown; result?: unknown },
  suspension: Suspended | undefined,
  at: 'open' | 'result' | 'closed' | 'none',
  stopped: boolean,
): NoteCardItem | undefined {
  const state = call.toolName === NOTE_SAVE_TOOL ? stateOf(call.result, at, stopped) : undefined
  if (state === undefined) return undefined
  return {
    kind: 'card',
    cardKind: 'note',
    id: call.toolCallId,
    toolCallId: call.toolCallId,
    toolName: NOTE_SAVE_TOOL,
    state,
    asked: parseNoteAsked(suspension === undefined ? call.args : suspension.suspendPayload),
  }
}

function stateOf(
  result: unknown,
  at: 'open' | 'result' | 'closed' | 'none',
  stopped: boolean,
): NoteCardItem['state'] | undefined {
  switch (at) {
    case 'open':
      return 'open'
    case 'result':
      return noteEndOf(result)
    case 'closed':
      return stopped ? 'declined' : undefined
    case 'none':
      return undefined
    default:
      return at satisfies never
  }
}
