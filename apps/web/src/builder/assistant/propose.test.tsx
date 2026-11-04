// The card of the app the Assistant proposed: Criar app on the Início, Mandar ao Builder in a Projeto,
// and Continuar aqui (step 24.3.2, criterion 11).
import { ASSISTANT_TOOL, ConnectionId, handAssistantProposal } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { signalStarted } from '../conversation/test-recorded.ts'
import { personSaid } from '../conversation/test-stream.tsx'
import { ASKED, COMPANY_ROOT, OFFERED, SALES } from './test-hub.tsx'
import {
  BUILDER_CONVERSATION,
  PROPOSED_SUMMARY,
  proposalSaid,
  proposalScreens,
} from './test-propose.tsx'

const server = hubServer()
const { handing, mayManage, proposing } = proposalScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const IN_PROJECT = `${COMPANY_ROOT}/projects/${PEDIDOS.id}/assistant/${ASKED}`
const SUMMARY = PROPOSED_SUMMARY
const proposal = proposalSaid

test('o cartão do Criar app mostra o resumo, o briefing, o nome e as ligações da conversa marcadas', async () => {
  proposing()
  mayManage(true)
  expect(await screen.findByText(SUMMARY)).toBeTruthy()
  expect(screen.getByText('Quem usa')).toBeTruthy()
  expect(screen.getByText(/briefing\.md/)).toBeTruthy()
  expect(screen.getByLabelText('Nome do projeto')).toBeTruthy()
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: 'Vendas' })).toHaveProperty('checked', true),
  )
  expect(screen.getByRole('checkbox', { name: 'Estoque' })).toHaveProperty('checked', true)
  expect(screen.getByRole('button', { name: 'Criar app' })).toHaveProperty('disabled', true)
  expect(screen.getByRole('button', { name: 'Continuar aqui' })).toBeTruthy()
})

test('quem não pode liberar ligações vê as ligações sem marca e a frase de pedir ao dono', async () => {
  proposing()
  mayManage(false)
  const box = await screen.findByRole('checkbox', { name: 'Vendas' })
  await waitFor(() => expect(screen.getByText(/Peça ao dono ou a um administrador/)).toBeTruthy())
  expect(box).toHaveProperty('checked', false)
  expect(box).toHaveProperty('disabled', true)
})

test('o toque manda pela rota com o nome e as ligações marcadas e abre a conversa do Builder, sem enviar nada pela tela', async () => {
  const handed = handing()
  const { conexus, writes } = proposing()
  mayManage(true)
  fireEvent.change(await screen.findByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Estoque' }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(
      `${COMPANY_ROOT}/projects/${PEDIDOS.id}/conversations/${BUILDER_CONVERSATION}`,
    ),
  )
  expect(handed[0]?.body).toEqual({
    toolCallId: 'call-tool-1',
    projectName: 'Encomendas',
    connections: [ConnectionId.parse(SALES)],
    deliver: false,
  })
  expect(handed[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
  expect(writes().filter((one) => one.path.endsWith('/messages'))).toHaveLength(0)
})

test('a conversa do Builder que o toque abre segue o stream antes de pedir o envio com a mesma chave, e mostra o pedido do Assistente que o stream conta, sem recarregar', async () => {
  // The Builder's stream answers only once the screen has read the conversation: an ask made
  // before it follows the stream is noted while the stream is still held.
  const { promise: held, resolve: open } = Promise.withResolvers<void>()
  let opened = false
  const following: boolean[] = []
  const handed = handing(() => {
    following.push(opened)
    return undefined
  })
  async function stream() {
    await held
    return undefined
  }
  const hub = proposing(undefined, undefined, undefined, undefined, { stream })
  mayManage(true)
  fireEvent.change(await screen.findByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  await waitFor(() => expect(hub.reads.length).toBeGreaterThan(0))
  expect(handed).toHaveLength(1)
  opened = true
  open()
  await waitFor(() => expect(handed).toHaveLength(2))
  expect(handed[1]).toEqual({
    key: handed[0]?.key,
    body: { ...Object(handed[0]?.body), deliver: true },
  })
  expect(following).toEqual([false, true])
  hub.line().emit(signalStarted('signal-1', SUMMARY))
  expect(await screen.findByText(SUMMARY)).toBeTruthy()
  expect(hub.conexus.router.state.location.state.assistantHandOff).toBeUndefined()
})

test('o cartão do Projeto diz Mandar ao Builder, sem campo de nome, e manda pela mesma rota', async () => {
  const handed = handing()
  const { conexus } = proposing([proposal(ASSISTANT_TOOL.proposeAppChange)], IN_PROJECT, PEDIDOS.id)
  expect(await screen.findByText(SUMMARY)).toBeTruthy()
  expect(screen.queryByLabelText('Nome do projeto')).toBeNull()
  expect(screen.queryByRole('checkbox')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Criar app' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Mandar ao Builder' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(
      `/conversations/${BUILDER_CONVERSATION}`,
    ),
  )
  expect(handed[0]?.body).toEqual({ toolCallId: 'call-tool-1', connections: [], deliver: false })
})

test('Continuar aqui manda a mensagem da pessoa pelo envio da conversa e não chama a rota', async () => {
  const handed = handing()
  const { writes } = proposing()
  fireEvent.click(await screen.findByRole('button', { name: 'Continuar aqui' }))
  await waitFor(() =>
    expect(writes().filter((one) => one.path.endsWith('/messages'))).toHaveLength(1),
  )
  expect(writes().find((one) => one.path.endsWith('/messages'))?.body).toMatchObject({
    message: 'Continuar aqui',
  })
  expect(handed).toHaveLength(0)
})

test('depois do Continuar aqui o cartão mostra o resumo e o briefing sem botão', async () => {
  proposing([proposal(), personSaid('Continuar aqui')])
  expect(await screen.findByText(SUMMARY)).toBeTruthy()
  expect(screen.getByText('Quem usa')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Criar app' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Continuar aqui' })).toBeNull()
  expect(screen.queryByLabelText('Nome do projeto')).toBeNull()
})

test('uma proposta mais nova no mesmo chat tira os botões da anterior', async () => {
  proposing([
    proposal(ASSISTANT_TOOL.proposeApp, 'tool-1'),
    proposal(ASSISTANT_TOOL.proposeApp, 'tool-2'),
  ])
  await waitFor(() => expect(screen.getAllByText(SUMMARY)).toHaveLength(2))
  expect(screen.getAllByRole('button', { name: 'Criar app' })).toHaveLength(1)
  expect(screen.getAllByRole('button', { name: 'Continuar aqui' })).toHaveLength(1)
})

test('a falha mostra a frase e Tentar de novo, e a nova tentativa leva a mesma chave', async () => {
  const handed = handing((touch) => (touch === 1 ? refusal('HANDOFF_NOT_DELIVERED') : undefined))
  const { conexus } = proposing([proposal(ASSISTANT_TOOL.proposeAppChange)], IN_PROJECT, PEDIDOS.id)
  fireEvent.click(await screen.findByRole('button', { name: 'Mandar ao Builder' }))
  expect(await screen.findByText(/Não confirmamos o envio ao Builder/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(
      `/conversations/${BUILDER_CONVERSATION}`,
    ),
  )
  expect(handed).toHaveLength(2)
  expect(handed[1]?.key).toBe(handed[0]?.key)
})

test('a proposta que a rota não acha diz que ela não existe mais', async () => {
  handing(() => refusal('NOT_FOUND'))
  proposing()
  mayManage(true)
  fireEvent.change(await screen.findByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  expect(await screen.findByText('Esta proposta não existe mais.')).toBeTruthy()
})

test('em um Projeto que saiu a frase é a do Projeto', async () => {
  handing(() => refusal('NOT_FOUND'))
  proposing([proposal(ASSISTANT_TOOL.proposeAppChange)], IN_PROJECT, PEDIDOS.id)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects/:projectId`, () => refusal('NOT_FOUND')),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Mandar ao Builder' }))
  expect(await screen.findByText('Este Projeto não existe mais.')).toBeTruthy()
})

test('a ligação que ficou para trás diz a sua frase e a conversa do Builder abre pelo botão', async () => {
  handing(() =>
    HttpResponse.json(
      handAssistantProposal.success.body.parse({
        projectId: PEDIDOS.id,
        conversationId: BUILDER_CONVERSATION,
        released: [],
        refused: [{ connectionId: OFFERED[1]?.connectionId, code: 'CONNECTION_NOT_WORKING' }],
      }),
      { status: 201 },
    ),
  )
  const { conexus } = proposing()
  mayManage(true)
  fireEvent.change(await screen.findByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  const stayed = await screen.findByText(/Estoque: Essa ligação não está funcionando/)
  expect(stayed).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe(OPEN)
  fireEvent.click(screen.getByRole('button', { name: 'Abrir a conversa do Builder' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(
      `/conversations/${BUILDER_CONVERSATION}`,
    ),
  )
})
