import { Client, registerClient } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import {
  awaitingClient,
  centralHub,
  hubServer,
  refusal,
  undecided,
} from '../../platform/test-hub.tsx'

const server = hubServer()
const CLIENT = awaitingClient()

type Sent = { key: string | null; body: unknown }

function hub(answers: (() => Response)[]) {
  const sent: Sent[] = []
  server.use(
    http.post('*/api/clients', async ({ request }) => {
      sent.push({ key: request.headers.get('idempotency-key'), body: await request.json() })
      return (answers[sent.length - 1] ?? answers.at(-1))?.() ?? refusal('INTERNAL_UNEXPECTED')
    }),
    ...centralHub([CLIENT]),
  )
  return sent
}

function registered() {
  return HttpResponse.json(registerClient.success.body.parse({ client: Client.parse(CLIENT) }), {
    status: 201,
  })
}

function open() {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: ['/operations/clients/new'] }),
  )
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

const TYPED = {
  CNPJ: '12.abc.345/01de-35',
  'Razão social': 'Empresa Teste Ltda',
  'Nome de exibição': 'Empresa Teste',
  'E-mail do administrador': 'davi@example.test',
}

async function fill(values: Record<string, string> = TYPED) {
  expect(await screen.findByText('Ele recebe um convite e entra como primeiro dono.')).toBeTruthy()
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  const button = screen.getByRole('button', { name: 'Cadastrar cliente' })
  fireEvent.click(button)
  return button
}

test('201: abre o cliente, com o CNPJ sem máscara em maiúsculas e uma chave de tentativa', async () => {
  const sent = hub([registered])
  const router = open()
  await fill()
  expect(await screen.findByRole('heading', { name: 'Empresa Teste' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/operations/clients/${CLIENT.companyId}`)
  expect(sent.map((one) => one.body)).toEqual([
    {
      cnpj: '12ABC34501DE35',
      legalName: 'Empresa Teste Ltda',
      name: 'Empresa Teste',
      ownerEmail: 'davi@example.test',
    },
  ])
  expect(sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
})

test('CNPJ com dígito errado: o erro no campo e nenhum pedido; dois cliques, um pedido', async () => {
  const sent = hub([registered])
  open()
  await fill({ ...TYPED, CNPJ: '12.ABC.345/01DE-36' })
  expect(
    await screen.findByText('Confira o CNPJ: 14 posições, com os dois dígitos verificadores.'),
  ).toBeTruthy()
  expect(screen.getByLabelText('CNPJ').getAttribute('aria-invalid')).toBe('true')
  expect(sent).toEqual([])
  fireEvent.change(screen.getByLabelText('CNPJ'), { target: { value: TYPED.CNPJ } })
  const button = screen.getByRole('button', { name: 'Cadastrar cliente' })
  fireEvent.click(button)
  fireEvent.click(button)
  await screen.findByRole('heading', { name: 'Empresa Teste' })
  expect(sent.length).toBe(1)
})

for (const [code, label, sentence] of [
  ['CLIENT_EXISTS', 'CNPJ', 'Já existe um cliente com este CNPJ.'],
  [
    'CLIENT_OWNER_IS_OPERATOR',
    'E-mail do administrador',
    'Este e-mail é de um operador da Conexus.',
  ],
] as const) {
  test(`${code}: a frase no campo ${label}, e a próxima tentativa leva outra chave`, async () => {
    const sent = hub([() => refusal(code), registered])
    open()
    await fill()
    expect(await screen.findByText(sentence)).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByLabelText(label).getAttribute('aria-invalid')).toBe('true'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar cliente' }))
    await screen.findByRole('heading', { name: 'Empresa Teste' })
    expect(sent[1]?.key).not.toBe(sent[0]?.key)
  })
}

for (const [name, reply] of undecided('{"client":{"companyId":"bbb')) {
  test(`${name}: "Não confirmamos o cadastro.", os valores ficam e a nova tentativa leva a mesma chave`, async () => {
    const sent = hub([reply, registered])
    open()
    await fill()
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Não confirmamos o cadastro. Veja a lista antes de tentar de novo.',
    )
    expect(screen.getByLabelText('Razão social')).toHaveProperty('value', 'Empresa Teste Ltda')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar cliente' }))
    await screen.findByRole('heading', { name: 'Empresa Teste' })
    expect(sent.length).toBe(2)
    expect(sent[1]?.key).toBe(sent[0]?.key)
  })
}

test('enquanto envia, "Cadastrando…" bloqueado', async () => {
  const answer = Promise.withResolvers<void>()
  hub([() => refusal('INTERNAL_UNEXPECTED')])
  server.use(
    http.post('*/api/clients', async () => {
      await answer.promise
      return registered()
    }),
  )
  open()
  await fill()
  const pending = await screen.findByRole('button', { name: 'Cadastrando…' })
  expect(pending).toHaveProperty('disabled', true)
  answer.resolve()
  await screen.findByRole('heading', { name: 'Empresa Teste' })
})

test('recarregar durante um cadastro que não decidiu: mostra a lista atual e pergunta, a chave se perde e nada é refeito', async () => {
  const [, cut] = undecided('{"client":{"companyId":"bbb')[0] ?? []
  const sent = hub([cut ?? registered, registered])
  open()
  await fill()
  await screen.findByRole('alert')
  cleanup()
  const reloaded = open()
  expect(
    await screen.findByText('O último cadastro ficou sem resposta. O cliente está nesta lista?'),
  ).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Central de Operação' })).toBeTruthy()
  expect(screen.getByText('Empresa Teste')).toBeTruthy()
  await waitFor(() => expect(reloaded.state.location.search).toEqual({}))
  expect(sent.length).toBe(1)
  await reloaded.navigate({ to: '/operations/clients/new' })
  await fill()
  await screen.findByRole('heading', { name: 'Empresa Teste' })
  expect(sent.length).toBe(2)
  expect(sent[1]?.key).not.toBe(sent[0]?.key)
})
