import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AREA, AGENT, MATRIZ } from './test-agents.ts'
import { bare, catalog, readyOf } from './test-connection-tools.ts'
import { agentScreens } from './test-hub.tsx'

const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`

test('marcar todas as leituras marca as leituras do kit e deixa a consulta livre desmarcada', async () => {
  const one = bare()
  one.draft.connections = [MATRIZ]
  const hub = at(PAGE, { agents: [one], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = within(await screen.findByRole('region', { name: 'Ligações' }))
  fireEvent.click(await section.findByRole('button', { name: 'Marcar todas as leituras de Matriz' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({
    tools: [],
    ready: [
      { connectionId: MATRIZ, operation: 'pedidos' },
      { connectionId: MATRIZ, operation: 'contasAReceber' },
    ],
  })
  expect(JSON.stringify(hub.writes()[0]?.body)).not.toContain('consultar')
})

test('a janela de Adicionar da biblioteca não oferece a consulta livre', async () => {
  at(PAGE, { agents: [bare()], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const tools = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(within(tools).getByRole('button', { name: 'Adicionar da biblioteca' }))
  const dialog = within(await screen.findByRole('dialog'))
  expect(await dialog.findByRole('switch', { name: /Pedidos/ })).toBeTruthy()
  expect(dialog.queryByRole('switch', { name: /Consulta/ })).toBeNull()
})
