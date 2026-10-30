import { FAILURES } from '@conexus/hub-api'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { checksOf, connectionOf, REFUSAL, workingOf } from './fixtures.ts'
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
const PARTIAL = {
  Empresas: { outcome: 'REFUSED', native: REFUSAL },
  Clientes: { outcome: 'SOURCE_UNREAD', source: 'Empresas' },
  Produtos: {
    outcome: 'UNREADABLE',
    native: { status: 200, code: null, message: null, body: null },
  },
  'Locais de estoque': 'NOT_TESTED',
  'Preços de uma tabela': 'NOTHING_TO_READ',
}

afterEach(() => vi.restoreAllMocks())

function open(view: View, answers?: Answers, connection = view.connections[0]) {
  if (!connection) throw new Error('a page needs a connection')
  return openIntegrations(server, view, answers, pageOf(connection))
}

test('Testar: "Testando…", depois uma linha por assunto na ordem do Hub, com a frase de cada item', async () => {
  const held = Promise.withResolvers<undefined>()
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection] })
  const hub = connectionsHub(view, {}, (one) => workingOf(one, PARTIAL))
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
  held.resolve(undefined)
  const list = await screen.findByRole('list', { name: 'Resultado do teste' })
  const lines = within(list)
    .getAllByRole('listitem')
    .filter((one) => one.parentElement === list)
    .map((one) => one.textContent ?? '')
  expect(lines.map((one) => one.split(/Lê|Não/)[0])).toEqual([
    'Porta de leitura',
    'Cadastros',
    'Produtos',
    'Vendas',
    'Estoque',
    'Financeiro',
    'Preços',
    'Logística',
  ])
  expect(lines[1]).toContain('Lê 4 de 6')
  expect(lines[1]).toContain('Recusada pelo Sankhya')
  expect(lines[1]).toContain('Não testada: depende de Empresas, que não leu')
  expect(lines[2]).toContain('Resposta que o Conexus não entendeu')
  expect(lines[4]).toContain('Não testada: o Sankhya demorou. Teste de novo')
  expect(lines[4]).toContain('O tempo do teste acabou antes destas leituras. Teste de novo.')
  expect(lines[6]).toBe('PreçosLê tudo')
  expect(lines[7]).toContain('Lê tudo')
})

test('o que o provedor disse: o código e a mensagem no teste novo, a resposta inteira fechada e como texto, nunca como HTML', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection] })
  const hub = connectionsHub(view, {}, (one) => workingOf(one, PARTIAL))
  server.use(...hub.handlers)
  mount(pageOf(connection))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(
    await screen.findByText('Sankhya respondeu 403, código SEM_ACESSO: Sem acesso à tela'),
  ).toBeTruthy()
  expect(screen.getByText('Sankhya respondeu 200')).toBeTruthy()
  // The body stays shut until asked for, and then it is text.
  expect(screen.queryByText(/<b>não<\/b>/)).toBeNull()
  fireEvent.click(screen.getByText('Ver a resposta inteira'))
  expect(await screen.findByText(/<b>não<\/b>/)).toBeTruthy()
  expect(document.querySelector('pre b')).toBeNull()
})

test('depois de recarregar, só o status e o código: nada da mensagem nem da resposta', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection] })
  const hub = connectionsHub(view, {}, (one) => workingOf(one, PARTIAL))
  server.use(...hub.handlers)
  mount(pageOf(connection))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  await screen.findByText('Sankhya respondeu 403, código SEM_ACESSO: Sem acesso à tela')
  cleanup()
  mount(pageOf(connection))
  expect(await screen.findByText('Sankhya respondeu 403, código SEM_ACESSO')).toBeTruthy()
  expect(screen.queryByText(/Sem acesso à tela/)).toBeNull()
  expect(screen.queryByText('Ver a resposta inteira')).toBeNull()
})

test.each([
  ['AUTH_REFUSED', 'As chaves foram recusadas pelo Sankhya.'],
  ['UNREACHABLE', 'O Sankhya respondeu com erro. Tente de novo em alguns minutos.'],
  ['UNREADABLE', 'Resposta que o Conexus não entendeu'],
] as const)('Testar que acaba em %s: a frase e o que o Sankhya disse', async (result, sentence) => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection] })
  const hub = connectionsHub(view, {}, (one) => ({
    result,
    native: { status: 401, code: 'NEGADO', message: null, body: null },
    connection: { ...one, state: result === 'AUTH_REFUSED' ? 'NEEDS_REAUTH' : one.state },
  }))
  server.use(...hub.handlers)
  mount(pageOf(connection))
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(await screen.findByText(sentence)).toBeTruthy()
  expect(screen.getAllByText(sentence)).toHaveLength(1)
  if (result === 'AUTH_REFUSED') expect(screen.queryByText('Ainda não testada.')).toBeNull()
  expect(await screen.findByText('Sankhya respondeu 401, código NEGADO')).toBeTruthy()
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
  expect(screen.queryByText(/Testando as/)).toBeNull()
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

test('um teste novo que não lê um assunto inteiro abre o assunto que estava fechado', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const view = viewOf({ connections: [connection], lastTests: { [connection.id]: checksOf() } })
  const hub = connectionsHub(view, {}, (one) => workingOf(one, PARTIAL))
  server.use(...hub.handlers)
  mount(pageOf(connection))
  expect(await screen.findByText('Lê 8 de 8 assuntos inteiros')).toBeTruthy()
  expect(screen.queryByText('Recusada pelo Sankhya')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Testar' }))
  expect(await screen.findByText('Recusada pelo Sankhya')).toBeTruthy()
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
