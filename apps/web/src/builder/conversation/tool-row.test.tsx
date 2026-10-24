import { CARD_TOOLS, CLOSED_TOOLS, TASK_TOOLS } from '@conexus/hub-api'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import type { ToolItem } from './parts.ts'
import { invocationToItem } from './parts.ts'
import type { Invocation } from './tool-fixtures.ts'
import {
  EDIT_DONE,
  EDIT_REFUSED_STORED,
  WRITE_DONE,
  WRITE_REFUSED_LIVE,
  WRITE_REFUSED_STORED,
} from './tool-fixtures.ts'
import { presentTool, specOf, TOOLS } from './tool-registry.ts'
import { ToolRow } from './tool-row.tsx'

afterEach(() => {
  vi.useRealTimers()
})

function itemOf(inv: Invocation): ToolItem {
  const item = invocationToItem(inv, undefined)
  if (item?.kind !== 'tool') throw new Error(`${inv.toolName} is not a row`)
  return item
}

function open(name: RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
}

test('leitura no começo: read_file abre no começo do arquivo e mostra cortes se houver (Critério 8)', async () => {
  const tool: ToolItem = {
    kind: 'tool',
    id: 't-1',
    toolCallId: 'call-1',
    toolName: 'mastra_workspace_read_file',
    state: 'result',
    args: { path: 'src/router.tsx' },
    result:
      'import { createRouter } from "@tanstack/react-router"\nexport const router = createRouter()',
    cuts: ['content'],
  }
  render(<ToolRow tool={tool} />)
  expect(screen.queryByText(/createRouter/)).toBeNull()
  open(/Leu um arquivo/)
  const block = await screen.findByText(/createRouter/)
  expect(block.textContent).toContain('import { createRouter } from "@tanstack/react-router"')
  expect(block.textContent).toContain('…')
})

test('list_files no resultado: abre no resultado retornado pela ferramenta (Critério 8)', async () => {
  const listTool: ToolItem = {
    kind: 'tool',
    id: 't-2',
    toolCallId: 'call-2',
    toolName: 'mastra_workspace_list_files',
    state: 'result',
    args: { path: 'src' },
    result: ['src/app.tsx', 'src/router.tsx', 'src/main.tsx'],
  }
  render(<ToolRow tool={listTool} />)
  expect(screen.queryByText(/src\/router\.tsx/)).toBeNull()
  open(/Listou arquivos/)
  expect(await screen.findByText(/src\/router\.tsx/)).toBeTruthy()
})

test('grep no resultado: abre no resultado retornado pela ferramenta (Critério 8)', async () => {
  const grepTool: ToolItem = {
    kind: 'tool',
    id: 't-3',
    toolCallId: 'call-3',
    toolName: 'mastra_workspace_grep',
    state: 'result',
    args: { pattern: 'router' },
    result: 'src/main.tsx:5: import { router } from "./router"\nsrc/app.tsx:12: router.navigate()',
  }
  render(<ToolRow tool={grepTool} />)
  expect(screen.queryByText(/router\.navigate/)).toBeNull()
  open(/Buscou no código/)
  expect(await screen.findByText(/router\.navigate/)).toBeTruthy()
})

test('skill no nome e nas instruções: abre no nome legível e no conteúdo das instruções (Critério 8)', async () => {
  const skillTool: ToolItem = {
    kind: 'tool',
    id: 't-4',
    toolCallId: 'call-4',
    toolName: 'skill',
    state: 'result',
    args: {
      name: 'conexus-build',
      instructions: 'Construa uma tela de encomendas com cliente, data e valor.',
    },
    result: 'Skill aplicada com sucesso.',
  }
  render(<ToolRow tool={skillTool} />)
  expect(screen.queryByText('conexus-build')).toBeNull()
  open(/Usou a skill/)
  expect(await screen.findByText('conexus-build')).toBeTruthy()
  expect(await screen.findByText(/Construa uma tela de encomendas/)).toBeTruthy()
})

test('desconhecida no nome legível, argumentos e resultado (Critério 8)', async () => {
  const unknownTool: ToolItem = {
    kind: 'tool',
    id: 't-5',
    toolCallId: 'call-5',
    toolName: 'custom_data_fetcher',
    state: 'result',
    args: { endpoint: '/pedidos', timeout: 5000 },
    result: { count: 42, status: 'ok' },
  }
  render(<ToolRow tool={unknownTool} />)
  expect(screen.getByText('Usou Custom data fetcher')).toBeTruthy()
  open(/Usou Custom data fetcher/)
  expect(await screen.findByText(/Argumentos:/)).toBeTruthy()
  expect(screen.getByText(/endpoint/)).toBeTruthy()
  expect(screen.getByText(/Resultado:/)).toBeTruthy()
  expect(screen.getByText(/count/)).toBeTruthy()
})

test('uma falha abre no motivo, ao vivo e relida, e a edição mostra a mudança embaixo (Critério 8)', async () => {
  const reread = render(<ToolRow tool={itemOf(WRITE_REFUSED_STORED)} />)
  const line = screen.getByText(/Não conseguiu escrever/).closest('[data-slot="trace-line"]')
  expect(line?.getAttribute('data-status')).toBe('error')
  open(/Não conseguiu escrever/)
  const reread_reason = (await screen.findByText(/Permission denied/)).textContent
  reread.unmount()

  const live = render(<ToolRow tool={itemOf(WRITE_REFUSED_LIVE)} />)
  open(/Não conseguiu escrever/)
  const live_reason = (await screen.findByText(/Permission denied/)).textContent
  expect(live_reason).toBe(reread_reason)
  expect(live_reason).toBe('Permission denied: stat on ../fora.ts')
  live.unmount()

  render(<ToolRow tool={itemOf(EDIT_REFUSED_STORED)} />)
  open(/Não conseguiu editar/)
  const reason = await screen.findByText('Permission denied: stat on ../fora.ts')
  const change = screen.getByRole('group', { name: 'Mudança no arquivo' })
  expect(reason.compareDocumentPosition(change) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('editar abre na mudança: o trecho que saiu e o que entrou, cada um cortado em 800 (Critério 8)', async () => {
  const done = render(<ToolRow tool={itemOf(EDIT_DONE)} />)
  expect(screen.queryByRole('group', { name: 'Mudança no arquivo' })).toBeNull()
  open(/Editou um arquivo/)
  const change = await screen.findByRole('group', { name: 'Mudança no arquivo' })
  expect(change.textContent).toBe('-a = 1+a = 2')
  expect(screen.queryByText(/Argumentos:/)).toBeNull()
  done.unmount()

  const long = {
    ...EDIT_DONE,
    args: { path: 'src/a.ts', old_string: 'x'.repeat(900), new_string: 'y' },
  }
  render(<ToolRow tool={itemOf(long)} />)
  open(/Editou um arquivo/)
  const cut = await screen.findByRole('group', { name: 'Mudança no arquivo' })
  expect(cut.textContent).toBe(`-${'x'.repeat(800)}…+y`)
})

test('escrever abre no arquivo escrito, cortado em 800 (Critério 8)', async () => {
  const done = render(<ToolRow tool={itemOf(WRITE_DONE)} />)
  open(/Escreveu um arquivo/)
  const written = await screen.findByRole('group', { name: 'Arquivo escrito' })
  expect(written.textContent).toBe('export const a = 1\n')
  done.unmount()

  const long = { ...WRITE_DONE, args: { path: 'src/a.ts', content: 'z'.repeat(900) } }
  render(<ToolRow tool={itemOf(long)} />)
  open(/Escreveu um arquivo/)
  expect((await screen.findByRole('group', { name: 'Arquivo escrito' })).textContent).toBe(
    `${'z'.repeat(800)}…`,
  )
})

test('cada ferramenta do conjunto fechado tem frase e abre no corpo da tabela (Critério 8)', () => {
  const cards: readonly string[] = Object.values(CARD_TOOLS)
  const tasks: readonly string[] = TASK_TOOLS
  const drawn = CLOSED_TOOLS.filter((name) => !cards.includes(name) && !tasks.includes(name))
  expect(Object.keys(TOOLS).sort()).toEqual([...drawn].sort())
  for (const name of drawn) {
    const spec = specOf(name)
    expect(spec, name).toBeDefined()
    const done = presentTool({ toolName: name, args: {} }, 'done')
    expect(done.sentence, name).toBe(spec?.done)
    expect(presentTool({ toolName: name, args: {} }, 'running').sentence, name).toBe(spec?.running)
  }
  expect(specOf('github_create_issue')).toBeUndefined()
  expect(presentTool({ toolName: 'github_create_issue', args: {} }, 'done').sentence).toBe(
    'Usou Github create issue',
  )
})

test('o relógio conta desde que a tela ouviu a chamada (Critério 8)', () => {
  vi.useFakeTimers()
  const running: ToolItem = {
    ...itemOf({ ...EDIT_DONE, state: 'call', result: undefined }),
    startedAt: Date.now() - 5000,
  }
  render(<ToolRow tool={running} />)
  expect(screen.getByText('(5 s)')).toBeTruthy()
})

test('linha sem argumentos nem resultado: não abre nada (Critério 8, matriz de estados)', () => {
  const bareTool: ToolItem = {
    kind: 'tool',
    id: 't-7',
    toolCallId: 'call-7',
    toolName: 'conexus_check',
    state: 'result',
    args: {},
  }
  render(<ToolRow tool={bareTool} />)
  expect(screen.getByText('Conferiu o app')).toBeTruthy()
  expect(screen.queryByRole('button')).toBeNull()
})
