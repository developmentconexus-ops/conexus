import { BUILDER_TOOL } from '@conexus/hub-api'
import { CircleAlertIcon, DatabaseIcon, NotebookPenIcon, NotebookTextIcon } from 'lucide-react'
import { z } from 'zod'
import type { Room } from './room.ts'
import type { ToolItem } from './rows.ts'
import { stringArg } from './tool-args.ts'
import type { ToolSpec } from './tool-spec.ts'

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

/** What a read answered, as the Assistant's row says it: the rows it brought, or why it brought none. */
export type ReadOutcome =
  | { kind: 'ROWS'; rows: number; complete: boolean }
  | { kind: 'EMPTY' }
  | { kind: 'REAUTH' }
  | { kind: 'REFUSED'; sentence: string }

const TOOL_FAILED = 'Não conseguiu ler o sistema da empresa.'

const REFUSALS = {
  BUSY: 'O sistema pediu para esperar. Tente de novo em instantes.',
  UNREACHABLE: 'Não foi possível falar com o sistema agora.',
  DEADLINE: 'O sistema demorou demais para responder.',
  CALLS_SPENT: 'Esta resposta já usou as 50 leituras que cabem em uma resposta.',
  NOT_GRANTED: 'Esta ligação não está disponível nesta conversa.',
} as const

function isRefusal(kind: string): kind is keyof typeof REFUSALS {
  return Object.hasOwn(REFUSALS, kind)
}

const Cut = z.object({
  kind: z.literal('OK'),
  value: z
    .looseObject({ linhas: z.array(z.unknown()) })
    .nullable()
    .optional(),
  complete: z.boolean().optional(),
  empty: z.boolean().optional(),
})
const Kind = z.object({ kind: z.string() })

/** The answer of a `connector_read`, from the result Mastra stored; none while the call has no result. */
export function readOutcome(result: unknown): ReadOutcome | undefined {
  const kind = Kind.safeParse(result)
  if (!kind.success) return undefined
  const cut = Cut.safeParse(result)
  if (cut.success) {
    const rows = cut.data.value?.linhas.length ?? 0
    return rows === 0 || cut.data.empty === true
      ? { kind: 'EMPTY' }
      : { kind: 'ROWS', rows, complete: cut.data.complete !== false }
  }
  if (kind.data.kind === 'AUTH_REFUSED') return { kind: 'REAUTH' }
  const refused = kind.data.kind
  return { kind: 'REFUSED', sentence: isRefusal(refused) ? REFUSALS[refused] : TOOL_FAILED }
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

/** The sentence of an Assistant's read: "Lendo Sankhya · Matriz" while it runs, "Leu …" after. */
export function presentRead(
  tool: Pick<ToolItem, 'args' | 'result'>,
  status: 'running' | 'done' | 'error' | 'denied',
  room: Room,
) {
  const connector = connectorOf(tool.args)
  const connection = stringArg(tool.args, 'connection')
  const named =
    connector === undefined || connection === undefined
      ? 'um sistema da empresa'
      : `${room.connectorName(connector)} · ${connection}`
  const outcome = readOutcome(tool.result)
  const refused = status === 'error' || status === 'denied' || outcome?.kind === 'REFUSED'
  if (outcome?.kind === 'REAUTH')
    return {
      icon: CircleAlertIcon,
      sentence: `O ${connector === undefined ? 'sistema' : room.connectorName(connector)} pediu para conectar de novo.`,
      detail: undefined,
      beside: false,
    }
  if (refused)
    return {
      icon: CircleAlertIcon,
      sentence: outcome?.kind === 'REFUSED' ? outcome.sentence : TOOL_FAILED,
      detail: undefined,
      beside: false,
    }
  return {
    icon: CONNECTOR_SPECS[BUILDER_TOOL.connectorRead].icon,
    sentence: status === 'running' ? `Lendo ${named}` : `Leu ${named}`,
    detail: rowsText(outcome),
    beside: status !== 'running' && outcome !== undefined,
  }
}
