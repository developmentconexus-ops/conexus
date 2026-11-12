import type { CopyProposalSummary } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  BUILDER_TOOL,
  ConnectorEntry,
  EnableCopy,
  listCopies,
} from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { toolCall } from './test-events.ts'
import { conversationOf, FIRST, screens, view } from './test-hub.tsx'
import { builderSaid, personSaid } from './test-stream.tsx'

// The proposal's card in the Builder's conversation (Capacidade 3, criterion 39).
const server = hubServer()
const { openConversation } = screens(server)
const COPIES = `*/api/companies/${COMPANY.id}/copies`
const MATRIZ = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Matriz', connector: 'sankhya' }
const SHOWN = {
  source: { kind: 'QUERY', query: 'SELECT ID_DEVOLUCAO\nFROM DEVOLUCOES' },
  key: ['ID_DEVOLUCAO'],
  description: null,
  columns: [],
}

/** The proposal as the Hub lists it: the Builder's `devolucoes` of the Matriz, for the Projeto Vendedores. */
function proposal(): CopyProposalSummary {
  return listCopies.success.body.shape.proposals.element.parse({
    id: '55555555-5555-4555-8555-555555555555',
    ...{ name: 'devolucoes', label: 'Devoluções', sources: [{ connection: MATRIZ }] },
    project: { id: PEDIDOS.id, name: 'Vendedores' },
    shown: { ...SHOWN, changedSince: { column: 'DTALTER' }, window: null },
    mode: { kind: 'CHANGES' },
    proved: { rows: 12, more: false, calls: null },
    proposedBy: { id: 'person-ana', name: 'Ana Lima' },
    state: 'OPEN',
  })
}

/** The copy Ligar makes of it. */
function madeOf(held: CopyProposalSummary) {
  return listCopies.success.body.shape.copies.element.parse({
    id: '66666666-6666-4666-8666-666666666666',
    ...{ name: held.name, label: held.label, sources: held.sources, interval: '30m' },
    schedule: { kind: 'ACTIVE', nextRunAt: '2026-11-02T10:30:00.000Z' },
    ...{ run: null, rows: null, mode: held.mode, shown: held.shown, projects: [held.project] },
  })
}

/** What `copy_propose` answered, as the conversation holds it: the mode is the Hub's, never classified here. */
function proposed() {
  const held = proposal()
  return {
    kind: 'PROPOSED',
    proposalId: held.id,
    name: held.name,
    source: held.shown.source,
    sources: held.sources.map(({ connection }) => ({
      name: connection.name,
      connector: connection.connector,
    })),
    key: held.shown.key,
    mode: { kind: 'CHANGES' },
    rows: 12,
    more: false,
    calls: null,
    counts: [],
  }
}

/** The copies' list and Ligar as the Hub answers them, with the proposal in the state the test sets; `gone` once its Projeto or connection was deleted. */
function copiesHub(held: CopyProposalSummary, gone = false) {
  const reads: string[] = []
  const writes: { body: unknown; key: string | null }[] = []
  server.use(
    http.get(COPIES, ({ request }) => {
      reads.push(new URL(request.url).search)
      return HttpResponse.json({ copies: [], proposals: gone ? [] : [held] })
    }),
    http.post(COPIES, async ({ request }) => {
      const body = EnableCopy.parse(await request.json())
      writes.push({ body, key: request.headers.get(ATTEMPT_KEY_HEADER) })
      if (held.state !== 'OPEN') return refusal('COPY_PROPOSAL_DECIDED')
      held.state = 'ACCEPTED'
      return HttpResponse.json({ copy: madeOf(held) }, { status: 201 })
    }),
  )
  return { reads, writes }
}

async function conversationWithProposal(role: string, result: unknown = proposed()) {
  const said = builderSaid('', 'builder-1')
  const call = toolCall(BUILDER_TOOL.copyPropose, { name: 'devolucoes' }, result)
  said.content = { ...said.content, parts: [call, { type: 'text', text: 'Propus a cópia.' }] }
  const conversation = conversationOf({
    id: FIRST,
    messages: [personSaid('Falta devoluções'), said],
  })
  await openConversation(conversation, view({ role }))
  return screen.findByText('Propus a cópia.')
}

function cardOf(name: string): HTMLElement {
  const card = screen.getAllByText(new RegExp(`^${name} · `)).at(-1)?.parentElement
  if (!(card instanceof HTMLElement)) throw new Error(`no card for ${name}`)
  return card
}

test('o cartão da proposta: ligar pela conversa', async () => {
  const held = proposal()
  const hub = copiesHub(held)
  await conversationWithProposal('developer')
  expect(screen.getByText('Propôs uma cópia')).toBeTruthy()
  const card = cardOf('devolucoes')
  // The mode of the tool's result, as written by the Hub.
  expect(within(card).getByText('devolucoes · Matriz · só o alterado')).toBeTruthy()
  expect(within(card).getByText('ID_DEVOLUCAO')).toBeTruthy()
  expect(within(card).getByText(/teste: 12 linhas/)).toBeTruthy()
  const ligar = await within(card).findByRole('button', { name: 'Ligar' })
  expect(within(card).queryByRole('button', { name: 'Dispensar' })).toBeNull()
  expect(hub.reads.some((search) => search.includes(held.id))).toBe(true)
  fireEvent.click(ligar)
  // The Cópias page's own dialog, and its one operation.
  const dialog = within(await screen.findByRole('dialog'))
  expect(dialog.getByText('Libera ao Projeto Vendedores')).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(hub.writes).toHaveLength(1)
  expect(hub.writes[0]?.body).toEqual({ from: 'PROPOSAL', proposalId: held.id, interval: '30m' })
  // Read again, the card shows the new state.
  expect(await within(card).findByText('Ligada')).toBeTruthy()
  expect(within(card).queryByRole('button', { name: 'Ligar' })).toBeNull()
})

test('o cartão da proposta: decidida em outro lugar, o clique tardio recebe a frase', async () => {
  const held = proposal()
  copiesHub(held)
  await conversationWithProposal('owner')
  const card = cardOf('devolucoes')
  fireEvent.click(await within(card).findByRole('button', { name: 'Ligar' }))
  const dialog = within(await screen.findByRole('dialog'))
  held.state = 'DISMISSED'
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  expect(await within(card).findByText(/Esta proposta já foi ligada ou dispensada/)).toBeTruthy()
  expect(await within(card).findByText('Dispensada')).toBeTruthy()
})

test('o cartão da proposta: a proposta que sumiu', async () => {
  copiesHub(proposal(), true)
  await conversationWithProposal('owner')
  expect(
    await within(cardOf('devolucoes')).findByText('Esta proposta não existe mais.'),
  ).toBeTruthy()
})

test('o cartão de quem não gerencia cópias', async () => {
  const hub = copiesHub(proposal())
  await conversationWithProposal('member')
  const card = cardOf('devolucoes')
  expect(within(card).getByText('devolucoes · Matriz · só o alterado')).toBeTruthy()
  expect(
    within(card).getByText(
      'Um dono, administrador ou desenvolvedor da empresa liga esta cópia na página Cópias.',
    ),
  ).toBeTruthy()
  expect(within(card).queryByRole('button')).toBeNull()
  // The list of copies never opens to them (the boundary of Capacidade 2).
  expect(hub.reads).toHaveLength(0)
})

test('a linha da proposta recusada: a frase, e nenhum cartão', async () => {
  const hub = copiesHub(proposal())
  const exists = { kind: 'EXISTS', name: 'vendas', releasedHere: false }
  await conversationWithProposal('owner', exists)
  expect(screen.getByText('Não conseguiu propor a cópia')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ligar' })).toBeNull()
  expect(hub.reads.filter((search) => search.includes('proposalId'))).toHaveLength(0)
})

const MERCADO_LIVRE = ConnectorEntry.parse({
  ...{ id: 'mercado-livre', name: 'Mercado Livre', version: '1.0.0', category: 'Marketplace' },
  ...{ summary: 'Resumo.', auth: 'oauth2_code', subjects: [], fields: [] },
  logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28"/></svg>',
})

test('o cartão de uma leitura de lista', async () => {
  const stores = [
    { name: 'Loja A', connector: 'mercado-livre' },
    { name: 'Loja B', connector: 'mercado-livre' },
  ]
  const source = { kind: 'OPERATION', operation: 'pedidos', label: 'Pedidos', input: {} }
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      HttpResponse.json({ connectors: [MERCADO_LIVRE], connections: [], mayManage: false }),
    ),
  )
  copiesHub(proposal())
  const result = {
    ...proposed(),
    name: 'ml_pedidos',
    ...{ source, sources: stores, key: ['id'], rows: 50, more: true, calls: 6 },
  }
  await conversationWithProposal('member', result)
  const card = cardOf('ml_pedidos')
  expect(await within(card).findByText('ml_pedidos · Pedidos · Mercado Livre')).toBeTruthy()
  expect(within(card).getByText('Loja A, Loja B · só o alterado')).toBeTruthy()
  expect(within(card).getByText('id')).toBeTruthy()
  expect(
    within(card).getByText(/teste: mais de 50 linhas · cerca de 6 chamadas por passada/),
  ).toBeTruthy()
  expect(within(card).queryByRole('button')).toBeNull()
})
