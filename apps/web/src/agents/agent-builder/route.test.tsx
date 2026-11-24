import { screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AREA, BUILDER_CHAT } from '../saved-agent/test-agents.ts'
import { agentScreens } from '../saved-agent/test-hub.tsx'

const server = hubServer()
const { at } = agentScreens(server)
const NEW = `${AREA}/agent-builder/${BUILDER_CHAT}`
const OLD = `${AREA}/construtor/${BUILDER_CHAT}`
const MINE = {
  id: BUILDER_CHAT,
  title: 'Ideias',
  createdAt: '2026-11-04T12:51:00.000Z',
  updatedAt: '2026-11-04T12:51:00.000Z',
}

test('o endereço antigo da conversa com o Construtor abre a mesma conversa no novo, sem nova entrada no histórico', async () => {
  const { conexus } = at(AREA, { agents: [], construtor: [MINE] })
  await screen.findByRole('textbox', { name: 'Mensagem para o Conexus' })
  conexus.router.history.push(OLD)
  await waitFor(() => expect(conexus.router.state.location.pathname).toBe(NEW))
  await screen.findByRole('textbox', { name: 'Mensagem para o Conexus' })
  expect(conexus.router.history.length).toBe(2)
})

test.each([
  ['o novo', NEW],
  ['o antigo', OLD],
])(
  'uma conversa que não é da pessoa dá a tela de não achada em %s endereço',
  async (_name, path) => {
    const { conexus } = at(path, { agents: [], construtor: [] })
    expect(await screen.findByText('Esta conversa não existe mais.')).toBeTruthy()
    await waitFor(() => expect(conexus.router.state.location.pathname).toBe(NEW))
    expect(screen.queryByRole('textbox', { name: 'Mensagem para o Conexus' })).toBeNull()
  },
)
