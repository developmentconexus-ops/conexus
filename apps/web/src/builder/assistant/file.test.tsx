import type { ShownFile } from '@conexus/hub-api'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import {
  agentEnd,
  stepStarted,
  textDelta,
  toolCall,
  toolStarted,
  updatePart,
} from '../conversation/test-events.ts'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  running,
  toolSaid,
} from './test-hub.tsx'

// The file the Assistant shows beside the chat (step 24.1, criterion 27).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`

afterEach(() => vi.restoreAllMocks())

function showing(path: string, shown: ShownFile, answers = {}) {
  return at(OPEN, {
    conversations: [
      assistantConversation({
        messages: [toolSaid(ASSISTANT_TOOL.showFile, { path }, shown)],
      }),
    ],
    answers,
  })
}

/** What the browser is asked to save: the page has no download manager here, only the anchor it clicks. */
function saved() {
  const files: { href: string; download: string }[] = []
  Object.assign(URL, { createObjectURL: () => 'blob:arquivo', revokeObjectURL: () => undefined })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function save(
    this: HTMLAnchorElement,
  ) {
    files.push({ href: this.href, download: this.download })
  })
  return files
}

const CHART: ShownFile = {
  kind: 'FILE',
  path: 'grafico.svg',
  name: 'grafico.svg',
  media: 'image/svg+xml',
  bytes: 200,
}

test('um Markdown abre ao lado, formatado, com Baixar e Fechar', async () => {
  showing('relatorio.md', {
    kind: 'TEXT',
    path: 'relatorio.md',
    name: 'relatorio.md',
    media: 'text/markdown',
    content: '# Vendas\n\n- Total da semana',
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir relatorio.md' }))
  const panel = await screen.findByRole('region', { name: 'relatorio.md' })
  expect(within(panel).getByText('Vendas')).toBeTruthy()
  expect(within(panel).getByRole('listitem').textContent).toBe('Total da semana')
  expect(panel.textContent).not.toContain('# Vendas')
  expect(within(panel).getByRole('button', { name: 'Baixar' })).toBeTruthy()
  fireEvent.click(within(panel).getByRole('button', { name: 'Fechar' }))
  await waitFor(() => expect(screen.queryByRole('region', { name: 'relatorio.md' })).toBeNull())
})

test('um CSV abre como texto simples', async () => {
  showing('tabela.csv', {
    kind: 'TEXT',
    path: 'tabela.csv',
    name: 'tabela.csv',
    media: 'text/csv',
    content: 'a;b\n1;2',
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir tabela.csv' }))
  const panel = await screen.findByRole('region', { name: 'tabela.csv' })
  expect(panel.querySelector('pre')?.textContent).toBe('a;b\n1;2')
})

test('um arquivo de texto vazio diz que está vazio', async () => {
  showing('vazio.txt', {
    kind: 'TEXT',
    path: 'vazio.txt',
    name: 'vazio.txt',
    media: 'text/plain',
    content: '',
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir vazio.txt' }))
  expect(await screen.findByText('Arquivo vazio.')).toBeTruthy()
})

test('uma imagem é desenhada da rota de arquivos do Hub, no mesmo endereço', async () => {
  showing('grafico.png', {
    kind: 'FILE',
    path: 'grafico.png',
    name: 'grafico.png',
    media: 'image/png',
    bytes: 2048,
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.png' }))
  const image = await screen.findByRole('img', { name: 'grafico.png' })
  const src = image.getAttribute('src') ?? ''
  expect(src.startsWith('/api/companies/')).toBe(true)
  expect(src).toContain(`/assistant/conversations/${ASKED}/files?path=grafico.png`)
})

test('outro arquivo mostra nome, tipo e tamanho, e só se baixa', async () => {
  showing('planilha.xlsx', {
    kind: 'FILE',
    path: 'planilha.xlsx',
    name: 'planilha.xlsx',
    media: 'application/vnd.ms-excel',
    bytes: 4096,
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir planilha.xlsx' }))
  const panel = await screen.findByRole('region', { name: 'planilha.xlsx' })
  expect(within(panel).getByText(/application\/vnd\.ms-excel/)).toBeTruthy()
  expect(within(panel).getByText(/4 KB/)).toBeTruthy()
  expect(within(panel).queryByRole('img')).toBeNull()
})

test('um arquivo recusado não desenha painel nenhum', async () => {
  showing('../segredo', { kind: 'SHOW_REFUSED', reason: 'OUTSIDE' })
  await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
  await screen.findByText(/Não conseguiu mostrar o arquivo/)
  expect(screen.queryByRole('button', { name: 'Baixar' })).toBeNull()
})

test('um SVG é desenhado pela rota de arquivos, como as outras imagens', async () => {
  showing('grafico.svg', CHART)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.svg' }))
  const image = await screen.findByRole('img', { name: 'grafico.svg' })
  expect(image.getAttribute('src')).toContain('files?path=grafico.svg')
})

test('uma imagem que a máquina não guarda mais diz a frase do FILE_GONE e deixa tentar de novo', async () => {
  showing('grafico.svg', CHART, { file: () => refusal('FILE_GONE') })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.svg' }))
  fireEvent.error(await screen.findByRole('img', { name: 'grafico.svg' }))
  expect(
    await screen.findByText(/A máquina desta conversa não guarda mais este arquivo\./),
  ).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('Baixar lê a rota pelo fetch do Hub e salva o arquivo recebido', async () => {
  const files = saved()
  showing('grafico.svg', CHART)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.svg' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Baixar' }))
  await waitFor(() => expect(files).toEqual([{ href: 'blob:arquivo', download: 'grafico.svg' }]))
})

test('Baixar um arquivo que a máquina não guarda mais diz a frase do FILE_GONE e não salva nada', async () => {
  const files = saved()
  showing(
    'planilha.xlsx',
    {
      kind: 'FILE',
      path: 'planilha.xlsx',
      name: 'planilha.xlsx',
      media: 'application/vnd.ms-excel',
      bytes: 4096,
    },
    { file: () => refusal('FILE_GONE') },
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir planilha.xlsx' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Baixar' }))
  expect(
    await screen.findByText(/A máquina desta conversa não guarda mais este arquivo\./),
  ).toBeTruthy()
  expect(files).toHaveLength(0)
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('Baixar com a sessão vencida volta à entrada, como todo o resto do Hub', async () => {
  const files = saved()
  const hub = showing('grafico.svg', CHART, { file: () => refusal('SESSION_REQUIRED') })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.svg' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Baixar' }))
  await waitFor(() => expect(hub.conexus.router.state.location.pathname).toBe('/login'))
  expect(files).toHaveLength(0)
})

test('Baixar com uma resposta que não é do Hub diz a frase de falha inesperada e não salva nada', async () => {
  const files = saved()
  showing('grafico.svg', CHART, {
    file: () => new Response('<html>bad gateway</html>', { status: 502 }),
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.svg' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Baixar' }))
  expect(await screen.findByText(/Algo deu errado dentro do Conexus\./)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  expect(files).toHaveLength(0)
})

test('um arquivo mostrado ao vivo abre sozinho, sem clique', async () => {
  const hub = at(OPEN, { conversations: [assistantConversation()] })
  const line = await running(hub)
  const call = toolCall(ASSISTANT_TOOL.showFile, { path: 'relatorio.md' })
  line.emit(toolStarted(ASSISTANT_TOOL.showFile, { path: 'relatorio.md' }))
  line.emit(stepStarted('step-1', [call]))
  line.emit(
    updatePart(
      toolCall(
        ASSISTANT_TOOL.showFile,
        { path: 'relatorio.md' },
        {
          kind: 'TEXT',
          path: 'relatorio.md',
          name: 'relatorio.md',
          media: 'text/markdown',
          content: '# Vendas',
        },
      ),
      0,
      'step-1',
    ),
  )
  expect(await screen.findByRole('region', { name: 'relatorio.md' })).toBeTruthy()
  // The chat beside the file is the same chat: the stream goes on and the next words arrive in it.
  line.emit(stepStarted('step-2'))
  line.emit(textDelta('Pronto, o relatório está ao lado.', 'step-2'))
  expect(await screen.findByText('Pronto, o relatório está ao lado.')).toBeTruthy()
  expect(screen.getByRole('region', { name: 'relatorio.md' })).toBeTruthy()
  line.emit(agentEnd())
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  await waitFor(() => expect(hub.conexus.queryClient.isFetching()).toBe(0))
})
