import type { CARD_TOOLS, ClosedTool, TASK_TOOLS } from '@conexus/hub-api'
import { BUILDER_TOOL, SKILL_TOOLS, WORKSPACE_TOOL } from '@conexus/hub-api'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpenIcon,
  CircleAlertIcon,
  ClipboardCheckIcon,
  FilePenIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderPlusIcon,
  HistoryIcon,
  SearchIcon,
  TerminalIcon,
  TrashIcon,
  WrenchIcon,
} from 'lucide-react'
import { CONNECTOR_SPECS } from './connector-specs.ts'
import type { ToolItem } from './rows.ts'
import { stringArg } from './tool-args.ts'
import type { ToolSpec } from './tool-spec.ts'

export type { ToolBody, ToolSpec } from './tool-spec.ts'

/** The tools that draw a row: the cards draw a card and the task tools the panel. */
type RowTool = Exclude<
  ClosedTool,
  (typeof CARD_TOOLS)[keyof typeof CARD_TOOLS] | (typeof TASK_TOOLS)[number]
>

const {
  readFile,
  writeFile,
  editFile,
  listFiles,
  delete: remove,
  fileStat,
  mkdir,
  grep,
  executeCommand,
  getProcessOutput,
  killProcess,
} = WORKSPACE_TOOL
const { webSearch, webFetch, recall, check } = BUILDER_TOOL
const [skill, skillRead, skillSearch] = SKILL_TOOLS

export const TOOLS: Record<RowTool, ToolSpec> = {
  [readFile]: {
    icon: FileTextIcon,
    running: 'Lendo um arquivo',
    done: 'Leu um arquivo',
    failed: 'Não conseguiu ler',
    verb: 'leu',
    detailKey: 'path',
    body: 'file',
    groups: true,
  },
  [writeFile]: {
    icon: FilePlusIcon,
    running: 'Escrevendo um arquivo',
    done: 'Escreveu um arquivo',
    failed: 'Não conseguiu escrever',
    verb: 'escreveu',
    detailKey: 'path',
    body: 'write',
    groups: true,
  },
  [editFile]: {
    icon: FilePenIcon,
    running: 'Editando um arquivo',
    done: 'Editou um arquivo',
    failed: 'Não conseguiu editar',
    verb: 'editou',
    detailKey: 'path',
    body: 'edit',
    groups: true,
  },
  [listFiles]: {
    icon: SearchIcon,
    running: 'Listando arquivos',
    done: 'Listou arquivos',
    failed: 'Não conseguiu listar arquivos',
    verb: 'listou',
    detailKey: 'path',
    body: 'list',
    groups: true,
  },
  [grep]: {
    icon: SearchIcon,
    running: 'Buscando no código',
    done: 'Buscou no código',
    failed: 'Não conseguiu buscar no código',
    verb: 'procurou',
    detailKey: 'pattern',
    body: 'list',
    groups: true,
  },
  [fileStat]: {
    icon: FileTextIcon,
    running: 'Consultando um arquivo',
    done: 'Consultou um arquivo',
    failed: 'Não conseguiu consultar',
    verb: 'consultou',
    detailKey: 'path',
    body: 'generic',
    groups: true,
  },
  [remove]: {
    icon: TrashIcon,
    running: 'Apagando um arquivo',
    done: 'Apagou um arquivo',
    failed: 'Não conseguiu apagar',
    verb: 'apagou',
    detailKey: 'path',
    body: 'generic',
    groups: true,
  },
  [mkdir]: {
    icon: FolderPlusIcon,
    running: 'Criando uma pasta',
    done: 'Criou uma pasta',
    failed: 'Não conseguiu criar a pasta',
    verb: 'criou pasta',
    detailKey: 'path',
    body: 'generic',
    groups: true,
  },
  [executeCommand]: {
    icon: TerminalIcon,
    running: 'Rodando um comando',
    done: 'Rodou um comando',
    failed: 'Um comando falhou',
    verb: 'rodou',
    detailKey: 'command',
    body: 'command',
    groups: true,
  },
  [getProcessOutput]: {
    icon: TerminalIcon,
    running: 'Lendo a saída de um processo',
    done: 'Leu a saída de um processo',
    failed: 'Não conseguiu ler a saída',
    verb: 'leu saída',
    body: 'generic',
    groups: true,
  },
  [killProcess]: {
    icon: TerminalIcon,
    running: 'Parando um processo',
    done: 'Parou um processo',
    failed: 'Não conseguiu parar o processo',
    verb: 'parou processo',
    body: 'generic',
    groups: true,
  },
  [webSearch]: {
    icon: SearchIcon,
    running: 'Pesquisando na internet',
    done: 'Pesquisou na internet',
    failed: 'Não conseguiu pesquisar na internet',
    verb: 'pesquisou',
    detailKey: 'query',
    detailBeside: true,
    body: 'generic',
    groups: true,
  },
  [webFetch]: {
    icon: BookOpenIcon,
    running: 'Lendo uma página',
    done: 'Leu uma página',
    failed: 'Não conseguiu ler uma página',
    verb: 'leu página',
    detailKey: 'url',
    detailBeside: true,
    body: 'generic',
    groups: true,
  },
  [recall]: {
    icon: HistoryIcon,
    running: 'Relendo conversas anteriores',
    done: 'Releu conversas anteriores',
    failed: 'Não conseguiu reler as conversas',
    verb: 'releu',
    body: 'generic',
    groups: true,
  },
  [check]: {
    icon: ClipboardCheckIcon,
    running: 'Conferindo o app',
    done: 'Conferiu o app',
    failed: 'Não conseguiu conferir o app',
    verb: 'conferiu',
    body: 'generic',
    groups: true,
  },
  ...CONNECTOR_SPECS,
  [skill]: {
    icon: BookOpenIcon,
    running: 'Usando a skill',
    done: 'Usou a skill',
    failed: 'Não conseguiu usar a skill',
    verb: 'usou skill',
    detailKey: 'name',
    body: 'skill',
    groups: false,
  },
  [skillRead]: {
    icon: BookOpenIcon,
    running: 'Lendo a skill',
    done: 'Leu a skill',
    failed: 'Não conseguiu ler a skill',
    verb: 'leu skill',
    detailKey: 'name',
    body: 'skill',
    groups: false,
  },
  [skillSearch]: {
    icon: SearchIcon,
    running: 'Procurando uma skill',
    done: 'Procurou uma skill',
    failed: 'Não conseguiu procurar a skill',
    verb: 'procurou skill',
    detailKey: 'query',
    body: 'generic',
    groups: false,
  },
}

export type ToolStatus = 'running' | 'done' | 'error' | 'denied'

/** The spec of a tool of the closed set, or none for a name outside it. */
function isRowTool(toolName: string): toolName is RowTool {
  return Object.hasOwn(TOOLS, toolName)
}

export function specOf(toolName: string): ToolSpec | undefined {
  return isRowTool(toolName) ? TOOLS[toolName] : undefined
}

/** One status per call (Factory `terminalInvocationStatus`); a command that exited non-zero is an error. */
export function toolStatus(tool: Pick<ToolItem, 'state' | 'isError'>): ToolStatus {
  switch (tool.state) {
    case 'result':
      return tool.isError === true ? 'error' : 'done'
    case 'output-error':
      return 'error'
    case 'output-denied':
      return 'denied'
    default:
      return 'running'
  }
}

/** A tool outside the closed set reads by its name, as words. */
export function readable(toolName: string): string {
  const words = toolName.replace(/[_-]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : toolName
}

/** The row's icon and sentence by its status; the readable name for a tool outside the set. */
export function presentTool(
  tool: Pick<ToolItem, 'toolName' | 'args'>,
  status: ToolStatus,
): { icon: LucideIcon; sentence: string; detail?: string; beside: boolean } {
  const spec = specOf(tool.toolName)
  const failed = status === 'error' || status === 'denied'
  if (spec === undefined) {
    const name = readable(tool.toolName)
    const sentence =
      status === 'denied'
        ? `Não pôde usar ${name}`
        : status === 'error'
          ? `Não conseguiu usar ${name}`
          : status === 'running'
            ? `Usando ${name}`
            : `Usou ${name}`
    return { icon: failed ? CircleAlertIcon : WrenchIcon, sentence, beside: false }
  }
  const detail = spec.detailKey === undefined ? undefined : stringArg(tool.args, spec.detailKey)
  const head =
    status === 'denied'
      ? 'Não pôde'
      : failed
        ? spec.failed
        : status === 'running'
          ? spec.running
          : spec.done
  const beside = spec.detailBeside === true && !failed && detail !== undefined
  const sentence = detail === undefined || beside ? head : `${head} ${detail}`
  return { icon: failed ? CircleAlertIcon : spec.icon, sentence, detail, beside }
}

export function summaryOfTools(tools: readonly ToolItem[]): { short: string; full: string } {
  const count = tools.length
  const verbs: string[] = []
  for (const tool of tools) {
    const verb = specOf(tool.toolName)?.verb ?? 'usou'
    if (!verbs.includes(verb)) verbs.push(verb)
  }
  const failed = tools.filter((tool) => {
    const status = toolStatus(tool)
    return status === 'error' || status === 'denied'
  }).length
  const baseFull = `${count} ferramentas: ${verbs.join(', ')}`
  const full =
    failed > 0 ? `${baseFull} · ${failed} ${failed === 1 ? 'falhou' : 'falharam'}` : baseFull
  return { short: `${count} ferramentas`, full }
}
