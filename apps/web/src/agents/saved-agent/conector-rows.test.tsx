import {
  AGENTS_CONTROLLER,
  BUILDER_ROUTES,
  BUILDER_TOOL,
  CONSTRUTOR_CONTROLLER,
} from '@conexus/hub-api'
import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { SANKHYA, toolSaid } from '../assistant/test-hub.tsx'
import { AGENT, AREA, agent, BUILDER_CHAT, CHAT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// F-A2 (step 24.3): the Construtor's and the agent's conversations name a connector by the catalog's words.
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
      `*${BUILDER_ROUTES}/agent-controller/${controller}/sessions/:id/threads/:t/messages`,
      () =>
        HttpResponse.json({
          messages: [
            toolSaid(BUILDER_TOOL.connectorRead, READ, { kind: 'OK', value: {}, complete: true }),
          ],
        }),
    ),
  )
}

test('a conversa do Construtor lê "Leu Sankhya · Matriz"', async () => {
  at(`${AREA}/construtor/${BUILDER_CHAT}`, {
    agents: [],
    construtor: [{ id: BUILDER_CHAT, title: 'x', createdAt: UPDATED, updatedAt: UPDATED }],
  })
  stored(CONSTRUTOR_CONTROLLER)
  expect(await screen.findByText('Leu Sankhya · Matriz')).toBeTruthy()
})

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
