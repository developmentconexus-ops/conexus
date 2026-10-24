import { CARD_TOOLS, SKILL_TOOLS } from '@conexus/hub-api'
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
import { durationOf } from './text.ts'

export type ToolPresentation = {
  icon: LucideIcon
  label: string
  sentence: string
  detail?: string
  isError?: boolean
  status?: 'running' | 'error'
}

type ClosedTool = {
  running: string
  done: string
  verb: string
  error?: string
  icon: LucideIcon
  detailKey?: string
}

function stringArg(args: unknown, key: string): string | undefined {
  if (args && typeof args === 'object' && key in args) {
    const value = Reflect.get(args, key)
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }
  return undefined
}

const READ_FILE: ClosedTool = {
  running: 'Lendo um arquivo',
  done: 'Leu um arquivo',
  verb: 'leu',
  error: 'Não conseguiu ler',
  icon: FileTextIcon,
  detailKey: 'path',
}

const WRITE_FILE: ClosedTool = {
  running: 'Escrevendo um arquivo',
  done: 'Escreveu um arquivo',
  verb: 'escreveu',
  error: 'Não conseguiu escrever',
  icon: FilePlusIcon,
  detailKey: 'path',
}

const EDIT_FILE: ClosedTool = {
  running: 'Editando um arquivo',
  done: 'Editou um arquivo',
  verb: 'editou',
  error: 'Não conseguiu editar',
  icon: FilePenIcon,
  detailKey: 'path',
}

const LIST_FILES: ClosedTool = {
  running: 'Listando arquivos',
  done: 'Listou arquivos',
  verb: 'listou',
  error: 'Não conseguiu listar arquivos',
  icon: SearchIcon,
  detailKey: 'path',
}

const GREP: ClosedTool = {
  running: 'Buscando no código',
  done: 'Buscou no código',
  verb: 'procurou',
  error: 'Não conseguiu buscar no código',
  icon: SearchIcon,
  detailKey: 'pattern',
}

const CLOSED_TOOLS: Record<string, ClosedTool> = {
  read_file: READ_FILE,
  view: READ_FILE,
  write_file: WRITE_FILE,
  create_file: WRITE_FILE,
  edit_file: EDIT_FILE,
  str_replace: EDIT_FILE,
  string_replace: EDIT_FILE,
  ast_edit: EDIT_FILE,
  list_files: LIST_FILES,
  find_files: { ...LIST_FILES, detailKey: 'pattern' },
  grep: GREP,
  search_content: GREP,
  search: { ...GREP, running: 'Buscando', done: 'Buscou', detailKey: 'query' },
  file_stat: {
    running: 'Consultando um arquivo',
    done: 'Consultou um arquivo',
    verb: 'consultou',
    icon: FileTextIcon,
    detailKey: 'path',
  },
  delete: {
    running: 'Apagando um arquivo',
    done: 'Apagou um arquivo',
    verb: 'apagou',
    error: 'Não conseguiu apagar',
    icon: TrashIcon,
    detailKey: 'path',
  },
  delete_file: {
    running: 'Apagando um arquivo',
    done: 'Apagou um arquivo',
    verb: 'apagou',
    error: 'Não conseguiu apagar',
    icon: TrashIcon,
    detailKey: 'path',
  },
  mkdir: {
    running: 'Criando uma pasta',
    done: 'Criou uma pasta',
    verb: 'criou pasta',
    icon: FolderPlusIcon,
    detailKey: 'path',
  },
  execute_command: {
    running: 'Rodando um comando',
    done: 'Rodou um comando',
    verb: 'rodou',
    error: 'Um comando falhou',
    icon: TerminalIcon,
    detailKey: 'command',
  },
  get_process_output: {
    running: 'Lendo a saída de um processo',
    done: 'Leu a saída de um processo',
    verb: 'leu saída',
    icon: TerminalIcon,
  },
  kill_process: {
    running: 'Parando um processo',
    done: 'Parou um processo',
    verb: 'parou processo',
    icon: TerminalIcon,
  },
  web_search: {
    running: 'Pesquisando na internet',
    done: 'Pesquisou na internet',
    verb: 'pesquisou',
    error: 'Não conseguiu pesquisar na internet',
    icon: SearchIcon,
    detailKey: 'query',
  },
  web_fetch: {
    running: 'Lendo uma página',
    done: 'Leu uma página',
    verb: 'leu página',
    error: 'Não conseguiu ler uma página',
    icon: BookOpenIcon,
    detailKey: 'url',
  },
  recall: {
    running: 'Relendo conversas anteriores',
    done: 'Releu conversas anteriores',
    verb: 'releu',
    icon: HistoryIcon,
  },
  conexus_check: {
    running: 'Conferindo o app',
    done: 'Conferiu o app',
    verb: 'conferiu',
    icon: ClipboardCheckIcon,
  },
  [SKILL_TOOLS[0]]: {
    running: 'Usando a skill',
    done: 'Usou a skill',
    verb: 'usou skill',
    icon: BookOpenIcon,
    detailKey: 'name',
  },
  [SKILL_TOOLS[1]]: {
    running: 'Lendo a skill',
    done: 'Leu a skill',
    verb: 'leu skill',
    icon: BookOpenIcon,
    detailKey: 'name',
  },
  [SKILL_TOOLS[2]]: {
    running: 'Procurando uma skill',
    done: 'Procurou uma skill',
    verb: 'procurou skill',
    icon: SearchIcon,
    detailKey: 'query',
  },
  [CARD_TOOLS.question]: {
    running: 'Perguntando a você',
    done: 'Perguntou a você',
    verb: 'perguntou',
    icon: WrenchIcon,
  },
  [CARD_TOOLS.plan]: {
    running: 'Enviando o plano',
    done: 'Enviou o plano',
    verb: 'enviou plano',
    icon: WrenchIcon,
  },
}

export function prettifyToolName(toolName: string): string {
  const stripped = toolName.replace(/^mastra_workspace_/, '')
  const words = stripped.replace(/[_-]+/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : toolName
}

export function bareToolName(toolName: string): string {
  return toolName.replace(/^mastra_workspace_/, '')
}

export function presentTool(
  toolName: string,
  args?: unknown,
  options?: { isError?: boolean; isRunning?: boolean; isDenied?: boolean },
): ToolPresentation {
  const bare = bareToolName(toolName)
  const isErr = options?.isError === true
  const isDenied = options?.isDenied === true
  const isRunning = options?.isRunning === true
  const def = CLOSED_TOOLS[bare]

  if (def) {
    const detail = def.detailKey ? stringArg(args, def.detailKey) : undefined
    if (isErr || isDenied) {
      const prefix = isDenied ? 'Não pôde' : (def.error ?? 'Falhou ao')
      const sentence = detail ? `${prefix} ${detail}` : (def.error ?? 'Uma ferramenta falhou')
      return {
        icon: CircleAlertIcon,
        label: def.done,
        sentence,
        detail,
        isError: true,
        status: 'error',
      }
    }
    const baseSentence = isRunning ? def.running : def.done
    const sentence = detail ? `${baseSentence} ${detail}` : baseSentence
    return {
      icon: def.icon,
      label: baseSentence,
      sentence,
      detail,
      status: isRunning ? 'running' : undefined,
    }
  }

  const readable = prettifyToolName(toolName)
  if (isErr || isDenied) {
    return {
      icon: CircleAlertIcon,
      label: `Usou ${readable}`,
      sentence: isDenied ? `Não pôde usar ${readable}` : `Não conseguiu usar ${readable}`,
      isError: true,
      status: 'error',
    }
  }

  return {
    icon: WrenchIcon,
    label: isRunning ? `Usando ${readable}` : `Usou ${readable}`,
    sentence: isRunning ? `Usando ${readable}` : `Usou ${readable}`,
    status: isRunning ? 'running' : undefined,
  }
}

export function summaryOfTools(tools: readonly { toolName: string; isError?: boolean }[]): {
  short: string
  full: string
} {
  const count = tools.length
  const short = `${count} ferramentas`
  const verbs: string[] = []
  for (const tool of tools) {
    const def = CLOSED_TOOLS[bareToolName(tool.toolName)]
    const verb = def?.verb ?? 'usou'
    if (!verbs.includes(verb)) verbs.push(verb)
  }
  const failed = tools.filter((t) => t.isError).length
  const verbList = verbs.join(', ')
  const baseFull = `${count} ferramentas: ${verbList}`
  const full =
    failed > 0 ? `${baseFull} · ${failed} ${failed === 1 ? 'falhou' : 'falharam'}` : baseFull
  return { short, full }
}

export function thoughtOf(seconds: number | null | undefined, running: boolean): string {
  if (running) return 'Pensando…'
  return seconds === null || seconds === undefined || seconds < 1
    ? 'Pensou'
    : `Pensou por ${durationOf(seconds)}`
}
