import { BUILDER_ROUTES, CONSTRUTOR_CONTROLLER, CONSTRUTOR_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { toolSaid } from '../assistant/test-hub.tsx'
import { AGENT, AREA, agent, BUILDER_CHAT, OTHER_AGENT, version } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// O rascunho ao lado da conversa com o Construtor (step 24.3, criterion 26).
const server = hubServer()
const { at } = agentScreens(server)
const UPDATED = '2026-11-02T12:00:00.000Z'
const CONVERSATION = { id: BUILDER_CHAT, title: 'Meu agente', updatedAt: UPDATED }

function saved(
  id: string,
  agentId: string,
  name: string,
  toolName: string = CONSTRUTOR_TOOL.agentDraft,
) {
  return toolSaid(toolName, {}, { kind: 'SAVED', agent: { id: agentId, name } }, id)
}

function conversation(...messages: ReturnType<typeof toolSaid>[]) {
  server.use(
    http.get(
      `*${BUILDER_ROUTES}/agent-controller/${CONSTRUTOR_CONTROLLER}/sessions/:id/threads/:t/messages`,
      () => HttpResponse.json({ messages }),
    ),
  )
}

const OPEN = `${AREA}/construtor/${BUILDER_CHAT}`

test('o rascunho aparece ao lado da conversa, com o que o agente tem, e a conversa não tem outro Publicar', async () => {
  at(OPEN, { agents: [agent()], construtor: [CONVERSATION], versions: [] })
  conversation(saved('a', AGENT, 'Conferente de metas'))
  const panel = await screen.findByRole('region', { name: 'Rascunho do agente' })
  expect(await within(panel).findByText('Rascunho · Conferente de metas')).toBeTruthy()
  expect(within(panel).getByText('Rascunho')).toBeTruthy()
  expect(within(panel).getByText('Diga quem ficou abaixo da meta.')).toBeTruthy()
  expect(within(panel).getByText('Vendas de ontem por vendedor.')).toBeTruthy()
  expect(within(panel).getByText('v1')).toBeTruthy()
  expect(within(panel).getByText('Sankhya · Matriz')).toBeTruthy()
  expect(within(panel).getByRole('button', { name: 'Testar' })).toBeTruthy()
  expect(within(panel).getByRole('link', { name: 'Abrir a página' })).toBeTruthy()
  expect(within(panel).getByRole('button', { name: 'Publicar v1' })).toBeTruthy()
  expect(screen.getAllByRole('button', { name: /^Publicar/ })).toHaveLength(1)
})

test('dois agentes: fica o último, e a linha do outro o abre', async () => {
  at(OPEN, {
    agents: [agent(), agent({ id: OTHER_AGENT, name: 'Outro agente' })],
    construtor: [CONVERSATION],
    versions: [],
  })
  conversation(saved('a', AGENT, 'Conferente de metas'), saved('b', OTHER_AGENT, 'Outro agente'))
  expect(await screen.findByText('Rascunho · Outro agente')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Montou o rascunho do agente\s*Conferente/ }))
  expect(await screen.findByText('Rascunho · Conferente de metas')).toBeTruthy()
})

test('o agente apagado diz que foi apagado', async () => {
  at(OPEN, { agents: [], construtor: [CONVERSATION], versions: [] })
  conversation(saved('a', AGENT, 'Conferente de metas'))
  expect(await screen.findByText('Este agente foi apagado.')).toBeTruthy()
})

test('um resultado gravado só com o id e o nome ainda abre o painel', async () => {
  at(OPEN, { agents: [agent()], construtor: [CONVERSATION], versions: [] })
  conversation(saved('a', AGENT, 'Conferente de metas', CONSTRUTOR_TOOL.agentSet))
  expect(await screen.findByText('Rascunho · Conferente de metas')).toBeTruthy()
})

test('Publicar diz a próxima versão', async () => {
  at(OPEN, { agents: [agent()], construtor: [CONVERSATION], versions: [version(1, true)] })
  conversation(saved('a', AGENT, 'Conferente de metas'))
  expect(await screen.findByRole('button', { name: 'Publicar v2' })).toBeTruthy()
})

test('Publicar com o rascunho mudado diz que o rascunho mudou', async () => {
  at(OPEN, { agents: [agent()], construtor: [CONVERSATION], versions: [] })
  server.use(http.post('*/agents/:id/publish', () => refusal('AGENT_DRAFT_STALE')))
  conversation(saved('a', AGENT, 'Conferente de metas'))
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar v1' }))
  expect(await screen.findByText('O rascunho mudou. Abra o agente para ver.')).toBeTruthy()
})

test('Testar abre a conversa de teste do agente', async () => {
  at(OPEN, { agents: [agent()], construtor: [CONVERSATION], versions: [], conversations: [] })
  conversation(saved('a', AGENT, 'Conferente de metas'))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(await screen.findByText('Conversa de teste com o rascunho')).toBeTruthy()
})

test('no celular o rascunho não cobre a conversa sozinho e abre ao toque na linha', async () => {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    at(OPEN, { agents: [agent()], construtor: [CONVERSATION], versions: [] })
    conversation(saved('a', AGENT, 'Conferente de metas'))
    const line = await screen.findByRole('button', { name: /Montou o rascunho do agente/ })
    expect(screen.queryByRole('region', { name: 'Rascunho do agente' })).toBeNull()
    fireEvent.click(line)
    expect(await screen.findByText('Rascunho · Conferente de metas')).toBeTruthy()
  } finally {
    phone.mockRestore()
  }
})
