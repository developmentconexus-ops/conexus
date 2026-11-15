import { DATA_TOOL } from '@conexus/hub-api'
import { DatabaseIcon } from 'lucide-react'
import type { ToolSpec } from './tool-spec.ts'

/** The rows of the two company-data tools, the least that draws them: the sentences of a call. */
export const DATA_SPECS: Record<(typeof DATA_TOOL)[keyof typeof DATA_TOOL], ToolSpec> = {
  [DATA_TOOL.describe]: {
    icon: DatabaseIcon,
    running: 'Consultando o catálogo',
    done: 'Consultou o catálogo',
    failed: 'Não conseguiu ler o catálogo agora.',
    verb: 'consultou',
    body: 'generic',
    groups: true,
  },
  [DATA_TOOL.query]: {
    icon: DatabaseIcon,
    running: 'Consultando os dados',
    done: 'Consultou os dados',
    failed: 'Não conseguiu ler a tabela agora.',
    verb: 'consultou',
    body: 'generic',
    groups: true,
  },
}
