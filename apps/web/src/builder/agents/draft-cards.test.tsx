import type { ConstrutorResult } from '@conexus/hub-api'
import { AgentId, CONSTRUTOR_TOOL } from '@conexus/hub-api'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { agentRoom, BuilderTurn, RoomContext } from '../conversation/public.ts'
import { AGENT, agent, OTHER_AGENT } from './test-agents.ts'

// Um cartão do rascunho por agente em cada resposta do Construtor (step 24.3, criterion 26).
test('duas chamadas do mesmo agente na resposta desenham um cartão só, no último resultado; as anteriores ficam como linha', () => {
  function saved(
    id: string,
    agentId: string,
    name: string,
    toolName: string = CONSTRUTOR_TOOL.agentDraft,
  ): Parameters<typeof BuilderTurn>[0]['items'][number] {
    return {
      kind: 'tool',
      state: 'result',
      args: {},
      toolName,
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
          saved('c', AGENT, 'Segundo', CONSTRUTOR_TOOL.agentSet),
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
