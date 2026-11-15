import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { assistantConversation, assistantScreens, COMPANY_ROOT } from './test-hub.tsx'

// Criterion 9 of step 24.5.1 (decision 4A): no title, the label carries the day the conversation began.
const server = hubServer()
const { at } = assistantScreens(server)

test('na lista lateral, uma conversa sem título leva o dia e a hora em que começou, não os da última mudança', async () => {
  at(COMPANY_ROOT, {
    conversations: [
      assistantConversation({
        title: null,
        createdAt: '2026-11-01T15:00:00.000Z',
        updatedAt: '2026-11-02T16:00:00.000Z',
      }),
    ],
  })
  const nav = await screen.findByRole('navigation', { name: 'Navegação' })
  expect(
    await within(nav).findByRole('link', { name: /Conversa de 01\/11\/2026, 12:00/ }),
  ).toBeTruthy()
})
