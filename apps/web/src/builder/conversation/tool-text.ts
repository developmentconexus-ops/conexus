import type { MessagePart } from '@conexus/hub-api'
import type { ToolPart } from './fold.ts'
import { durationOf } from './text.ts'

type Kind = ToolPart['kind']

/** What the Builder is doing, did, or failed to do, by kind of tool (design V39). */
const SENTENCES: Record<Kind, Record<ToolPart['state'], string>> = {
  read_page: {
    running: 'Lendo uma página',
    completed: 'Leu uma página',
    error: 'Não conseguiu ler uma página',
    denied: 'Não pôde ler uma página',
  },
  search_web: {
    running: 'Pesquisando na internet',
    completed: 'Pesquisou na internet',
    error: 'Não conseguiu pesquisar na internet',
    denied: 'Não pôde pesquisar na internet',
  },
  recall: {
    running: 'Relendo conversas anteriores',
    completed: 'Releu conversas anteriores',
    error: 'Não conseguiu reler conversas anteriores',
    denied: 'Não pôde reler conversas anteriores',
  },
  write_file: {
    running: 'Escrevendo um arquivo',
    completed: 'Escreveu um arquivo',
    error: 'Não conseguiu escrever um arquivo',
    denied: 'Não pôde escrever um arquivo',
  },
  edit_file: {
    running: 'Editando um arquivo',
    completed: 'Editou um arquivo',
    error: 'Não conseguiu editar um arquivo',
    denied: 'Não pôde editar um arquivo',
  },
  run_command: {
    running: 'Rodando um comando',
    completed: 'Rodou um comando',
    error: 'Um comando falhou',
    denied: 'Não pôde rodar um comando',
  },
  other: {
    running: 'Usando uma ferramenta',
    completed: 'Usou uma ferramenta',
    error: 'Uma ferramenta falhou',
    denied: 'Não pôde usar uma ferramenta',
  },
}

function counted(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** What a group of one kind did, in the past: "leu 3 páginas". */
const DONE: Record<Kind, (count: number) => string> = {
  read_page: (count) => `leu ${counted(count, 'página', 'páginas')}`,
  search_web: (count) => `pesquisou ${counted(count, 'vez', 'vezes')}`,
  recall: (count) => `releu conversas anteriores ${counted(count, 'vez', 'vezes')}`,
  write_file: (count) => `escreveu ${counted(count, 'arquivo', 'arquivos')}`,
  edit_file: (count) => `editou ${counted(count, 'arquivo', 'arquivos')}`,
  run_command: (count) => `rodou ${counted(count, 'comando', 'comandos')}`,
  other: (count) => `usou ${counted(count, 'ferramenta', 'ferramentas')}`,
}

export function sentenceOf(tool: ToolPart): string {
  return SENTENCES[tool.kind][tool.state]
}

/** "Leu 3 páginas, pesquisou 1 vez", kinds in the order they first appear, with the failures counted. */
export function summaryOf(tools: ToolPart[]): string {
  const counts = new Map<Kind, number>()
  for (const tool of tools) counts.set(tool.kind, (counts.get(tool.kind) ?? 0) + 1)
  const said = [...counts].map(([kind, count]) => DONE[kind](count)).join(', ')
  const summary = said.charAt(0).toUpperCase() + said.slice(1)
  const failed = tools.filter((tool) => tool.state === 'error' || tool.state === 'denied').length
  return failed === 0 ? summary : `${summary} · ${failed} ${failed === 1 ? 'falhou' : 'falharam'}`
}

type Thought = Extract<MessagePart, { type: 'reasoning' }>

/** "Pensando…" while it thinks; "Pensou por 9 s" after, and "Pensou" once read again. */
export function thoughtOf(part: Thought): string {
  if (part.state === 'running') return 'Pensando…'
  return part.seconds === null || part.seconds < 1
    ? 'Pensou'
    : `Pensou por ${durationOf(part.seconds)}`
}
