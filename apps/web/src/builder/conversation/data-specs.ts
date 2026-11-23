import { DATA_TOOL } from '@conexus/hub-api'
import { DatabaseIcon } from 'lucide-react'
import { LOCAL_REFUSALS, said, thrownOf } from './connector-specs.ts'
import type { ToolItem } from './rows.ts'
import { stringArg } from './tool-args.ts'
import type { Presented, ToolSpec, ToolStatus } from './tool-spec.ts'

type DataRefusal =
  | 'NOT_IN_ROLE'
  | 'TABLE_UNAVAILABLE'
  | 'CATALOG_UNAVAILABLE'
  | 'QUERY_REFUSED'
  | 'QUERY_TOO_LARGE'
  | 'DEADLINE'
  | 'NOT_IN_CATALOG'
  | 'NOT_GRANTED'

const NOT_IN_CATALOG = 'Essa tabela não está no catálogo.'
const TABLE_FAILED = 'Não conseguiu ler a tabela agora.'
const CATALOG_FAILED = 'Não conseguiu ler o catálogo agora.'

/** The words of each refusal a data tool throws; none names a role or confirms that a table exists. */
export const REFUSED_TEXT: { readonly [K in DataRefusal]: string } = {
  NOT_IN_ROLE: NOT_IN_CATALOG,
  TABLE_UNAVAILABLE: TABLE_FAILED,
  CATALOG_UNAVAILABLE: TABLE_FAILED,
  QUERY_REFUSED: 'A consulta não rodou.',
  QUERY_TOO_LARGE: 'A consulta trouxe dados demais.',
  DEADLINE: 'A consulta demorou demais.',
  NOT_IN_CATALOG,
  NOT_GRANTED: LOCAL_REFUSALS.NOT_GRANTED,
}

function isDataRefusal(kind: string): kind is DataRefusal {
  return Object.hasOwn(REFUSED_TEXT, kind)
}

type Call = Pick<ToolItem, 'args' | 'result' | 'errorText' | 'isError'>

/** What a call that failed says: its refusal's words, or `generic` when it threw something else. */
function failedSentence(tool: Call, generic: string): Presented {
  const kind = thrownOf(tool)?.kind
  return said(kind !== undefined && isDataRefusal(kind) ? REFUSED_TEXT[kind] : generic)
}

function line(sentence: string): Presented {
  return { icon: DatabaseIcon, sentence, beside: false }
}

function presentDescribe(tool: Call, status: ToolStatus): Presented {
  const table = stringArg(tool.args, 'table')
  if (status === 'error' || status === 'denied') {
    return failedSentence(tool, table === undefined ? CATALOG_FAILED : TABLE_FAILED)
  }
  const running = status === 'running'
  if (table !== undefined) return line(running ? `Vendo ${table}` : `Viu ${table}`)
  return line(running ? 'Consultando o catálogo' : 'Consultou o catálogo')
}

function presentQuery(tool: Call, status: ToolStatus): Presented {
  if (status === 'error' || status === 'denied') return failedSentence(tool, TABLE_FAILED)
  return line(status === 'running' ? 'Consultando os dados' : 'Consultou os dados')
}

export const DATA_SPECS: Record<(typeof DATA_TOOL)[keyof typeof DATA_TOOL], ToolSpec> = {
  [DATA_TOOL.describe]: {
    icon: DatabaseIcon,
    running: 'Consultando o catálogo',
    done: 'Consultou o catálogo',
    failed: CATALOG_FAILED,
    verb: 'consultou',
    body: 'generic',
    groups: true,
    present: presentDescribe,
  },
  [DATA_TOOL.query]: {
    icon: DatabaseIcon,
    running: 'Consultando os dados',
    done: 'Consultou os dados',
    failed: TABLE_FAILED,
    verb: 'consultou',
    body: 'query',
    groups: true,
    present: presentQuery,
  },
}
