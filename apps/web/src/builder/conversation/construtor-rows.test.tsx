import { CONSTRUTOR_TOOL } from '@conexus/hub-api'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
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
    result: { kind: 'REFUSED', code: 'AGENT_DRAFT_INVALID' },
  }
}

test('agent_draft e agent_set desenham o cartão do quarto no lugar da linha, sem o nome da ferramenta', () => {
  for (const toolName of [CONSTRUTOR_TOOL.agentDraft, CONSTRUTOR_TOOL.agentSet]) {
    const room = { ...agentRoom('Construtor'), agentCard: () => <p>cartão do rascunho</p> }
    const { unmount } = render(
      <RoomContext.Provider value={room}>
        <ToolRow tool={draftRow(toolName)} />
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

test('tool_<slug> diz o que o agente consultou, nunca "Usou Tool"', () => {
  const slug = { ...draftRow('tool_vendas_ontem'), result: 'ok' }
  const { unmount } = render(<ToolRow tool={slug} />)
  expect(screen.getByText('Consultou vendas ontem')).toBeTruthy()
  expect(screen.queryByText(/Usou Tool/)).toBeNull()
  unmount()
  render(<ToolRow tool={{ ...slug, state: 'call', result: undefined }} />)
  expect(screen.getByText('Consultando vendas ontem')).toBeTruthy()
})
