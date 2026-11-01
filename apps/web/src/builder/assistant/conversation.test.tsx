import { BUILDER_TOOL, CompanyId, WORKSPACE_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import {
  observationFailed,
  stepStarted,
  toolCall,
  updatePart,
} from '../conversation/test-events.ts'
import { personSaid, reachTop } from '../conversation/test-stream.tsx'
import { assistantConversationsQuery } from './queries.ts'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
  PEDIDOS_ID,
  running,
  SALES,
  toolSaid,
} from './test-hub.tsx'

// A conversation with the Assistant: the bar, the rows, the address it lives at (step 24.1, criteria 23a to 26).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const OF_PROJECT = `${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant/${ASKED}`

async function field() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
}

async function barOf() {
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy())
  return bar
}

async function turnOff(bar: HTMLElement, name: string) {
  fireEvent.click(within(bar).getByRole('button', { name: 'Ajustar' }))
  fireEvent.click(await screen.findByRole('switch', { name }))
}

const READ = { operation: 'sankhya.consultar', connection: 'Vendas' }

describe('a barra', () => {
  test('a conversa abre com a caixa do Assistente e a barra das ligações escolhidas', async () => {
    at(OPEN, { conversations: [assistantConversation()] })
    expect(await field()).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Vendas da semana' })).toBeTruthy()
    const bar = await barOf()
    expect(within(bar).getByText('Sankhya · Estoque')).toBeTruthy()
  })

  test('tirar uma ligação da barra grava a escolha e a barra mostra o que o Hub respondeu', async () => {
    const { writes } = at(OPEN, { conversations: [assistantConversation()] })
    const bar = await barOf()
    await turnOff(bar, 'Sankhya · Estoque')
    await waitFor(() => expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull())
    const [put] = writes()
    expect(put?.method).toBe('PUT')
    expect(put?.path).toMatch(/\/connections$/)
    expect(put?.body).toEqual({ connections: [SALES] })
    expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy()
  })

  test('enquanto a troca viaja, a barra já mostra a escolha e as chaves esperam', async () => {
    let release: () => void = () => undefined
    const hold = new Promise<void>((resolve) => {
      release = resolve
    })
    at(OPEN, { conversations: [assistantConversation()], answers: { hold } })
    const bar = await barOf()
    await turnOff(bar, 'Sankhya · Estoque')
    await waitFor(() => expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull())
    expect(
      screen.getByRole('switch', { name: 'Sankhya · Vendas' }).getAttribute('aria-disabled'),
    ).toBe('true')
    release()
    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: 'Sankhya · Vendas' }).hasAttribute('disabled'),
      ).toBe(false),
    )
    expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull()
  })

  test('o Hub recusar a troca devolve a barra à escolha de antes e diz que não confirmou', async () => {
    at(OPEN, {
      conversations: [assistantConversation()],
      answers: { choose: () => refusal('DATABASE_UNAVAILABLE') },
    })
    const bar = await barOf()
    await turnOff(bar, 'Sankhya · Estoque')
    expect(await screen.findByRole('alert')).toBeTruthy()
    await waitFor(() => expect(within(bar).getByText('Sankhya · Estoque')).toBeTruthy())
  })

  test('na conversa de um Projeto a barra oferece as ligações dele e mostra o Projeto fixo', async () => {
    at(OF_PROJECT, { conversations: [assistantConversation({ projectId: PEDIDOS_ID })] })
    expect(await field()).toBeTruthy()
    const bar = await barOf()
    expect(await within(bar).findByText(`Projeto · ${PEDIDOS.name}`)).toBeTruthy()
    expect(within(bar).queryByRole('combobox')).toBeNull()
  })

  test('na conversa da empresa a barra não nomeia Projeto nenhum', async () => {
    at(OPEN, { conversations: [assistantConversation()] })
    const bar = await barOf()
    expect(within(bar).queryByText(/^Projeto ·/)).toBeNull()
  })
})

describe('não encontrado', () => {
  test('a conversa de um Projeto no endereço da empresa não é encontrada', async () => {
    at(OPEN, { conversations: [assistantConversation({ projectId: PEDIDOS_ID })] })
    expect(await screen.findByText('Voltar ao início')).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeNull()
  })

  test('a conversa da empresa no endereço de um Projeto não é encontrada', async () => {
    at(OF_PROJECT, { conversations: [assistantConversation()] })
    expect(await screen.findByText('Voltar ao início')).toBeTruthy()
  })

  test('uma conversa que não existe, ou que é de outra pessoa, não é encontrada', async () => {
    at(`${COMPANY_ROOT}/conversations/${ELSEWHERE}`, { conversations: [assistantConversation()] })
    expect(await screen.findByText('Voltar ao início')).toBeTruthy()
  })
})

describe('as leituras e os comandos', () => {
  test('uma leitura de um sistema aparece como "Leu <Conector> · <ligação>" com as linhas', async () => {
    at(OPEN, {
      conversations: [
        assistantConversation({
          messages: [
            toolSaid(BUILDER_TOOL.connectorRead, READ, {
              kind: 'OK',
              value: { linhas: [{}, {}, {}] },
              complete: false,
            }),
          ],
        }),
      ],
    })
    expect(await screen.findByText(/Leu Sankhya · Vendas/)).toBeTruthy()
    expect(screen.getByText(/3 linhas, há mais/)).toBeTruthy()
  })

  test('uma leitura em andamento aparece como "Lendo <Conector> · <ligação>" e termina como "Leu"', async () => {
    const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
    line.emit(stepStarted('step-1', [toolCall(BUILDER_TOOL.connectorRead, READ)]))
    expect(await screen.findByText('Lendo Sankhya · Vendas')).toBeTruthy()
    line.emit(
      updatePart(
        toolCall(BUILDER_TOOL.connectorRead, READ, { kind: 'OK', value: { linhas: [{}] } }),
        0,
        'step-1',
      ),
    )
    expect(await screen.findByText(/Leu Sankhya · Vendas/)).toBeTruthy()
    expect(screen.queryByText('Lendo Sankhya · Vendas')).toBeNull()
    expect(screen.getByText('1 linha')).toBeTruthy()
  })

  test('uma leitura sem linhas diz "Nenhuma linha."', async () => {
    at(OPEN, {
      conversations: [
        assistantConversation({
          messages: [
            toolSaid(BUILDER_TOOL.connectorRead, READ, { kind: 'OK', value: { linhas: [] } }),
          ],
        }),
      ],
    })
    expect(await screen.findByText('Nenhuma linha.')).toBeTruthy()
  })

  test('uma leitura que o sistema recusou pede para conectar de novo, com o caminho para Integrações', async () => {
    at(OPEN, {
      conversations: [
        assistantConversation({
          messages: [toolSaid(BUILDER_TOOL.connectorRead, READ, { kind: 'AUTH_REFUSED' })],
        }),
      ],
    })
    expect(await screen.findByText(/Sankhya pediu para conectar de novo/)).toBeTruthy()
    fireEvent.click(screen.getByText(/Sankhya pediu para conectar de novo/))
    const link = await screen.findByRole('link', { name: 'Abrir Integrações' })
    expect(link.getAttribute('href')).toBe(`${COMPANY_ROOT}/integrations`)
  })

  test('uma leitura que falhou diz a frase do código e não oferece o caminho para Integrações', async () => {
    at(OPEN, {
      conversations: [
        assistantConversation({
          messages: [toolSaid(BUILDER_TOOL.connectorRead, READ, { kind: 'DEADLINE' })],
        }),
      ],
    })
    expect(await screen.findByText('O sistema demorou demais para responder.')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Abrir Integrações' })).toBeNull()
  })
})

test('a conversa sumir do Hub marca as recentes para serem lidas de novo', async () => {
  const { conexus } = at(OPEN, {
    conversations: [assistantConversation()],
    answers: { stream: () => refusal('CONVERSATION_NOT_FOUND') },
  })
  const recents = assistantConversationsQuery(CompanyId.parse(COMPANY.id), undefined, undefined)
  await conexus.queryClient.fetchQuery(recents)
  await waitFor(() =>
    expect(conexus.queryClient.getQueryState(recents.queryKey)?.isInvalidated).toBe(true),
  )
})

describe('os comandos', () => {
  test('um comando na máquina aparece como a linha de comando do Builder', async () => {
    at(OPEN, {
      conversations: [
        assistantConversation({
          messages: [
            toolSaid(
              WORKSPACE_TOOL.executeCommand,
              { command: 'python grafico.py' },
              { exitCode: 0 },
            ),
          ],
        }),
      ],
    })
    expect(await screen.findByText('Rodou um comando python grafico.py')).toBeTruthy()
  })
})

describe('o histórico', () => {
  test('uma conversa com mais de 100 mensagens mostra as últimas 100 e traz as anteriores ao chegar ao topo', async () => {
    const messages = Array.from({ length: 150 }, (_, index) =>
      personSaid(`mensagem ${index}`, `p${index}`),
    )
    at(OPEN, { conversations: [assistantConversation({ messages })] })
    expect(await screen.findByText('mensagem 149')).toBeTruthy()
    expect(screen.getByText('mensagem 50')).toBeTruthy()
    expect(screen.queryByText('mensagem 49')).toBeNull()
    reachTop()
    expect(await screen.findByText('mensagem 0')).toBeTruthy()
  })

  test('uma falha da memória aparece pelo tipo, sem o texto do fornecedor', async () => {
    const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
    line.emit(observationFailed())
    expect(await screen.findByLabelText('Falha na memória')).toBeTruthy()
    expect(screen.queryByText(/ECONNRESET/)).toBeNull()
  })
})
