import { FAILURES } from '@conexus/hub-api'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { connectionsHub, mount, openIntegrations, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()

/** The page's way back to the list: the sidebar has a link of the same name. */
function back() {
  const link = screen
    .getAllByRole('link', { name: 'Integrações' })
    .find((one) => !one.closest('nav'))
  if (!link) throw new Error('no link back to the list')
  return link
}
const TESTED = '2026-10-29T14:02:00.000Z'
const TESTED_BY_ANA = /^testada em \d\d\/\d\d, \d\d:\d\d, por Ana$/
afterEach(() => vi.restoreAllMocks())

function open(view: View, answers?: Answers, connection = view.connections[0]) {
  if (!connection) throw new Error('a page needs a connection')
  return openIntegrations(server, view, answers, pageOf(connection))
}

test('Testar: "Testando a ligação…" enquanto espera, depois "Ligado e funcionando." com quem testou e quando', async () => {
  const held = Promise.withResolvers<undefined>()
  const connection = connectionOf()
  const view = viewOf({ connections: [connection] })
  const hub = connectionsHub(view)
  server.use(
    http.post(`*/api/companies/${COMPANY.id}/connections/:id/test`, async () => {
      await held.promise
      return undefined
    }),
    ...hub.handlers,
  )
  mount(pageOf(connection))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(await screen.findByRole('button', { name: 'Testando…' })).toBeTruthy()
  expect(screen.getByText('Testando a ligação…')).toBeTruthy()
  held.resolve(undefined)
  expect(await screen.findByText('Ligado e funcionando.')).toBeTruthy()
  expect(screen.getByText(TESTED_BY_ANA)).toBeTruthy()
  expect(screen.queryByText('Testando a ligação…')).toBeNull()
})

test('o Hub sem resposta no Testar: a frase do Hub, nada some em silêncio', async () => {
  const connection = connectionOf()
  open(viewOf({ connections: [connection] }), { test: () => refusal('DATABASE_UNAVAILABLE') })
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    sentenceOfCode('DATABASE_UNAVAILABLE'),
  )
  expect(screen.getByRole('button', { name: 'Testar' })).toBeTruthy()
})

test('uma ligação desligada por outra pessoa: o Testar leva à página relida, com a frase e a volta à lista', async () => {
  const connection = connectionOf()
  const view = viewOf({ connections: [connection] })
  open(view, {
    test: () => {
      view.connections = []
      return refusal('CONNECTION_NOT_FOUND')
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Essa integração foi desligada.')
  await screen.findByRole('alert')
  expect(back().getAttribute('href')).toBe(`/companies/${COMPANY.id}/integrations`)
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Testar' })).toBeNull())
})

test('a página de uma ligação que não existe (desligada ou de outra empresa): a frase e a volta à lista', async () => {
  open(viewOf({ connections: [connectionOf()] }), {}, connectionOf())
  expect((await screen.findByRole('alert')).textContent).toBe('Essa integração foi desligada.')
  expect(back()).toBeTruthy()
})

test('o endereço com um id que não existe no contrato não é uma página', async () => {
  openIntegrations(server, viewOf(), {}, `/companies/${COMPANY.id}/integrations/nao-e-um-id`)
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
})

test('uma ligação não mexe na outra: o "Testando…" fica na página que testa', async () => {
  const held = Promise.withResolvers<undefined>()
  const first = connectionOf({ name: 'Comercial', state: 'ACTIVE', testedAt: TESTED })
  const second = connectionOf({ name: 'Financeiro', state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [first, second] })
  const hub = connectionsHub(view)
  server.use(
    http.post(`*/api/companies/${COMPANY.id}/connections/:id/test`, async () => {
      await held.promise
      return undefined
    }),
    ...hub.handlers,
  )
  mount(pageOf(first))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(await screen.findByRole('button', { name: 'Testando…' })).toBeTruthy()
  fireEvent.click(back())
  fireEvent.click(await screen.findByRole('link', { name: /Financeiro/ }))
  expect(await screen.findByRole('heading', { name: 'Financeiro' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Testar' })).toBeTruthy()
  expect(screen.queryByText('Testando a ligação…')).toBeNull()
  held.resolve(undefined)
})

test('chaves recusadas: a dona lê o que fazer, o membro lê a quem pedir (a frase que o fundador aprovou)', async () => {
  const refused = connectionOf({ state: 'NEEDS_REAUTH', testedAt: TESTED })
  const owner = 'As chaves foram recusadas pelo Sankhya.'
  const member = 'As chaves foram recusadas pelo Sankhya. Peça ao dono ou a um administrador.'
  open(viewOf({ mayManage: false, connections: [refused] }))
  expect(await screen.findByText(member)).toBeTruthy()
  expect(screen.queryByText(owner)).toBeNull()
  cleanup()
  open(viewOf({ connections: [refused] }))
  expect(await screen.findByText(owner)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Conectar de novo' })).toBeTruthy()
  expect(screen.queryByText(member)).toBeNull()
})

test('Desligar que o Hub não confirma: a frase no diálogo, a página fica', async () => {
  const connection = connectionOf()
  open(viewOf({ connections: [connection] }), { unlink: () => refusal('DATABASE_UNAVAILABLE') })
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Desligar' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Desligar' }))
  expect(
    await within(dialog).findByText('Não confirmamos o desligamento. Veja a lista.'),
  ).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Comercial', hidden: true })).toBeTruthy()
})

test('a página da ligação que não carrega mostra o erro, e "Tentar de novo" lê outra vez', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection] })
  let failing = true
  const hub = connectionsHub(view)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections/:id`, () =>
      failing ? refusal('DATABASE_UNAVAILABLE') : undefined,
    ),
    ...hub.handlers,
  )
  mount(pageOf(connection))
  expect((await screen.findByRole('alert')).textContent).toBe(
    sentenceOfCode('DATABASE_UNAVAILABLE'),
  )
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('heading', { name: 'Comercial' })).toBeTruthy()
})

test('Desligar confirma pelo nome e volta à lista; Cancelar não manda nada', async () => {
  const connection = connectionOf({ name: 'Financeiro' })
  const sent = open(viewOf({ connections: [connection] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Desligar' }))
  let dialog = await screen.findByRole('alertdialog')
  expect(within(dialog).getByText('Desligar Financeiro?')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Desligar' }))
  dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Desligar' }))
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['DELETE'])
})

test('Desligar que o fornecedor não desfez: a frase diz, e Fechar leva à lista', async () => {
  const connection = connectionOf({ name: 'Financeiro' })
  open(viewOf({ connections: [connection] }), {
    unlink: () => HttpResponse.json({ revocation: 'REFUSED' }),
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Desligar' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Desligar' }))
  expect(
    await within(dialog).findByText(/o fornecedor não aceitou retirar a autorização do Conexus/),
  ).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Integrações' })).toBeNull()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }))
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
})
