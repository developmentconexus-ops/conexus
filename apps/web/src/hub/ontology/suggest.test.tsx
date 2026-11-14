import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { KNOWLEDGE, openKnowledge, page, view } from './test-hub.tsx'

// Sugerir mudança: todo membro propõe, uma chave de tentativa por proposta (criterion 17, web W24).
const server = hubServer()
const CODES = `${KNOWLEDGE}/documento?campo=tipo`

async function openForm() {
  const [first] = await screen.findAllByRole('button', { name: 'Sugerir mudança' })
  if (first === undefined) throw new Error('no button')
  fireEvent.click(first)
  return screen.findByLabelText('Quer dizer')
}

test('um membro sugere o rótulo de um código; a sugestão sai com a chave e a explicação', async () => {
  const hub = openKnowledge(
    server,
    { view: view({ mayApprove: false, awaits: 'APPROVER' }), concepts: { documento: page() } },
    CODES,
    'member',
  )
  const said = await openForm()
  fireEvent.change(said, { target: { value: 'Venda no balcão da loja' } })
  fireEvent.change(screen.getByLabelText('Por quê'), { target: { value: 'O 100 é o balcão' } })
  fireEvent.click(screen.getByRole('button', { name: 'Propor a mudança' }))
  await waitFor(() => expect(hub.sent).toHaveLength(1))
  expect(hub.sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
  expect(hub.sent[0]?.body).toMatchObject({
    why: 'O 100 é o balcão',
    items: [
      { kind: 'RENAME_LABEL', target: 'documento.tipo=100', name: 'Venda no balcão da loja' },
    ],
  })
})

test('o formulário diz que a sugestão vira uma proposta que quem tem Conceitos da empresa aprova', async () => {
  openKnowledge(server, { view: view(), concepts: { documento: page() } }, CODES)
  await openForm()
  expect(
    screen.getByText('Isto vira uma proposta. Quem tem "Conceitos da empresa" aprova.'),
  ).toBeTruthy()
})

test('dois toques fazem uma proposta só', async () => {
  const hub = openKnowledge(server, { view: view(), concepts: { documento: page() } }, CODES)
  await openForm()
  fireEvent.change(screen.getByLabelText('Por quê'), { target: { value: 'Porque sim' } })
  const send = screen.getByRole('button', { name: 'Propor a mudança' })
  fireEvent.click(send)
  fireEvent.click(send)
  await waitFor(() => expect(hub.sent.length).toBeGreaterThan(0))
  expect(hub.sent).toHaveLength(1)
})

test('uma falha que não se sabe guarda a chave para a próxima tentativa', async () => {
  const hub = openKnowledge(
    server,
    { view: view(), concepts: { documento: page() }, suggest: () => HttpResponse.error() },
    CODES,
  )
  await openForm()
  fireEvent.change(screen.getByLabelText('Por quê'), { target: { value: 'Porque sim' } })
  fireEvent.click(screen.getByRole('button', { name: 'Propor a mudança' }))
  expect(await screen.findByText(/Não confirmamos a sugestão/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Propor a mudança' }))
  await waitFor(() => expect(hub.sent).toHaveLength(2))
  expect(hub.sent[1]?.key).toBe(hub.sent[0]?.key)
})

test('uma recusa que a Hub fecha mostra a frase dela', async () => {
  openKnowledge(
    server,
    { view: view(), concepts: { documento: page() }, suggest: () => refusal('TARGET_UNKNOWN') },
    CODES,
  )
  await openForm()
  fireEvent.change(screen.getByLabelText('Por quê'), { target: { value: 'Porque sim' } })
  fireEvent.click(screen.getByRole('button', { name: 'Propor a mudança' }))
  expect(await screen.findByText(/Isto não existe mais nos conceitos/)).toBeTruthy()
})
