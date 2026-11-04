import { ToolVersionId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// A ferramenta com versão nova no painel do agente (step 24.3.1, U7, criterion 32).
const server = hubServer()
const { at } = agentScreens(server)

test('versão nova: "Versão 2 disponível" e Usar a versão 2 grava o rascunho com ela', async () => {
  const NEWER = ToolVersionId.parse('55555555-aaaa-4aaa-8aaa-555555555555')
  const { tools, ...rest } = agent()
  const hub = at(`${AREA}/${AGENT}`, {
    agents: [
      { ...rest, tools: tools.map((one) => ({ ...one, latest: { id: NEWER, number: 2 } })) },
    ],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Usar a versão 2' }))
  expect(screen.getByText('Versão 2 disponível')).toBeTruthy()
  await waitFor(() => expect(hub.writes()[0]?.body).toMatchObject({ tools: [NEWER], revision: 3 }))
})
