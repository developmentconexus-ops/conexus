import { AutomationId } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
} from './test-hub.tsx'

// The Automação badge on the conversations an automation's run opened (step 24.2, U3).
const server = hubServer()
const { at } = assistantScreens(server)
const AUTOMATION = AutomationId.parse(
  'schedule_conexus-automation-11111111-1111-4111-8111-111111111111',
)

test('a etiqueta: a conversa que uma automação abriu mostra Automação · nome nas recentes e no topo da conversa; a outra não', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    conversations: [
      assistantConversation({
        title: 'Resumo de ontem',
        automation: { automationId: AUTOMATION, name: 'Resumo de vendas' },
      }),
      assistantConversation({ id: ELSEWHERE, title: 'Conversa da pessoa' }),
    ],
  })
  const recent = (await screen.findByRole('link', { name: /Resumo de ontem/ })).closest('li')
  if (recent === null) throw new Error('the recent conversation has no row')
  expect(within(recent).getByText('Automação · Resumo de vendas')).toBeTruthy()
  const other = (await screen.findByRole('link', { name: /Conversa da pessoa/ })).closest('li')
  if (other === null) throw new Error('the other conversation has no row')
  expect(within(other).queryByText(/Automação ·/)).toBeNull()

  fireEvent.click(within(recent).getByRole('link', { name: /Resumo de ontem/ }))
  const header = await screen.findByRole('heading', { name: 'Resumo de ontem' })
  expect(header.parentElement?.textContent).toContain('Automação · Resumo de vendas')
  expect(conexus.router.state.location.pathname).toContain(ASKED)
})
