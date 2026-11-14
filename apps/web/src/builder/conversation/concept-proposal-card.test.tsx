import { BUILDER_TOOL } from '@conexus/hub-api'
import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { toolCall } from './test-events.ts'
import { conversationOf, view as conversationView, FIRST, screens } from './test-hub.tsx'
import { builderSaid, personSaid } from './test-stream.tsx'

// The result card of concept_propose (A Ontologia da empresa, U4).
const server = hubServer()
const { openConversation } = screens(server)
const PROPOSAL = '77777777-7777-4777-8777-777777777777'

/** The open proposal as the Hub lists it for Para revisar, with one item. */
function held() {
  return {
    id: PROPOSAL,
    demand: 'Um painel',
    proposedBy: 'Ana Lima',
    agent: 'builder',
    createdAt: '2026-11-12T11:00:00.000Z',
    baseRevision: 0,
    state: 'OPEN',
    items: [],
  }
}

function proposed(items: { n: number; target: string; rows?: number }[]) {
  return {
    kind: 'PROPOSED',
    proposalId: PROPOSAL,
    baseRevision: 0,
    items: items.map((item) => ({
      n: item.n,
      target: item.target,
      ...(item.rows === undefined ? {} : { proof: { rows: item.rows, columns: ['NUNOTA'] } }),
    })),
    refused: [],
  }
}

async function conversationWith(result: unknown, role = 'owner') {
  const said = builderSaid('', 'builder-1')
  const call = toolCall(BUILDER_TOOL.conceptPropose, { items: [] }, result)
  said.content = { ...said.content, parts: [call, { type: 'text', text: 'Propus os conceitos.' }] }
  const conversation = conversationOf({ id: FIRST, messages: [personSaid('Um painel'), said] })
  await openConversation(conversation, conversationView({ role }))
  return screen.findByText('Propus os conceitos.')
}

function listOpen(open: boolean) {
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/ontology/proposals`, () =>
      HttpResponse.json({ proposals: open ? [held()] : [] }),
    ),
  )
}

test('o cartão mostra os conceitos e a prova, e leva a Para revisar', async () => {
  listOpen(true)
  await conversationWith(
    proposed([
      { n: 1, target: 'documento', rows: 1240 },
      { n: 2, target: 'documento.tipo=101' },
    ]),
  )
  expect(await screen.findByText('Proposta: 1 conceito')).toBeTruthy()
  const card = screen.getByText('Proposta: 1 conceito').parentElement
  if (!(card instanceof HTMLElement)) throw new Error('no card')
  expect(within(card).getByText(/prova: 1.240 linhas/)).toBeTruthy()
  const link = await within(card).findByRole('link', { name: 'Revisar e aprovar' })
  expect(link.getAttribute('href')).toContain('aba=revisar')
})

test('uma proposta que fechou: a frase da matriz, sem o botão', async () => {
  listOpen(false)
  await conversationWith(proposed([{ n: 1, target: 'documento', rows: 3 }]))
  expect(await screen.findByText('Esta proposta já foi decidida.')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Revisar e aprovar' })).toBeNull()
})

test('com todos os itens recusados o cartão diz que não há o que propor', async () => {
  listOpen(true)
  await conversationWith(proposed([]))
  expect(await screen.findByText('Nada a propor: o Builder explica na conversa.')).toBeTruthy()
})
