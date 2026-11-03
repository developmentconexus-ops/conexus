import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, version } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// As versões do agente (step 24.3, U5, criterion 27).
const server = hubServer()
const { at } = agentScreens(server)

test('voltar para uma versão que não existe mais recarrega a lista e a versão some', async () => {
  const versions = [version(3, true, 'Terceira'), version(2, false, 'Segunda')]
  const hub = at(`${AREA}/${AGENT}`, {
    agents: [agent({ state: { kind: 'PUBLISHED', version: 3, changed: false } })],
    versions,
    answers: {
      activate: () => {
        versions.pop()
        return refusal('AGENT_VERSION_NOT_FOUND')
      },
    },
  })
  const list = await screen.findByRole('region', { name: 'Versões' })
  fireEvent.click(await within(list).findByRole('button', { name: 'Voltar para a versão 2' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  await waitFor(() => expect(within(list).queryByText('v2')).toBeNull())
  expect(within(list).getByText('v3')).toBeTruthy()
})
