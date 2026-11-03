import type { AgentId } from '@conexus/hub-api'
import { CONSTRUTOR_TOOL } from '@conexus/hub-api'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useMemo, useState } from 'react'
import { expect, test } from 'vitest'
import { agentRoom, RoomContext } from './room.ts'
import type { ToolItem } from './rows.ts'
import { ToolRow } from './tool-row.tsx'

// The Construtor's agent line heard as it ran (step 24.3, criterion 26).
const FIRST = '11111111-1111-4111-8111-111111111111'
const SECOND = '22222222-2222-4222-8222-222222222222'

function heard(id: string, agentId: string, name: string): ToolItem {
  const item: ToolItem = {
    kind: 'tool',
    id,
    toolCallId: `call-${id}`,
    toolName: CONSTRUTOR_TOOL.agentDraft,
    args: {},
    result: { kind: 'SAVED', agent: { id: agentId, name } },
    state: 'result',
    startedAt: Date.now(),
  }
  return item
}

function Host() {
  const [opened, setOpened] = useState<AgentId>()
  const room = useMemo(
    () => ({ ...agentRoom('Construtor'), openAgent: setOpened, openedAgent: opened }),
    [opened],
  )
  return (
    <RoomContext.Provider value={room}>
      <ToolRow tool={heard('a', FIRST, 'Primeiro agente')} />
      <ToolRow tool={heard('b', SECOND, 'Segundo agente')} />
      <output>{opened}</output>
    </RoomContext.Provider>
  )
}

test("tapping an older agent's line keeps that agent open", async () => {
  render(<Host />)
  expect((await screen.findByRole('status')).textContent).toBe(SECOND)
  await act(async () => fireEvent.click(screen.getByRole('button', { name: /Primeiro agente/ })))
  expect(screen.getByRole('status').textContent).toBe(FIRST)
})
