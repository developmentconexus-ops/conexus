import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, CHAT, TEST_CHAT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// Criterion 9 of step 24.5.1 (decision 4A): no title, the label carries the day the conversation began.
const server = hubServer()
const { at } = agentScreens(server)

test('na troca do painel, uma conversa sem título leva o dia e a hora em que começou, não os da última mudança', async () => {
  at(`${AREA}/${AGENT}/${TEST_CHAT}`, {
    agents: [agent()],
    conversations: [
      {
        id: CHAT,
        agentId: AGENT,
        draft: false,
        title: null,
        createdAt: '2026-11-01T15:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
      {
        id: TEST_CHAT,
        agentId: AGENT,
        draft: true,
        title: null,
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  const panel = await screen.findByRole('region', { name: 'Testar' })
  const switcher = await within(panel).findByRole('combobox', { name: 'Conversas' })
  fireEvent.keyDown(switcher, { key: 'ArrowDown' })
  expect(
    await screen.findByRole('option', { name: /Conversa de 01\/11\/2026, 12:00/ }),
  ).toBeTruthy()
})
