import type { ConstrutorResult } from '@conexus/hub-api'
import { AGENT_TOOL, AgentId, BUILDER_TOOL, CONSTRUTOR_TOOL } from '@conexus/hub-api'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AGENT, agent, OTHER_AGENT } from '../agents/test-agents.ts'
import { BuilderTurn } from './builder-turn.tsx'
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

const REFUSED = { kind: 'REFUSED', code: 'AGENT_DRAFT_INVALID' }

test('agent_draft e agent_set desenham o cartão do quarto no lugar da linha, sem o nome da ferramenta', () => {
  for (const toolName of [CONSTRUTOR_TOOL.agentDraft, CONSTRUTOR_TOOL.agentSet]) {
    const room = { ...agentRoom('Construtor'), agentCard: () => <p>cartão do rascunho</p> }
    const { unmount } = render(
      <RoomContext.Provider value={room}>
        <ToolRow tool={{ ...draftRow(toolName), result: REFUSED }} />
      </RoomContext.Provider>,
    )
    expect(screen.getByText('cartão do rascunho')).toBeTruthy()
    expect(screen.queryByText(/Agent (draft|set)/)).toBeNull()
    unmount()
  }
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
  const words = wordsOf([{ id: 'sankhya', name: 'Sankhya', auth: 'oauth2_code' }])
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

test('a linha aberta de agent_read titula em português, nunca pelo nome da ferramenta', () => {
  render(<ToolRow tool={draftRow(CONSTRUTOR_TOOL.agentRead)} />)
  expect(screen.getAllByText('Leu o rascunho do agente')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: /Leu o rascunho do agente/ }))
  expect(screen.getAllByText('Leu o rascunho do agente')).toHaveLength(2)
  expect(screen.queryByText('Agent read')).toBeNull()
})

test('duas chamadas do mesmo agente na resposta desenham um cartão só, no último resultado; as anteriores ficam como linha', () => {
  function saved(id: string, agentId: string, name: string): ToolItem {
    return {
      ...draftRow(CONSTRUTOR_TOOL.agentDraft),
      id,
      toolCallId: id,
      result: { kind: 'SAVED', agent: { ...agent(), id: AgentId.parse(agentId), name } },
    }
  }
  const room = {
    ...agentRoom('Construtor'),
    agentCard: (result: ConstrutorResult) => (
      <p>{result.kind === 'SAVED' ? `cartão ${result.agent.name}` : 'recusa'}</p>
    ),
  }
  render(
    <RoomContext.Provider value={room}>
      <BuilderTurn
        model={null}
        streaming={false}
        onAsk={() => undefined}
        items={[
          saved('a', AGENT, 'Primeiro'),
          saved('b', OTHER_AGENT, 'Outro'),
          { ...saved('c', AGENT, 'Segundo'), toolName: CONSTRUTOR_TOOL.agentSet },
        ]}
      />
    </RoomContext.Provider>,
  )
  expect(screen.queryByText('cartão Primeiro')).toBeNull()
  expect(screen.getAllByText(/^cartão /).map((each) => each.textContent)).toEqual([
    'cartão Outro',
    'cartão Segundo',
  ])
  expect(screen.getByText('Montou o rascunho do agente')).toBeTruthy()
})
