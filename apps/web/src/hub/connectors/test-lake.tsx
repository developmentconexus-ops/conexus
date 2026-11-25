import { fireEvent, screen } from '@testing-library/react'
import type { hubServer } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'

export const MATRIZ = connectionOf({ name: 'Matriz', state: 'ACTIVE' })

/** The Sankhya connection's page on a Hub that holds `fields`, with the tab "Tabelas" open. */
export async function openTables(
  server: ReturnType<typeof hubServer>,
  fields: Partial<View> = {},
  answers: Answers = {},
) {
  const view = viewOf({ connections: [MATRIZ], ...fields })
  const hub = connectionsHub(view, answers)
  server.use(...hub.handlers)
  mount(pageOf(MATRIZ))
  fireEvent.click(await screen.findByRole('tab', { name: 'Tabelas' }))
  return {
    view,
    sent: hub.sent,
    section: await screen.findByRole('region', { name: 'Tabelas no lago' }),
  }
}
