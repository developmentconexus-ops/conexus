import { PROBLEM_MEDIA_TYPE } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { problemOf } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { decisionOf } from './review.tsx'
import { KNOWLEDGE, openKnowledge, proposal, view } from './test-hub.tsx'

// Para revisar: quem aprova decide, quem não aprova lê quem aguarda (criterion 18).
const server = hubServer()
const REVIEW = `${KNOWLEDGE}?aba=revisar`

test('quem não aprova não vê os botões e lê quem aguarda', async () => {
  openKnowledge(
    server,
    { view: view({ mayApprove: false, awaits: 'APPROVER' }), proposals: [proposal()] },
    REVIEW,
    'member',
  )
  expect(await screen.findByText('Aguarda quem cuida dos conceitos.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Aprovar/ })).toBeNull()
  expect(screen.queryByRole('checkbox')).toBeNull()
})

test('na primeira revisão a espera é do dono', async () => {
  openKnowledge(
    server,
    { view: view({ revision: null, mayApprove: false, awaits: 'OWNER' }), proposals: [proposal()] },
    REVIEW,
    'administrator',
  )
  expect(await screen.findByText('Aguarda o dono.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Aprovar/ })).toBeNull()
})

test('quem aprova decide com a revisão que viu', async () => {
  const hub = openKnowledge(server, { view: view(), proposals: [proposal()] }, REVIEW)
  expect(
    await screen.findByText(/antes Pedido externo · depois Pedido do representante/),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Aprovar todos' }))
  await waitFor(() => expect(hub.sent).toHaveLength(1))
  expect(hub.sent[0]?.body).toEqual({ approved: [1], refused: [], expectedRevision: 2 })
})

test('recusar pede o motivo antes de decidir', async () => {
  const hub = openKnowledge(server, { view: view(), proposals: [proposal()] }, REVIEW)
  fireEvent.click(await screen.findByRole('checkbox'))
  const decide = screen.getByRole('button', { name: 'Recusar 1' })
  expect(decide.hasAttribute('disabled')).toBe(true)
  fireEvent.change(screen.getByLabelText(/Motivo da recusa/), { target: { value: 'Não é isso' } })
  fireEvent.click(decide)
  await waitFor(() => expect(hub.sent).toHaveLength(1))
  expect(hub.sent[0]?.body).toEqual({
    approved: [],
    refused: [{ n: 1, reason: 'Não é isso' }],
    expectedRevision: 2,
  })
})

test('REVISION_STALE: a frase da matriz e Ver de novo', async () => {
  openKnowledge(
    server,
    { view: view(), proposals: [proposal()], decide: () => refusal('REVISION_STALE') },
    REVIEW,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Aprovar todos' }))
  expect(await screen.findByText(/Os conceitos mudaram enquanto você revisava/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Ver de novo' })).toBeTruthy()
})

test('DECISION_INCOMPLETE marca o item que falta', async () => {
  const body = {
    ...problemOf('DECISION_INCOMPLETE'),
    gaps: [{ n: 1, target: 'documento', needs: 'SOURCE', address: 'documento' }],
  }
  openKnowledge(
    server,
    {
      view: view(),
      proposals: [proposal()],
      decide: () =>
        HttpResponse.json(body, {
          status: 422,
          headers: { 'content-type': PROBLEM_MEDIA_TYPE },
        }),
    },
    REVIEW,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Aprovar todos' }))
  expect(await screen.findByText('documento: falta de onde ler documento')).toBeTruthy()
})

test('uma proposta que fechou: a frase e Ver o histórico', async () => {
  openKnowledge(
    server,
    { view: view(), proposals: [proposal()], decide: () => refusal('ITEM_DECIDED') },
    REVIEW,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Aprovar todos' }))
  expect(await screen.findByText('Esta proposta já foi decidida.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ver o histórico' })).toBeTruthy()
})

test('decisionOf: sem item ou com recusa sem motivo não há corpo', () => {
  expect(decisionOf(new Map(), 0)).toBeUndefined()
  expect(decisionOf(new Map([[1, { approve: false, reason: '  ' }]]), 0)).toBeUndefined()
  expect(decisionOf(new Map([[1, { approve: true, reason: '' }]]), 3)).toEqual({
    approved: [1],
    refused: [],
    expectedRevision: 3,
  })
})
