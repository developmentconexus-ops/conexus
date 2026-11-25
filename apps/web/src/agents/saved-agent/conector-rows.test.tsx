import { AGENTS_CONTROLLER, CONVERSATION_ROUTES, CONVERSATION_TOOL } from '@conexus/hub-api'
import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { SANKHYA, toolSaid } from '../assistant/test-hub.tsx'
import { AGENT, AREA, agent, CHAT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// F-A2 (step 24.3): the agent's conversation names a connector by the catalog's words.
const server = hubServer()
const { at } = agentScreens(server)
const READ = { operation: 'sankhya.consultar', connection: 'Matriz' }
const UPDATED = '2026-11-02T12:00:00.000Z'

function stored(controller: string) {
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: false }),
    ),
    http.get(
      `*${CONVERSATION_ROUTES}/agent-controller/${controller}/sessions/:id/threads/:t/messages`,
      () =>
        HttpResponse.json({
          messages: [
            toolSaid(CONVERSATION_TOOL.connectorRead, READ, {
              kind: 'OK',
              value: {},
              complete: true,
            }),
          ],
        }),
    ),
  )
}

test('a conversa do agente lê "Leu Sankhya · Matriz"', async () => {
  at(`${AREA}/${AGENT}/${CHAT}`, {
    agents: [agent()],
    conversations: [
      {
        id: CHAT,
        agentId: AGENT,
        draft: false,
        title: 'x',
        createdAt: UPDATED,
        updatedAt: UPDATED,
      },
    ],
  })
  stored(AGENTS_CONTROLLER)
  expect(await screen.findByText('Leu Sankhya · Matriz')).toBeTruthy()
})
