import { AGENT_TOOL, BUILDER_TOOL, CONSTRUTOR_TOOL, ConnectionId } from '@conexus/hub-api'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { wordsOf } from './connector-words.ts'
import { agentRoom, RoomContext } from './room.ts'
import type { ToolItem } from './rows.ts'
import { ToolRow } from './tool-row.tsx'

// As linhas do Construtor (step 24.3, U5): a pessoa lê o que foi feito ao agente, nunca o nome da ferramenta.
function draftRow(toolName: string): ToolItem {
  return {
    kind: 'tool',
    id: 't-1',
    toolCallId: 'call-1',
    toolName,
    state: 'result',
    args: {},
    result: { kind: 'SAVED' },
  }
}

const CONNECTION = '11111111-1111-4111-8111-111111111111'
const PROJECT = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'
const TOOL = '33333333-3333-4333-8333-333333333333'
const VERSION = '44444444-4444-4444-8444-444444444444'
const AGENT = '55555555-5555-4555-8555-555555555555'

const REFUSED = { kind: 'REFUSED', code: 'AGENT_DRAFT_INVALID' }

test('agent_draft e agent_set salvos são uma linha que abre o rascunho ao lado, com o nome do agente', () => {
  for (const [toolName, line] of [
    [CONSTRUTOR_TOOL.agentDraft, 'Montou o rascunho do agente'],
    [CONSTRUTOR_TOOL.agentSet, 'Ajustou o rascunho do agente'],
  ] as const) {
    const opened: string[] = []
    const room = { ...agentRoom('Construtor'), openAgent: (id: string) => opened.push(id) }
    const { unmount } = render(
      <RoomContext.Provider value={room}>
        <ToolRow
          tool={{
            ...draftRow(toolName),
            result: { kind: 'SAVED', agent: { id: AGENT, name: 'Vendas' } },
          }}
        />
      </RoomContext.Provider>,
    )
    // Heard as it ran or read with none open: it opens by itself; the click opens it again.
    expect(screen.getByText(line)).toBeTruthy()
    expect(screen.getByText('Vendas')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(line) }))
    expect(opened.at(-1)).toBe(AGENT)
    expect(screen.queryByText(/Agent (draft|set)/)).toBeNull()
    unmount()
  }
})

test('agent_draft recusado diz a frase de falha, sem abrir nada', () => {
  const opened: string[] = []
  const room = { ...agentRoom('Construtor'), openAgent: (id: string) => opened.push(id) }
  render(
    <RoomContext.Provider value={room}>
      <ToolRow tool={{ ...draftRow(CONSTRUTOR_TOOL.agentDraft), result: REFUSED }} />
    </RoomContext.Provider>,
  )
  expect(screen.getByText('Não conseguiu montar o rascunho')).toBeTruthy()
  expect(opened).toEqual([])
})

test('enquanto roda, agent_draft diz o que faz', () => {
  render(<ToolRow tool={{ ...draftRow(CONSTRUTOR_TOOL.agentDraft), state: 'call' }} />)
  expect(screen.getByText('Montando o rascunho do agente')).toBeTruthy()
})

test('project_read e agent_test leem como frases, sem cartão', () => {
  for (const [toolName, line] of [
    [CONSTRUTOR_TOOL.projectRead, 'Olhou o Projeto'],
    [CONSTRUTOR_TOOL.agentTest, 'Testou o agente'],
  ] as const) {
    const { unmount } = render(<ToolRow tool={draftRow(toolName)} />)
    expect(screen.getByText(line)).toBeTruthy()
    unmount()
  }
})

test('tool_search, tool_save e agent_read leem como frases, sem o nome da ferramenta', () => {
  for (const [toolName, line] of [
    [CONSTRUTOR_TOOL.toolSearch, 'Procurou ferramentas'],
    [CONSTRUTOR_TOOL.toolSave, 'Fez a ferramenta'],
    [CONSTRUTOR_TOOL.agentRead, 'Leu o rascunho do agente'],
  ] as const) {
    const { unmount } = render(<ToolRow tool={draftRow(toolName)} />)
    expect(screen.getByText(line)).toBeTruthy()
    expect(screen.queryByText(/^Usou /)).toBeNull()
    unmount()
  }
})

test('uma ferramenta do Construtor recusada diz a frase de falha, nunca a de sucesso (F-A1)', () => {
  for (const [toolName, failed] of [
    [CONSTRUTOR_TOOL.toolSave, 'Não conseguiu fazer a ferramenta'],
    [CONSTRUTOR_TOOL.agentRead, 'Não conseguiu ler o rascunho'],
    [CONSTRUTOR_TOOL.agentTest, 'Não conseguiu testar o agente'],
  ] as const) {
    const { unmount } = render(<ToolRow tool={{ ...draftRow(toolName), result: REFUSED }} />)
    expect(screen.getByText(failed)).toBeTruthy()
    expect(screen.queryByText(/^(Fez|Leu|Testou)/)).toBeNull()
    unmount()
  }
})

test('app_data_read que falhou diz a frase de falha (F-A1)', () => {
  const failed = { kind: 'FAILED', code: 'APP_DATA_TIMEOUT' }
  render(<ToolRow tool={{ ...draftRow(AGENT_TOOL.appDataRead), result: failed }} />)
  expect(screen.getByText('Não conseguiu consultar os dados do app')).toBeTruthy()
  expect(screen.queryByText('Consultou os dados do app')).toBeNull()
})

test('tool_<slug> que o conector recusou diz a frase de falha (F-A1)', () => {
  render(<ToolRow tool={{ ...draftRow('tool_vendas_ontem'), result: { kind: 'DEADLINE' } }} />)
  expect(screen.getByText('Não conseguiu consultar vendas ontem')).toBeTruthy()
  expect(screen.queryByText('Consultou vendas ontem')).toBeNull()
})

test('tool_<slug> com a conexão recusada diz a frase de falha (F-A1)', () => {
  const refused = { kind: 'AUTH_REFUSED', native: { status: 401, code: null, message: null } }
  render(<ToolRow tool={{ ...draftRow('tool_vendas_ontem'), result: refused }} />)
  expect(screen.getByText('Não conseguiu consultar vendas ontem')).toBeTruthy()
  expect(screen.queryByText('Consultou vendas ontem')).toBeNull()
})

test('uma ferramenta que deu erro diz a frase de falha (F-A1)', () => {
  render(
    <ToolRow tool={{ ...draftRow(CONSTRUTOR_TOOL.toolSave), isError: true, result: 'falhou' }} />,
  )
  expect(screen.getByText('Não conseguiu fazer a ferramenta')).toBeTruthy()
  expect(screen.queryByText('Fez a ferramenta')).toBeNull()
})

test('a conversa do Construtor e a do agente nomeiam o conector pelo catálogo (F-A2)', () => {
  const words = wordsOf([
    {
      id: 'sankhya',
      name: 'Sankhya',
      auth: 'oauth2_code',
      logo: 'data:image/svg+xml;base64,PHN2Zy8+',
    },
  ])
  const read = {
    ...draftRow(BUILDER_TOOL.connectorRead),
    args: { operation: 'sankhya.consultar', connection: 'Matriz' },
    result: { kind: 'OK', value: {}, complete: true },
  }
  render(
    <RoomContext.Provider value={agentRoom('Construtor', words)}>
      <ToolRow tool={read} />
    </RoomContext.Provider>,
  )
  expect(screen.getByText('Leu Sankhya · Matriz')).toBeTruthy()
})

test('tool_<slug> diz o que o agente consultou, nunca "Usou Tool"', () => {
  const slug = { ...draftRow('tool_vendas_ontem'), result: 'ok' }
  const { unmount } = render(<ToolRow tool={slug} />)
  expect(screen.getByText('Consultou vendas ontem')).toBeTruthy()
  expect(screen.queryByText(/Usou Tool/)).toBeNull()
  unmount()
  render(<ToolRow tool={{ ...slug, state: 'call', result: undefined }} />)
  expect(screen.getByText('Consultando vendas ontem')).toBeTruthy()
})

test('tool_<slug> diz o que o agente consultou pela descrição da ferramenta, com acento', () => {
  const room = {
    ...agentRoom('Construtor'),
    toolDescription: (slug: string) =>
      slug === 'vendas_por_regiao' ? 'vendas por região' : undefined,
  }
  render(
    <RoomContext.Provider value={room}>
      <ToolRow tool={{ ...draftRow('tool_vendas_por_regiao'), result: 'ok' }} />
    </RoomContext.Provider>,
  )
  expect(screen.getByText('Consultou vendas por região')).toBeTruthy()
  expect(screen.queryByText('Consultou vendas por regiao')).toBeNull()
})

test('a linha aberta de agent_read titula em português, nunca pelo nome da ferramenta', () => {
  render(<ToolRow tool={draftRow(CONSTRUTOR_TOOL.agentRead)} />)
  expect(screen.getAllByText('Leu o rascunho do agente')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: /Leu o rascunho do agente/ }))
  expect(screen.getAllByText('Leu o rascunho do agente')).toHaveLength(2)
  expect(screen.queryByText('Agent read')).toBeNull()
})

const CATALOG = wordsOf(
  [
    {
      id: 'sankhya',
      name: 'Sankhya',
      auth: 'oauth2_code',
      logo: 'data:image/svg+xml;base64,PHN2Zy8+',
    },
  ],
  [{ id: ConnectionId.parse(CONNECTION), connector: 'sankhya' }],
)

function inRoom(tool: ToolItem) {
  return render(
    <RoomContext.Provider value={agentRoom('Construtor', CATALOG)}>
      <ToolRow tool={tool} />
    </RoomContext.Provider>,
  )
}

test('Olhou o Projeto diz as ligações e o app ao lado', () => {
  const read = {
    project: { id: PROJECT, name: 'Vendas' },
    offered: [
      { connectionId: CONNECTION, connector: 'sankhya', name: 'Matriz', reads: [], writes: [] },
    ],
    app: { tables: [{ name: 'pedidos', columns: ['id'] }] },
    agents: [],
  }
  inRoom({ ...draftRow(CONSTRUTOR_TOOL.projectRead), result: read })
  expect(screen.getByText('Olhou o Projeto')).toBeTruthy()
  expect(screen.getByText('Sankhya · Matriz, app com 1 tabela')).toBeTruthy()
})

test('Procurou ferramentas diz quantas e, aberta, lista cada uma sem o slug', () => {
  const found = {
    tools: [
      {
        kind: 'PRESET',
        id: TOOL,
        slug: 'pedidos_matriz',
        connectionId: CONNECTION,
        operation: 'pedidos',
        description: 'Pedidos',
        effect: 'READ',
        latest: { id: VERSION, number: 1 },
        usedBy: [],
      },
    ],
    ready: [
      {
        connectionId: CONNECTION,
        operation: 'clientes',
        label: 'Clientes',
        summary: 'Os clientes',
        slug: 'clientes_matriz',
      },
    ],
    automations: [],
  }
  inRoom({ ...draftRow(CONSTRUTOR_TOOL.toolSearch), result: found })
  expect(screen.getByText('2 ferramentas')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Procurou ferramentas/ }))
  expect(screen.getByText('Pedidos')).toBeTruthy()
  expect(screen.getByText('v1')).toBeTruthy()
  expect(screen.getByText('Clientes')).toBeTruthy()
  expect(screen.getByText('pronta')).toBeTruthy()
  expect(screen.queryByText('pedidos_matriz')).toBeNull()
})

test('Testou o agente diz a pergunta ao lado e, aberta, a resposta', () => {
  inRoom({
    ...draftRow(CONSTRUTOR_TOOL.agentTest),
    args: { agentId: AGENT, question: 'Quanto vendemos?' },
    result: { kind: 'ANSWERED', text: 'Vendemos **12** pedidos.', tools: ['tool_pedidos'] },
  })
  expect(screen.getByText('Quanto vendemos?')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Testou o agente/ }))
  expect(screen.getByText('12')).toBeTruthy()
  expect(screen.getByText('Chamou 1 ferramenta')).toBeTruthy()
})

// A ferramenta em código (step 24.4, U2): a pessoa lê o que o Construtor fez e o que o teste leu.
const CODE_VERSION = {
  ...{ kind: 'CODE', id: VERSION, number: 1, description: 'Soma as vendas.' },
  ...{ source: 'export default {}', reads: ['pedidos'], inputSchema: {}, outputSchema: {} },
  test: { passed: true, rows: 251, at: '2026-11-05T12:00:00.000Z' },
}
const SAVED_CODE = {
  kind: 'SAVED',
  tool: {
    ...{ kind: 'CODE', id: TOOL, slug: 'vendas', connectionId: CONNECTION, reads: ['pedidos'] },
    readLabels: { pedidos: 'Pedidos' },
    ...{ description: 'Soma as vendas.', connectionName: 'Matriz', effect: 'READ', usedBy: [] },
    latest: { id: VERSION, number: 1 },
    versions: [CODE_VERSION],
  },
}

test('tool_code_save diz Escrevendo e testando enquanto roda, e o que o teste leu quando grava', () => {
  const running = render(
    <ToolRow tool={{ ...draftRow(CONSTRUTOR_TOOL.toolCodeSave), state: 'call' }} />,
  )
  expect(screen.getByText('Escrevendo e testando uma ferramenta')).toBeTruthy()
  running.unmount()
  render(<ToolRow tool={{ ...draftRow(CONSTRUTOR_TOOL.toolCodeSave), result: SAVED_CODE }} />)
  expect(screen.getByText('Escreveu e testou uma ferramenta')).toBeTruthy()
  expect(screen.getByText('Testei com 251 linhas')).toBeTruthy()
})

test('tool_code_save com o teste que não passou diz O teste não passou e o erro; uma recusa diz a frase de falha', () => {
  const failed = render(
    <ToolRow
      tool={{
        ...draftRow(CONSTRUTOR_TOOL.toolCodeSave),
        result: { kind: 'REFUSED', code: 'TOOL_TEST_FAILED', output: 'expected 5, got 6' },
      }}
    />,
  )
  expect(screen.getByText('O teste não passou')).toBeTruthy()
  expect(screen.getByText('expected 5, got 6')).toBeTruthy()
  failed.unmount()
  render(
    <ToolRow
      tool={{
        ...draftRow(CONSTRUTOR_TOOL.toolCodeSave),
        result: {
          kind: 'REFUSED',
          code: 'TOOL_REFUSED',
          field: 'source',
          reason: 'MODULE_STATE',
          output: 'MODULE_STATE: a `let` or `var` outside a function keeps state between calls',
        },
      }}
    />,
  )
  expect(screen.getByText('Não conseguiu fazer a ferramenta')).toBeTruthy()
  expect(screen.queryByText(/^Escreveu/)).toBeNull()
  expect(screen.queryByText(/MODULE_STATE/)).toBeNull()
})
