import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ToolRow } from './tool-row.tsx'
import type { ToolItem } from './transcript.ts'

function open(name: RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
}

test('leitura no começo: read_file abre no começo do arquivo e mostra cortes se houver (Critério 8)', async () => {
  const tool: ToolItem = {
    kind: 'tool',
    id: 't-1',
    toolCallId: 'call-1',
    toolName: 'read_file',
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
    toolName: 'list_files',
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
    toolName: 'grep',
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

test('falha, vermelha, no erro: status de erro e abre no motivo da falha (Critério 8)', async () => {
  const errorTool: ToolItem = {
    kind: 'tool',
    id: 't-6',
    toolCallId: 'call-6',
    toolName: 'write_file',
    state: 'output-error',
    args: { path: '../forbidden.ts' },
    result: { error: 'Permissão negada fora do diretório do app.' },
    isError: true,
  }
  render(<ToolRow tool={errorTool} />)
  const line = screen.getByText(/Não conseguiu escrever/).closest('[data-slot="trace-line"]')
  expect(line?.getAttribute('data-status')).toBe('error')
  open(/Não conseguiu escrever/)
  expect(await screen.findByText('Permissão negada fora do diretório do app.')).toBeTruthy()
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
