import { Client } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import {
  ACTIVE_CLIENT,
  awaitingClient,
  centralHub,
  DELETING_CLIENT,
  homeHub,
  hubServer,
  NO_COMPANIES,
  refusal,
} from '../../platform/test-hub.tsx'

const server = hubServer()

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

const DETAIL = `/operations/clients/${'b'.repeat(32)}`

test('lista vazia: "Nenhum cliente cadastrado." e "Cadastrar cliente", que abre o cadastro', async () => {
  server.use(...centralHub([]))
  const router = open('/operations/clients')
  expect(await screen.findByText('Nenhum cliente cadastrado.')).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: 'Cadastrar cliente' }))
  expect(await screen.findByRole('heading', { name: 'Cadastrar cliente' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/operations/clients/new')
})

test('cada linha: nome, razão social, CNPJ com máscara, "Cadastrado em" e o estado do convite ou "Ativo"', async () => {
  const states = ['PENDING', 'EXPIRED', 'DECLINED', 'CANCELED'] as const
  const clients: Client[] = [
    ...states.map((state, index) =>
      Client.parse({ ...awaitingClient(state), companyId: String(index).repeat(32) }),
    ),
    ACTIVE_CLIENT,
  ]
  server.use(...centralHub(clients))
  open('/operations/clients')
  expect(await screen.findAllByText('Empresa Teste Ltda · 12.ABC.345/01DE-35')).toHaveLength(5)
  for (const text of [
    'Aguardando o administrador: davi@example.test',
    'Convite vencido: davi@example.test',
    'Convite recusado: davi@example.test',
    'Convite cancelado: davi@example.test',
    'Ativo',
  ]) {
    expect(screen.getByText(text)).toBeTruthy()
  }
  expect(screen.getAllByText('Cadastrado em 16/10/2026')).toHaveLength(5)
})

test('banco fora na lista: a página de erro com a frase, nunca a lista vazia', async () => {
  server.use(
    http.get('*/api/clients', () => refusal('DATABASE_UNAVAILABLE')),
    ...centralHub([]),
  )
  open('/operations/clients')
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByText('Nenhum cliente cadastrado.')).toBeNull()
})

test('sem o papel de operador, /operations/clients e o detalhe dão a página 404, sem nomear a Central nem pedir a lista', async () => {
  let asked = 0
  server.use(
    ...homeHub({ signedIn: true }, NO_COMPANIES),
    http.get('*/api/clients', () => {
      asked += 1
      return HttpResponse.json({ clients: [], next: { kind: 'END' } })
    }),
  )
  for (const path of ['/operations/clients', DETAIL, '/operations/clients/new']) {
    const view = open(path)
    expect(
      await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
    ).toBeTruthy()
    expect(view.state.location.pathname).toBe(path)
    expect(screen.queryByText(/Central de Operação|Cliente|Cadastrar cliente/)).toBeNull()
    cleanup()
  }
  expect(asked).toBe(0)
})

test('detalhe aguardando, pendente: Reenviar, Cancelar convite e Corrigir dados; sem Convidar outro e-mail', async () => {
  server.use(...centralHub([awaitingClient('PENDING')]))
  open(DETAIL)
  expect(await screen.findByRole('heading', { name: 'Empresa Teste' })).toBeTruthy()
  expect(screen.getByText('12.ABC.345/01DE-35')).toBeTruthy()
  for (const name of ['Reenviar', 'Cancelar convite', 'Corrigir dados']) {
    expect(screen.getByRole('button', { name })).toBeTruthy()
  }
  expect(screen.queryByRole('button', { name: 'Convidar outro e-mail' })).toBeNull()
})

test('detalhe aguardando, vencido: Convidar de novo reemite com replaces; recusado: só Convidar outro e-mail', async () => {
  const sent: unknown[] = []
  server.use(
    ...centralHub([awaitingClient('EXPIRED')]),
    http.post('*/api/companies/:companyId/invitations', async ({ request }) => {
      sent.push(await request.json())
      return refusal('OWNER_INVITATION_OPEN')
    }),
  )
  open(DETAIL)
  fireEvent.click(await screen.findByRole('button', { name: 'Convidar de novo' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Já há um convite de dono em aberto. Cancele-o antes de convidar outro e-mail.',
  )
  expect(sent).toEqual([
    { email: 'davi@example.test', role: 'owner', replaces: { id: 'c'.repeat(32), revision: 0 } },
  ])
  expect(screen.getByRole('button', { name: 'Convidar outro e-mail' })).toBeTruthy()
})

test('convidar outro e-mail: o e-mail de um operador fica no campo; Convidando… enquanto envia', async () => {
  server.use(
    ...centralHub([awaitingClient('DECLINED')]),
    http.post('*/api/companies/:companyId/invitations', () => refusal('CLIENT_OWNER_IS_OPERATOR')),
  )
  open(DETAIL)
  expect(screen.queryByRole('button', { name: 'Reenviar' })).toBeNull()
  fireEvent.click(await screen.findByRole('button', { name: 'Convidar outro e-mail' }))
  fireEvent.change(screen.getByLabelText('E-mail do administrador'), {
    target: { value: 'ana@example.test' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Convidar' }))
  expect(await screen.findByText('Este e-mail é de um operador da Conexus.')).toBeTruthy()
  await waitFor(() =>
    expect(screen.getByLabelText('E-mail do administrador').getAttribute('aria-invalid')).toBe(
      'true',
    ),
  )
})

test('detalhe ativo: "Ativo desde", as pessoas com tirar e mudar papel, e o convite só de dono', async () => {
  server.use(...centralHub([ACTIVE_CLIENT]))
  open(DETAIL)
  expect(await screen.findByText('17/10/2026')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Pessoas' })).toBeTruthy()
  expect(screen.getByText('Davi Costa')).toBeTruthy()
  for (const name of ['Mudar papel: Davi Costa', 'Tirar da empresa: Davi Costa']) {
    expect(screen.getByRole('button', { name })).toBeTruthy()
  }
  expect(await screen.findByRole('heading', { name: 'Convidar pessoa' })).toBeTruthy()
  expect(screen.queryAllByRole('button', { name: /Reenviar|Corrigir|Convidar outro/ })).toEqual([])
})

test('cliente que não existe: a página 404', async () => {
  server.use(...centralHub([]))
  open(DETAIL)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})

test('a lista traz o estado do Hub, que não está mais no início', async () => {
  server.use(...centralHub([]))
  open('/operations/clients')
  expect(await screen.findByText('Hub do Conexus no ar.')).toBeTruthy()
  expect(await screen.findByText('v0.1.0')).toBeTruthy()
})

test('um cliente que está sendo apagado diz "Exclusão em andamento" na lista', async () => {
  server.use(...centralHub([DELETING_CLIENT]))
  open('/operations/clients')
  expect(await screen.findByText('Exclusão em andamento')).toBeTruthy()
})
