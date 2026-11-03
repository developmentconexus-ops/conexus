import { BUILDER_TOOL, WORKSPACE_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { START_NO_ACCOUNT } from '../conversation/public.ts'
import {
  observationFailed,
  stepStarted,
  toolCall,
  updatePart,
} from '../conversation/test-events.ts'
import { personSaid, reachTop } from '../conversation/test-stream.tsx'
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

// A conversation with the Assistant: the box's row, the rows, the address it lives at (step 24.1, criteria 23a to 26).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const OF_PROJECT = `${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant/${ASKED}`

async function field() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
}

/** The tools button of the box's row, by its count. */
async function toolsOf(name = '2 ferramentas') {
  return screen.findByRole('button', { name })
}

async function turnOff(name: string) {
  fireEvent.click(await screen.findByRole('button', { name: /ferramentas?$/ }))
  fireEvent.click(await screen.findByRole('switch', { name }))
}

const READ = { operation: 'sankhya.consultar', connection: 'Vendas' }

describe('a linha da caixa', () => {
  test('a conversa abre com a caixa do Assistente, a memória e as ferramentas escolhidas', async () => {
    at(OPEN, { conversations: [assistantConversation()] })
    expect(await field()).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Vendas da semana' })).toBeTruthy()
    await toolsOf()
    expect(screen.getByRole('button', { name: /Memória da conversa/ })).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Ligações da conversa' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajustar' })).toBeNull()
  })

  test('o modelo da conversa aparece à direita, só para leitura', async () => {
    at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    const model = screen.getByRole('combobox', { name: 'Modelo e raciocínio' })
    expect(model.hasAttribute('disabled') || model.getAttribute('aria-disabled') === 'true').toBe(
      true,
    )
    expect(model.textContent).toMatch(/Sonnet/)
  })

  test('tirar uma ferramenta grava a escolha e a contagem mostra o que o Hub respondeu', async () => {
    const { writes } = at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    await turnOff('Sankhya · Estoque')
    await toolsOf('1 ferramenta')
    const [put] = writes()
    expect(put?.method).toBe('PUT')
    expect(put?.path).toMatch(/\/connections$/)
    expect(put?.body).toEqual({ connections: [SALES] })
    expect(
      screen.getByRole('switch', { name: 'Sankhya · Vendas' }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      screen.getByRole('switch', { name: 'Sankhya · Estoque' }).getAttribute('aria-checked'),
    ).toBe('false')
  })

  test('enquanto a troca viaja, a contagem já mostra a escolha e as chaves esperam', async () => {
    let release: () => void = () => undefined
    const hold = new Promise<void>((resolve) => {
      release = resolve
    })
    at(OPEN, { conversations: [assistantConversation()], answers: { hold } })
    await toolsOf()
    await turnOff('Sankhya · Estoque')
    await toolsOf('1 ferramenta')
    expect(
      screen.getByRole('switch', { name: 'Sankhya · Vendas' }).getAttribute('aria-disabled'),
    ).toBe('true')
    release()
    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: 'Sankhya · Vendas' }).hasAttribute('disabled'),
      ).toBe(false),
    )
    await toolsOf('1 ferramenta')
  })

  test('o Hub recusar a troca devolve a contagem à escolha de antes e diz que não confirmou', async () => {
    at(OPEN, {
      conversations: [assistantConversation()],
      answers: { choose: () => refusal('DATABASE_UNAVAILABLE') },
    })
    await toolsOf()
    await turnOff('Sankhya · Estoque')
    expect(await screen.findByRole('alert')).toBeTruthy()
    await toolsOf('2 ferramentas')
  })
})

describe('a pasta', () => {
  test('na conversa de um Projeto a pasta mostra o nome dele e não abre nada', async () => {
    at(OF_PROJECT, { conversations: [assistantConversation({ projectId: PEDIDOS_ID })] })
    expect(await field()).toBeTruthy()
    const left = (await toolsOf()).parentElement
    expect(await within(left ?? document.body).findByText(PEDIDOS.name)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Projeto da conversa' })).toBeNull()
  })

  test('na conversa da empresa a pasta fica apagada, com o nome "Conversa sem Projeto", e não abre nada', async () => {
    at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    const folder = screen.getByRole('img', { name: 'Conversa sem Projeto' })
    expect(folder.closest('button')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Projeto da conversa' })).toBeNull()
  })
})

test('na conversa da empresa, o Início da barra lateral está marcado como o lugar atual (K28)', async () => {
  at(OPEN, { conversations: [assistantConversation()] })
  await field()
  const nav = within(screen.getByRole('navigation', { name: 'Navegação' }))
  expect(nav.getByRole('link', { name: 'Início' }).getAttribute('aria-current')).toBe('page')
  expect(nav.getByRole('link', { name: 'Integrações' }).getAttribute('aria-current')).toBeNull()
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

  test('uma leitura que o sistema recusou diz que as chaves foram recusadas, com o caminho para Integrações', async () => {
    at(OPEN, {
      conversations: [
        assistantConversation({
          messages: [toolSaid(BUILDER_TOOL.connectorRead, READ, { kind: 'AUTH_REFUSED' })],
        }),
      ],
    })
    expect(await screen.findByText(/As chaves foram recusadas pelo Sankhya\./)).toBeTruthy()
    fireEvent.click(screen.getByText(/As chaves foram recusadas pelo Sankhya\./))
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

test('a conversa sumir do Hub faz as recentes serem lidas de novo', async () => {
  let reads = 0
  at(OPEN, {
    conversations: [assistantConversation()],
    answers: {
      stream: () => refusal('CONVERSATION_NOT_FOUND'),
      list: () => {
        reads += 1
        return undefined
      },
    },
  })
  await waitFor(() => expect(reads).toBeGreaterThan(1))
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

  test('a máquina ligando aparece como "Ligando a máquina…", a linha do Builder (QA F1)', async () => {
    const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
    line.emit(
      stepStarted(`${ASKED}:machine`, [
        { type: 'data-conexus-machine', data: { phase: 'starting' } },
      ]),
    )
    expect(await screen.findByText('Ligando a máquina…')).toBeTruthy()
  })

  test('o turno sem conta de modelo diz a frase do Início, sem mandar escolher outro modelo (QA F6)', async () => {
    const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
    line.emit(
      stepStarted(`${ASKED}:failure`, [
        { type: 'data-conexus-failure', data: { code: 'MODEL_NO_ACCOUNT' } },
      ]),
    )
    expect(await screen.findByText(START_NO_ACCOUNT)).toBeTruthy()
    expect(screen.queryByText(/Escolha outro modelo/)).toBeNull()
  })

  test('uma falha da memória aparece pelo tipo, sem o texto do fornecedor', async () => {
    const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
    line.emit(observationFailed())
    expect(await screen.findByLabelText('Falha na memória')).toBeTruthy()
    expect(screen.queryByText(/ECONNRESET/)).toBeNull()
  })
})
