import { AGENTS_CONTROLLER, BUILDER_ROUTES, MACHINE_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { toolSaid } from '../assistant/test-hub.tsx'
import { AGENT, AREA, agent, CHAT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// The agent's Computador (step 24.4, U4): the row among Conexus's tools, and the file its machine shows beside the conversation.
const server = hubServer()
const { at } = agentScreens(server)
const UPDATED = '2026-11-02T12:00:00.000Z'
const PAGE = `${AREA}/${AGENT}`

test('Computador é uma ferramenta do Conexus: ligar a chave e Usar as escolhidas manda { machine: true } e a linha aparece em Ferramentas', async () => {
  const hub = at(PAGE, { agents: [agent({ tools: [] })] })
  const tools = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(within(tools).getByRole('button', { name: 'Adicionar da biblioteca' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(await within(dialog).findByRole('switch', { name: 'Computador' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Usar as escolhidas' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ machine: true })
  expect(await within(tools).findByText('Computador')).toBeTruthy()
})

test('o Computador ligado no rascunho é uma linha com Tirar, que manda { machine: false }', async () => {
  const base = agent({ tools: [] })
  const hub = at(PAGE, { agents: [{ ...base, draft: { ...base.draft, machine: true } }] })
  const tools = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(within(tools).getByRole('button', { name: 'Tirar Computador' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ machine: false })
})

test('o arquivo que o Computador mostrou abre ao lado da conversa do agente, lido da rota de arquivo da conversa do agente', async () => {
  at(`${PAGE}/${CHAT}`, {
    agents: [agent()],
    conversations: [{ id: CHAT, agentId: AGENT, draft: false, title: 'x', updatedAt: UPDATED }],
  })
  server.use(
    http.get(
      `*${BUILDER_ROUTES}/agent-controller/${AGENTS_CONTROLLER}/sessions/:id/threads/:t/messages`,
      () =>
        HttpResponse.json({
          messages: [
            toolSaid(
              MACHINE_TOOL.showFile,
              { path: 'grafico.png' },
              {
                kind: 'FILE',
                path: 'grafico.png',
                name: 'grafico.png',
                media: 'image/png',
                bytes: 2048,
              },
            ),
          ],
        }),
    ),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.png' }))
  const image = await screen.findByRole('img', { name: 'grafico.png' })
  expect(image.getAttribute('src')).toContain(
    `/agents/conversations/${CHAT}/files?path=grafico.png`,
  )
})
