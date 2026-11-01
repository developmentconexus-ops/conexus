import { BUILDER_TOOL, ReadBusy, ReadCut, ReadRows } from '@conexus/hub-api'
import { CircleAlertIcon, DatabaseIcon, NotebookPenIcon, NotebookTextIcon } from 'lucide-react'
import { z } from 'zod'
import type { ToolItem } from './rows.ts'
import { stringArg } from './tool-args.ts'
import type { ConnectorWords, Presented, Refusal, ToolSpec, ToolStatus } from './tool-spec.ts'

const { connectorRead, connectorNotes, connectorNoteSave } = BUILDER_TOOL

/** The rows of the tools of a Projeto's granted connections (card of step 20, U5). */
export const CONNECTOR_SPECS: Record<
  typeof connectorRead | typeof connectorNotes | typeof connectorNoteSave,
  ToolSpec
> = {
  [connectorRead]: {
    icon: DatabaseIcon,
    running: 'Lendo um sistema da empresa',
    done: 'Leu um sistema da empresa',
    failed: 'Não conseguiu ler o sistema da empresa',
    verb: 'leu sistema',
    body: 'generic',
    groups: true,
  },
  [connectorNotes]: {
    icon: NotebookTextIcon,
    running: 'Relendo o caderno do sistema',
    done: 'Releu o caderno do sistema',
    failed: 'Não conseguiu reler o caderno',
    verb: 'releu caderno',
    body: 'generic',
    groups: true,
  },
  [connectorNoteSave]: {
    icon: NotebookPenIcon,
    running: 'Anotando no caderno do sistema',
    done: 'Anotou no caderno do sistema',
    failed: 'Não conseguiu anotar no caderno',
    verb: 'anotou',
    body: 'generic',
    groups: true,
  },
}

/** Why a read brought nothing: what the connection or the Hub's limits said. */
type Refused = 'BUSY' | 'UNREACHABLE' | 'DEADLINE' | 'CALLS_SPENT' | 'NOT_GRANTED' | 'OTHER'

/** What a read answered, as the Assistant's row says it: the rows it brought, or why it brought none. */
type ReadOutcome =
  | { kind: 'ROWS'; rows: number; complete: boolean }
  /** Read, with no count to say: the value is no list, or the cut left no row of one. */
  | { kind: 'READ' }
  | { kind: 'EMPTY' }
  | { kind: 'REAUTH' }
  | { kind: 'REFUSED'; why: Refused; waitMs: number | null }

const TOOL_FAILED = 'Não conseguiu ler o sistema da empresa.'

/** The words of a room that has read no catalog and draws no conversation: ids for names, the plain failure for refusals. */
export const PLAIN_WORDS: ConnectorWords = {
  name: (connector) => connector,
  refusal: () => TOOL_FAILED,
}

/** The refusals that are the Hub's own, not a connection's: the connection's are said by its words. */
const LOCAL_REFUSALS = {
  DEADLINE: 'O sistema demorou demais para responder.',
  CALLS_SPENT: 'Esta resposta já usou as 50 leituras que cabem em uma resposta.',
  NOT_GRANTED: 'Esta ligação não está disponível nesta conversa.',
} as const

const Kind = z.object({ kind: z.string() })
const REFUSED: readonly string[] = ['BUSY', 'UNREACHABLE', 'DEADLINE', 'CALLS_SPENT', 'NOT_GRANTED']

function isRefused(kind: string): kind is Refused {
  return REFUSED.includes(kind)
}

/** What a read that was done says: its rows when it is a list, nothing of a count when it is not. */
function doneOutcome(cut: ReadCut): ReadOutcome {
  if (cut.empty === true) return { kind: 'EMPTY' }
  const rows = ReadRows.safeParse(cut.value)
  if (!rows.success) return { kind: 'READ' }
  const count = rows.data.linhas.length
  // No row of a list the cut emptied is not "no row": a row passed the bytes the model reads.
  if (count === 0) return cut.complete === false ? { kind: 'READ' } : { kind: 'EMPTY' }
  return { kind: 'ROWS', rows: count, complete: cut.complete !== false }
}

/** The answer of a `connector_read`, from the result Mastra stored; none while the call has no result. */
function readOutcome(result: unknown): ReadOutcome | undefined {
  const kind = Kind.safeParse(result)
  if (!kind.success) return undefined
  const cut = ReadCut.safeParse(result)
  if (cut.success) return doneOutcome(cut.data)
  if (kind.data.kind === 'AUTH_REFUSED') return { kind: 'REAUTH' }
  const busy = ReadBusy.safeParse(result)
  const why = isRefused(kind.data.kind) ? kind.data.kind : 'OTHER'
  return { kind: 'REFUSED', why, waitMs: busy.success ? busy.data.waitMs : null }
}

/** A read the connection refused, or asked to be linked again: the Assistant's row says it. */
export function readRefusal(result: unknown): Refusal | undefined {
  const kind = readOutcome(result)?.kind
  if (kind === 'REAUTH') return 'RECONNECT'
  return kind === 'REFUSED' ? 'SAID' : undefined
}

/** The connector a read's operation names ("sankhya.consultar" is Sankhya's). */
function connectorOf(args: unknown): string | undefined {
  return stringArg(args, 'operation')?.split('.')[0]
}

function rowsText(outcome: ReadOutcome | undefined): string | undefined {
  if (outcome?.kind === 'ROWS') {
    const count = `${outcome.rows} ${outcome.rows === 1 ? 'linha' : 'linhas'}`
    return outcome.complete ? count : `${count}, há mais`
  }
  return outcome?.kind === 'EMPTY' ? 'Nenhuma linha.' : undefined
}

/** The sentence of a refusal: the connections' own words (the Integrações screen's) or the Hub's. */
function refusedSentence(
  outcome: Extract<ReadOutcome, { kind: 'REFUSED' }>,
  connector: string | undefined,
  words: ConnectorWords,
): string {
  switch (outcome.why) {
    case 'BUSY':
      return words.refusal(connector, { kind: 'BUSY', waitMs: outcome.waitMs })
    case 'UNREACHABLE':
      return words.refusal(connector, { kind: 'UNREACHABLE' })
    case 'OTHER':
      return TOOL_FAILED
    default:
      return LOCAL_REFUSALS[outcome.why]
  }
}

function said(sentence: string): Presented {
  return { icon: CircleAlertIcon, sentence, detail: undefined, beside: false }
}

/** The sentence of an Assistant's read: "Lendo Sankhya · Matriz" while it runs, "Leu …" after. */
export function presentRead(
  tool: Pick<ToolItem, 'args' | 'result'>,
  status: ToolStatus,
  words: ConnectorWords,
): Presented {
  const connector = connectorOf(tool.args)
  const connection = stringArg(tool.args, 'connection')
  const named =
    connector === undefined || connection === undefined
      ? 'um sistema da empresa'
      : `${words.name(connector)} · ${connection}`
  const outcome = readOutcome(tool.result)
  if (outcome?.kind === 'REAUTH') return said(words.refusal(connector, { kind: 'REAUTH' }))
  if (outcome?.kind === 'REFUSED') {
    return said(refusedSentence(outcome, connector, words))
  }
  if (status === 'error' || status === 'denied') return said(TOOL_FAILED)
  const detail = rowsText(outcome)
  return {
    icon: CONNECTOR_SPECS[BUILDER_TOOL.connectorRead].icon,
    sentence: status === 'running' ? `Lendo ${named}` : `Leu ${named}`,
    detail,
    beside: status !== 'running' && detail !== undefined,
  }
}
