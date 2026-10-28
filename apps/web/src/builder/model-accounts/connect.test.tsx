import type { SignInKind } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { choose, modelHub } from './test-hub.tsx'

const server = hubServer()
const FIELDS = ['Nome da conta', 'Chave de API', 'Fornecedor']
const KEY = 'sk-segredo-plantado-9f3A'

function open(kinds: SignInKind[], answers: Answers = {}) {
  const shown: View = {
    company: [],
    mine: [],
    order: [],
    kinds,
    mayManage: true,
  }
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/settings/model-accounts`] }),
  )
  render(<Conexus conexus={conexus} />)
  return hub.sent
}

/** The company's "Ligar conta", the page's second: the person's own is above it. */
function pageButton() {
  return within(screen.getByRole('region', { name: 'Contas da empresa' })).getByRole('button', {
    name: 'Ligar conta',
  })
}

function submit() {
  return within(screen.getByRole('dialog', { name: 'Ligar conta' })).getByRole('button', {
    name: 'Ligar conta',
  })
}

async function openPanel() {
  await screen.findByRole('region', { name: 'Contas da empresa' })
  fireEvent.click(pageButton())
  return screen.findByRole('dialog', { name: 'Ligar conta' })
}

async function fillKey(label: string) {
  fireEvent.change(screen.getByLabelText('Buscar fornecedor'), { target: { value: 'mist' } })
  await choose(screen.getByLabelText('Fornecedor'), 'Mistral')
  fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: label } })
  fireEvent.change(screen.getByLabelText('Chave de API'), { target: { value: KEY } })
}

test('Ligar conta: busca o fornecedor, "Ligando…", manda o corpo com a chave de tentativa e mostra só o fim da chave', async () => {
  const held = Promise.withResolvers<void>()
  const sent = open([], {
    connect: () => undefined,
  })
  await openPanel()
  expect(screen.queryByRole('button', { name: 'Entrar com assinatura' })).toBeNull()
  fireEvent.click(screen.getByLabelText('Fornecedor'))
  expect((await screen.findAllByRole('option')).map((one) => one.textContent)).toContain('OpenAI')
  fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  fireEvent.change(screen.getByLabelText('Buscar fornecedor'), { target: { value: 'mist' } })
  fireEvent.click(screen.getByLabelText('Fornecedor'))
  expect((await screen.findAllByRole('option')).map((one) => one.textContent)).toEqual(['Mistral'])
  fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  await fillKey('Time 3')
  expect(screen.getByText('Escolhido: Mistral')).toBeTruthy()
  expect(screen.getByLabelText('Chave de API').getAttribute('type')).toBe('password')
  held.resolve()
  fireEvent.click(submit())
  expect(await screen.findByText('Time 3')).toBeTruthy()
  expect(sent[0]?.body).toEqual({
    owner: 'company',
    provider: 'mistral',
    label: 'Time 3',
    key: KEY,
  })
  expect(sent[0]?.attemptKey).toBeTruthy()
  expect(document.body.textContent).not.toContain(KEY)
  expect(screen.queryByDisplayValue(KEY)).toBeNull()
  await waitFor(() => expect(document.activeElement).toBe(pageButton()))
})

test('"Ligando…" desliga o botão enquanto o Hub não respondeu', async () => {
  const held = Promise.withResolvers<void>()
  open([], {
    connect: () => {
      void held.promise
      return undefined
    },
  })
  await openPanel()
  await fillKey('Time 3')
  fireEvent.click(submit())
  expect(await screen.findByRole('button', { name: 'Ligando…' })).toHaveProperty('disabled', true)
  held.resolve()
  expect(await screen.findByText('Time 3')).toBeTruthy()
})

for (const [code, field] of [
  ['MODEL_ACCOUNT_LABEL_INVALID', 'Nome da conta'],
  ['MODEL_ACCOUNT_INVALID', 'Chave de API'],
  ['MODEL_PROVIDER_UNKNOWN', 'Fornecedor'],
] as const) {
  test(`422 ${code}: a frase no campo "${field}" e só nele`, async () => {
    open([], { connect: () => refusal(code) })
    await openPanel()
    await fillKey('Time 3')
    fireEvent.click(submit())
    expect((await screen.findByText(FAILURES[code].phrase)).getAttribute('role')).toBe('alert')
    await waitFor(() =>
      expect(screen.getByLabelText(field).getAttribute('aria-invalid')).toBe('true'),
    )
    for (const other of FIELDS.filter((one) => one !== field)) {
      expect(screen.getByLabelText(other).getAttribute('aria-invalid')).toBeNull()
    }
    expect(screen.getByLabelText('Chave de API')).toHaveProperty('value', KEY)
    expect(screen.queryByText(/· ligada$/)).toBeNull()
  })
}

test('resposta cortada: a chave de tentativa fica e a nova tentativa a leva; depois dela, uma nova', async () => {
  let cut = true
  const sent = open([], {
    connect: () => (cut ? new HttpResponse('{"account"', { status: 201 }) : undefined),
  })
  await openPanel()
  await fillKey('Time 3')
  fireEvent.click(submit())
  expect(await screen.findByText('Não confirmamos a ligação. Tente de novo.')).toBeTruthy()
  cut = false
  fireEvent.click(submit())
  await screen.findByText('Time 3')
  expect(sent).toHaveLength(2)
  expect(sent[1]?.attemptKey).toBe(sent[0]?.attemptKey)

  await openPanel()
  await fillKey('Time 4')
  fireEvent.click(submit())
  await waitFor(() => expect(sent).toHaveLength(3))
  expect(sent[2]?.attemptKey).not.toBe(sent[0]?.attemptKey)
})

test('Cancelar fecha o painel sem ligar nada', async () => {
  const sent = open([])
  const panel = await openPanel()
  fireEvent.click(within(panel).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Ligar conta' })).toBeNull())
  expect(sent).toHaveLength(0)
})

test('Ligar conta abre o painel lateral, e Esc o fecha e devolve o foco ao botão', async () => {
  open([])
  const panel = await openPanel()
  expect(within(panel).getByLabelText('Nome da conta')).toBeTruthy()
  fireEvent.keyDown(panel, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Ligar conta' })).toBeNull())
  await waitFor(() => expect(document.activeElement).toBe(pageButton()))
})

test('Entrar com assinatura só oferece os tipos abertos', async () => {
  open(['claude_subscription'])
  await openPanel()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  const kinds = await screen.findByLabelText('Tipo de assinatura')
  expect(kinds.textContent).toBe('Assinatura Claude')
  fireEvent.click(kinds)
  expect((await screen.findAllByRole('option')).map((one) => one.textContent)).toEqual([
    'Assinatura Claude',
  ])
})

test('Entrar com Google: o campo pede o endereço de retorno inteiro e o Hub recebe o que se colou', async () => {
  const sent = open(['claude_subscription', 'google_cliproxy'])
  await openPanel()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  await choose(await screen.findByLabelText('Tipo de assinatura'), 'Google')
  fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: 'Time G' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gerar endereço de entrada' }))
  const field = await screen.findByLabelText('Endereço de retorno do Google')
  expect(screen.queryByLabelText(/código do Google/)).toBeNull()
  expect(screen.getByText(/Cole aqui o endereço inteiro dessa página/)).toBeTruthy()
  const address = 'http://localhost:51121/oauth-callback?state=abc&code=xyz'
  fireEvent.change(field, { target: { value: address } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Time G')).toBeTruthy()
  expect(sent.at(-1)?.body).toEqual({ code: address })
})

test('Entrar com assinatura: o endereço e o campo do código, "Entrando…" e a conta ligada', async () => {
  const sent = open(['claude_subscription', 'google_cliproxy'])
  await openPanel()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  fireEvent.change(await screen.findByLabelText('Nome da conta'), { target: { value: 'Time 2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gerar endereço de entrada' }))
  const link = await screen.findByRole('link', { name: 'Abrir a página de entrada' })
  expect(link.getAttribute('href')).toBe('https://claude.example.test/oauth/authorize?state=abc')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  expect(screen.getByText(/O endereço vale até/)).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Código da Anthropic'), { target: { value: 'abc#def' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Time 2')).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([
    { owner: 'company', kind: 'claude_subscription', label: 'Time 2' },
    { code: 'abc#def' },
  ])
})

test('um endereço que não é https aparece como texto, sem link', async () => {
  open(['claude_subscription'], {
    start: () =>
      HttpResponse.json(
        {
          signInId: '00000000-0000-4000-8000-0000000000aa',
          url: 'http://claude.example.test/oauth',
          expiresAt: '2026-10-19T12:10:00.000Z',
        },
        { status: 201 },
      ),
  })
  await openPanel()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Gerar endereço de entrada' }))
  expect(await screen.findByText('http://claude.example.test/oauth')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Abrir a página de entrada' })).toBeNull()
})

for (const [code, sentence] of [
  [
    'MODEL_ACCOUNT_REFUSED',
    'O fornecedor recusou este código. Entre de novo e cole o código novo.',
  ],
  ['MODEL_ACCOUNT_SIGN_IN_EXPIRED', 'O código venceu. Entre de novo.'],
  [
    'MODEL_ACCOUNT_KIND_OFF',
    'Este tipo de conta não está liberado para a empresa. Fale com a Conexus.',
  ],
] as const) {
  test(`${code} ao trocar o código: a frase do Hub e a entrada recomeça, com o foco nela`, async () => {
    open(['claude_subscription'], { complete: () => refusal(code) })
    await openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
    fireEvent.change(await screen.findByLabelText('Nome da conta'), { target: { value: 'Time 2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gerar endereço de entrada' }))
    fireEvent.change(await screen.findByLabelText('Código da Anthropic'), {
      target: { value: 'velho' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(sentence)
    await waitFor(() => expect(document.activeElement).toBe(alert))
    expect(screen.getByRole('button', { name: 'Gerar endereço de entrada' })).toBeTruthy()
    expect(screen.queryByText(/· ligada$/)).toBeNull()
  })
}

test('MODEL_ACCOUNT_KIND_OFF ao começar: a frase fica no formulário', async () => {
  open(['claude_subscription'], { start: () => refusal('MODEL_ACCOUNT_KIND_OFF') })
  await openPanel()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Gerar endereço de entrada' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este tipo de conta não está liberado para a empresa. Fale com a Conexus.',
  )
})
