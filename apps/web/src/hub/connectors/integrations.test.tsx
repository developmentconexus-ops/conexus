import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal, undecided } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import {
  connectionOf,
  connectionsHub,
  fill,
  openForm,
  openIntegrations,
  PAGE,
  SECRETS,
  viewOf,
  workingOf,
} from './test-hub.tsx'

const server = hubServer()
const MEMBER_SENTENCE = 'Só o dono ou um administrador liga, testa e desliga.'

function open(view?: View, answers?: Answers) {
  return openIntegrations(server, view, answers)
}

test('a dona liga, testa e desliga', async () => {
  const sent = open()
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Ligadas' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Para ligar' })).toBeTruthy()
  expect(screen.getByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(screen.queryByText(MEMBER_SENTENCE)).toBeNull()

  const form = await openForm()
  for (const label of Object.keys(SECRETS)) {
    expect(within(form).getByLabelText(label).getAttribute('type')).toBe('password')
  }
  fill()
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar' }))
  expect(await screen.findByText(/Ligada por Ana em/)).toBeTruthy()
  expect(screen.getByText(/ainda não testada/)).toBeTruthy()
  expect(screen.getByText(/versão 1\.0\.0/)).toBeTruthy()
  expect(sent[0]?.body).toEqual({
    connector: 'sankhya',
    credential: {
      clientId: 'id-plantado-1',
      clientSecret: 'segredo-plantado-2',
      xToken: 'token-plantado-3',
    },
  })
  expect(sent[0]?.attemptKey).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.body.textContent).not.toContain('segredo-plantado-2')
  expect(screen.queryByDisplayValue('segredo-plantado-2')).toBeNull()
  expect(screen.getByText('Nenhum outro conector ainda.')).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: 'Testar' }))
  expect(await screen.findByText('Ligação funcionando')).toBeTruthy()
  const checks = within(screen.getByRole('list', { name: 'Resultado do teste' }))
  expect(checks.getAllByRole('listitem').map((one) => one.textContent)).toEqual([
    'Empresas lê',
    'Pedidos lê',
    'Produtos lê',
    'Clientes lê',
    'Impostos dos pedidos lê',
    'Leitura genérica lê',
    'Consulta livre lê',
  ])
  expect(await screen.findByText(/testada em/)).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: 'Desligar' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Desligar' }))
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['POST', 'POST', 'DELETE'])
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Ligadas' })),
  )
})

test('Testar mostra "Testando…" e depois cada parte com a sua palavra', async () => {
  const held = Promise.withResolvers<Response | undefined>()
  const connection = connectionOf({ state: 'ACTIVE', testedAt: '2026-10-29T14:02:00.000Z' })
  const view: View = { connections: [connection], mayManage: true }
  const hub = connectionsHub(view, {}, (one) =>
    workingOf(one, {
      Pedidos: 'REFUSED',
      Produtos: 'UNREADABLE',
      'Impostos dos pedidos': 'NOTHING_TO_READ',
    }),
  )
  server.use(
    http.post(`*/api/companies/${COMPANY.id}/connections/:id/test`, async () => {
      await held.promise
      return undefined
    }),
    ...hub.handlers,
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [PAGE] }))
  render(<Conexus conexus={conexus} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(await screen.findByRole('button', { name: 'Testando…' })).toBeTruthy()
  held.resolve(undefined)
  const checks = within(await screen.findByRole('list', { name: 'Resultado do teste' }))
  const words = checks.getAllByRole('listitem').map((one) => one.textContent)
  expect(words).toContain('Pedidos recusado pelo Sankhya')
  expect(words).toContain('Produtos resposta que o Conexus não entendeu')
  expect(words).toContain('Impostos dos pedidos nada para ler')
  expect(words).toContain('Empresas lê')
})

test('chave recusada no Testar: a frase do Sankhya; fornecedor fora: a outra frase', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: '2026-10-29T14:02:00.000Z' })
  const view: View = { connections: [connection], mayManage: true }
  let result: 'AUTH_REFUSED' | 'UNREACHABLE' = 'UNREACHABLE'
  const hub = connectionsHub(view, {}, (one) => ({
    result,
    connection: { ...one, state: result === 'AUTH_REFUSED' ? 'NEEDS_REAUTH' : one.state },
  }))
  server.use(...hub.handlers)
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  expect(
    await screen.findByText('O Sankhya não respondeu. Tente de novo em alguns minutos.'),
  ).toBeTruthy()
  result = 'AUTH_REFUSED'
  fireEvent.click(screen.getByRole('button', { name: 'Testar' }))
  expect(
    await screen.findByText(
      'As chaves foram recusadas pelo Sankhya. Desligue e ligue de novo com chaves novas.',
    ),
  ).toBeTruthy()
  expect(screen.queryByText('O Sankhya não respondeu. Tente de novo em alguns minutos.')).toBeNull()
})

test.each(undecided('{"connection":'))(
  'Ligar com %s: "Não confirmamos a ligação", a mesma chave de tentativa na repetição',
  async (_name, reply) => {
    let answers = 0
    const sent = open(viewOf(), { link: () => (answers++ === 0 ? reply() : undefined) })
    const form = await openForm()
    fill()
    fireEvent.click(within(form).getByRole('button', { name: 'Ligar' }))
    expect((await within(form).findByRole('alert')).textContent).toBe(
      'Não confirmamos a ligação. Tente de novo.',
    )
    fireEvent.click(within(form).getByRole('button', { name: 'Ligar' }))
    expect(await screen.findByText(/Ligada por Ana em/)).toBeTruthy()
    expect(sent).toHaveLength(2)
    expect(sent[1]?.attemptKey).toBe(sent[0]?.attemptKey)
  },
)

test('campo vazio: o formulário pede os campos antes de mandar', async () => {
  const sent = open()
  const form = await openForm()
  fireEvent.click(within(form).getByRole('button', { name: 'Ligar' }))
  expect((await within(form).findAllByText(/^Cole /)).length).toBe(3)
  expect(sent).toHaveLength(0)
})

test('Desligar pede confirmação, e Cancelar não manda nada', async () => {
  const sent = open(viewOf({ connections: [connectionOf()] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Desligar' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(within(dialog).getByText('Desligar o Sankhya?')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toHaveLength(0)
  expect(screen.getByText(/Ligada por Ana em/)).toBeTruthy()
})

test('o membro lê; vazio e erro', async () => {
  const sent = open(
    viewOf({
      mayManage: false,
      connections: [connectionOf({ state: 'ACTIVE', testedAt: '2026-10-29T14:02:00.000Z' })],
    }),
  )
  expect(await screen.findByText(MEMBER_SENTENCE)).toBeTruthy()
  expect(screen.getByText('Sankhya')).toBeTruthy()
  expect(screen.getByText(/testada em/)).toBeTruthy()
  for (const name of ['Ligar', 'Testar', 'Desligar']) {
    expect(screen.queryByRole('button', { name })).toBeNull()
  }
  expect(sent).toHaveLength(0)
})

test('chaves recusadas: o membro lê a quem pedir, a dona lê o que fazer', async () => {
  const refused = connectionOf({ state: 'NEEDS_REAUTH', testedAt: '2026-10-29T14:02:00.000Z' })
  const owner = 'As chaves foram recusadas pelo Sankhya. Desligue e ligue de novo com chaves novas.'
  const member =
    'As chaves foram recusadas pelo Sankhya. Peça ao dono ou a um administrador para ligar de novo.'
  open(viewOf({ mayManage: false, connections: [refused] }))
  expect(await screen.findByText(member)).toBeTruthy()
  expect(screen.queryByText(owner)).toBeNull()
  cleanup()
  open(viewOf({ connections: [refused] }))
  expect(await screen.findByText(owner)).toBeTruthy()
  expect(screen.queryByText(member)).toBeNull()
})

test('o membro sem ligação nenhuma lê a frase vazia e o Sankhya sem Ligar', async () => {
  open(viewOf({ mayManage: false }))
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(screen.getByText('Sankhya')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ligar' })).toBeNull()
})

test('a lista que não carrega mostra o erro com "Tentar de novo"', async () => {
  let failing = true
  const hub = connectionsHub(viewOf())
  server.use(...hub.handlers)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      failing ? refusal('DATABASE_UNAVAILABLE') : undefined,
    ),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
  expect(await screen.findByRole('alert')).toBeTruthy()
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('heading', { name: 'Ligadas' })).toBeTruthy()
})
