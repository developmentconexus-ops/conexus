import { listConnections } from '@conexus/hub-api'
import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { KIT_SANKHYA as SANKHYA } from '../../platform/test-kit.ts'
import { conversationOf, FIRST, screens } from './test-hub.tsx'
import { recordedRun } from './test-recorded.ts'

const server = hubServer()
const { openConversation } = screens(server)

const ASKED = recordedRun('data-query').read.findLast((message) => message.role === 'assistant')

test('a sala do Builder diz da fonte o mesmo nome e a mesma logo da sala do Assistente', async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-14T15:30:00.000Z') })
  try {
    if (ASKED === undefined) throw new Error('the recording holds no answer')
    server.use(
      http.get('*/api/companies/:companyId/connections', () =>
        HttpResponse.json(
          listConnections.success.body.parse({
            connectors: [SANKHYA],
            connections: [],
            mayManage: true,
          }),
        ),
      ),
    )
    await openConversation(conversationOf({ id: FIRST, messages: [ASKED] }))
    const sources = await screen.findByRole('region', { name: 'Fontes' })
    await within(sources).findByText('Sankhya · Matriz')
    expect(sources.querySelector('img')?.getAttribute('src')).toContain(
      encodeURIComponent(SANKHYA.logo),
    )
  } finally {
    vi.useRealTimers()
  }
})
