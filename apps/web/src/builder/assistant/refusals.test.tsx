import { BUILDER_TOOL, WORKSPACE_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import type { Stored } from '../conversation/messages.ts'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  SANKHYA,
  toolSaid,
} from './test-hub.tsx'

// What the Assistant's rows say when a read or a tool does not go through (step 24.1, F29, F30, QA F6, F7).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const READ = { operation: 'sankhya.consultar', connection: 'Vendas' }

function reading(result: unknown) {
  at(OPEN, {
    conversations: [
      assistantConversation({ messages: [toolSaid(BUILDER_TOOL.connectorRead, READ, result)] }),
    ],
  })
}

describe('a leitura que não passou', () => {
  test.each([
    [
      { kind: 'BUSY', waitMs: 5_000 },
      'O Sankhya pediu para esperar 5 segundos. Tente de novo depois disso.',
    ],
    [
      { kind: 'BUSY', waitMs: null },
      'O Sankhya pediu para esperar. Tente de novo em alguns minutos.',
    ],
    [{ kind: 'UNREACHABLE' }, 'O Sankhya não respondeu. Tente de novo em alguns minutos.'],
    [{ kind: 'CALLS_SPENT' }, 'Esta resposta já usou as 50 leituras que cabem em uma resposta.'],
    [{ kind: 'NOT_GRANTED' }, 'Esta ligação não está disponível nesta conversa.'],
  ])('%j diz a frase da tabela, com o nome do sistema', async (result, sentence) => {
    reading(result)
    expect(await screen.findByText(sentence)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Abrir Integrações' })).toBeNull()
  })

  test('chaves recusadas dizem que as chaves foram recusadas, com o nome do sistema e o caminho das Integrações', async () => {
    reading({ kind: 'AUTH_REFUSED' })
    const sentence = await screen.findByText('As chaves foram recusadas pelo Sankhya.')
    fireEvent.click(sentence)
    expect(await screen.findByRole('link', { name: 'Abrir Integrações' })).toBeTruthy()
  })
})

test('uma ligação por OAuth que pede para conectar de novo diz a frase da autorização', async () => {
  reading({ kind: 'AUTH_REFUSED' })
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({
        connectors: [{ ...SANKHYA, auth: 'oauth2_code' }],
        connections: [],
        mayManage: true,
      }),
    ),
  )
  expect(await screen.findByText('O Sankhya pediu para conectar de novo.')).toBeTruthy()
})

describe('a leitura que passou', () => {
  test('uma leitura cortada em 20 linhas diz "20 linhas, há mais"', async () => {
    reading({
      kind: 'OK',
      value: { linhas: Array.from({ length: 20 }, (_, n) => ({ n })) },
      complete: false,
    })
    expect(await screen.findByText('Leu Sankhya · Vendas')).toBeTruthy()
    expect(screen.getByText('20 linhas, há mais')).toBeTruthy()
  })

  test('uma lista vazia e completa diz "Nenhuma linha."', async () => {
    reading({ kind: 'OK', value: { linhas: [] }, complete: true })
    expect(await screen.findByText('Nenhuma linha.')).toBeTruthy()
  })

  test('uma linha grande demais para o corte não vira "Nenhuma linha.": a leitura foi feita, sem contagem', async () => {
    reading({ kind: 'OK', value: null, complete: false })
    expect(await screen.findByText('Leu Sankhya · Vendas')).toBeTruthy()
    expect(screen.queryByText('Nenhuma linha.')).toBeNull()
    expect(screen.queryByText(/linhas?\b/)).toBeNull()
  })

  test('um valor que não é lista é lido sem contagem, e não como falha', async () => {
    reading({ kind: 'OK', value: { total: 3 }, complete: true })
    expect(await screen.findByText('Leu Sankhya · Vendas')).toBeTruthy()
    expect(screen.queryByText('Não conseguiu ler o sistema da empresa.')).toBeNull()
    expect(screen.queryByText(/linhas?\b/)).toBeNull()
  })
})

function writeFailed(errorText: string): Stored {
  return {
    id: 'tool-1',
    role: 'assistant',
    createdAt: '2026-10-19T12:02:00.000Z',
    content: {
      parts: [
        {
          type: 'tool-invocation',
          toolInvocation: {
            state: 'output-error',
            toolCallId: 'call-1',
            toolName: WORKSPACE_TOOL.writeFile,
            args: { path: 'x.csv', content: 'a' },
            errorText,
          },
        },
      ],
      metadata: { provider: 'anthropic', modelId: 'claude-sonnet-4' },
    },
  }
}

describe('a ferramenta que falhou', () => {
  test('a máquina que não ligou mostra a frase do Hub, não o código (QA F7)', async () => {
    at(OPEN, {
      conversations: [assistantConversation({ messages: [writeFailed('MACHINE_UNAVAILABLE')] })],
    })
    fireEvent.click(await screen.findByText(/Não conseguiu escrever x\.csv/))
    expect(
      await screen.findByText(
        'Não consegui ligar a máquina agora. Sua conversa está guardada. Tente de novo em alguns minutos.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('MACHINE_UNAVAILABLE')).toBeNull()
  })

  test('um erro que não é código do Hub segue como veio', async () => {
    at(OPEN, { conversations: [assistantConversation({ messages: [writeFailed('disco cheio')] })] })
    fireEvent.click(await screen.findByText(/Não conseguiu escrever x\.csv/))
    expect(await screen.findByText('disco cheio')).toBeTruthy()
  })
})

test('sem conta de modelo, a conversa diz a frase do Assistente, que não tem seletor de modelo (QA F6)', async () => {
  at(OPEN, { conversations: [assistantConversation()], usable: [] })
  expect(
    await screen.findByText(
      'Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.',
    ),
  ).toBeTruthy()
  expect(screen.queryByText(/Escolha outro modelo/)).toBeNull()
  expect(screen.getByRole('link', { name: 'Minhas contas de modelo' })).toBeTruthy()
})

function onAPhone() {
  return vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
}

describe('no celular, o arquivo abre numa folha', () => {
  test('a folha prende o foco, tem o nome do arquivo e fecha com Esc', async () => {
    const phone = onAPhone()
    try {
      at(OPEN, {
        conversations: [
          assistantConversation({
            messages: [
              toolSaid(
                'show_file',
                { path: 'relatorio.md' },
                {
                  kind: 'TEXT',
                  path: 'relatorio.md',
                  name: 'relatorio.md',
                  media: 'text/markdown',
                  content: '# Vendas',
                },
              ),
            ],
          }),
        ],
      })
      fireEvent.click(await screen.findByRole('button', { name: 'Abrir relatorio.md' }))
      const sheet = await screen.findByRole('dialog', { name: 'relatorio.md' })
      expect(within(sheet).getByRole('button', { name: 'Baixar' })).toBeTruthy()
      expect(within(sheet).getByRole('button', { name: 'Fechar' })).toBeTruthy()
      expect(sheet.contains(document.activeElement)).toBe(true)
      fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'relatorio.md' })).toBeNull())
    } finally {
      phone.mockRestore()
    }
  })
})
