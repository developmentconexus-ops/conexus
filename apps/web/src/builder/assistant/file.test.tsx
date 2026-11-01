import type { ShownFile } from '@conexus/hub-api'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  toolSaid,
} from './test-hub.tsx'

// The file the Assistant shows beside the chat (step 24.1, criterion 27).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`

function showing(path: string, shown: ShownFile) {
  at(OPEN, {
    conversations: [
      assistantConversation({
        messages: [toolSaid(ASSISTANT_TOOL.showFile, { path }, shown)],
      }),
    ],
  })
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
  const download = within(panel).getByRole('link', { name: 'Baixar' })
  expect(download.getAttribute('href')).toContain('/assistant/conversations/')
  expect(download.getAttribute('href')).toContain('relatorio.md')
  expect(download.hasAttribute('download')).toBe(true)
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
  expect(screen.queryByRole('link', { name: 'Baixar' })).toBeNull()
})
