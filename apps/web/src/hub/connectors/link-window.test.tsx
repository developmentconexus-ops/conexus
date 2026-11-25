import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { delay, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal, undecided } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE, REFUSAL, workingOf } from './fixtures.ts'
import { readyLake } from './lake-fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import {
  connectionsHub,
  fill,
  mount,
  openForm,
  openIntegrations,
  PAGE,
  SECRETS,
  viewOf,
} from './test-hub.tsx'

const server = hubServer()

function open(view: View = viewOf({ lake: readyLake() }), answers: Answers = {}) {
  return openIntegrations(server, view, answers)
}

/** Fills the keys and clicks "Continuar"; the window is the one "Ligar" opened. */
function connect(dialog: HTMLElement, name = 'Comercial') {
  fill(name)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
}

test('acesso: a barra de passos, os campos do kit com a ajuda, Desde depois do X-Token, Enviar link e Continuar', async () => {
  open()
  const dialog = await openForm()
  const bar = within(within(dialog).getByRole('list', { name: 'Passos' }))
  expect(bar.getAllByRole('listitem').map((one) => one.getAttribute('aria-current'))).toEqual([
    'step',
    null,
    null,
    null,
  ])
  expect(bar.getByText('Testando e lendo')).toBeTruthy()
  expect(within(dialog).getByText('Passo 1 de 4 · Acesso')).toBeTruthy()
  expect(within(dialog).getByRole('region', { name: 'Antes de colar' })).toBeTruthy()
  expect(
    within(dialog).getByRole('link', { name: 'Onde achar Client ID, Client Secret' }),
  ).toBeTruthy()
  expect(within(dialog).getByLabelText<HTMLInputElement>('Nome da ligação').value).toBe('Sankhya')
  const labels = ['Client ID', 'Client Secret', 'X-Token', 'Desde']
  const fields = labels.map((label) => within(dialog).getByLabelText(label, { exact: true }))
  fields.forEach((field, at) => {
    const next = fields[at + 1]
    if (next)
      expect(field.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
  for (const label of Object.keys(SECRETS)) {
    expect(within(dialog).getByLabelText(label).getAttribute('autocomplete')).toBe('off')
  }
  expect(within(dialog).getByRole('button', { name: 'Enviar link' })).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Continuar' })).toBeTruthy()
  expect(within(dialog).queryByRole('button', { name: 'Ligar e testar' })).toBeNull()
})

test('acesso: um conector de acesso por autorização não abre a janela de passos', async () => {
  open(viewOf({ connectors: [MERCADO_LIVRE] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar Mercado Livre' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ligar Mercado Livre' })
  expect(within(dialog).queryByRole('list', { name: 'Passos' })).toBeNull()
  expect(within(dialog).getByRole('button', { name: 'Continuar no Mercado Livre' })).toBeTruthy()
})

test('a data inicial: vazia diz "Todo o histórico"; depois de hoje recusa e desliga Continuar; uma data certa muda a ajuda', async () => {
  open()
  const dialog = await openForm()
  const since = within(dialog).getByLabelText<HTMLInputElement>('Desde')
  expect(since.value).toBe('')
  expect(within(dialog).getByText(/^Todo o histórico\./)).toBeTruthy()
  fireEvent.change(since, { target: { value: '2999-01-01' } })
  expect(await within(dialog).findByText('A data não pode ser depois de hoje.')).toBeTruthy()
  expect(since.getAttribute('aria-invalid')).toBe('true')
  expect(within(dialog).getByRole('button', { name: 'Continuar' }).hasAttribute('disabled')).toBe(
    true,
  )
  fireEvent.change(since, { target: { value: '2021-11-24' } })
  await waitFor(() =>
    expect(within(dialog).queryByText('A data não pode ser depois de hoje.')).toBeNull(),
  )
  expect(
    within(dialog).getByText(/Vale para as tabelas que seguem uma data de alteração/),
  ).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Continuar' }).hasAttribute('disabled')).toBe(
    false,
  )
})

test('testando: Continuar liga com as chaves, mostra "Testando a ligação…" e depois "Lendo o que o Sankhya oferece"', async () => {
  const gate = Promise.withResolvers<void>()
  const sent = open()
  server.use(
    http.get('*/api/companies/*/connections/*/lake-tables', async () => {
      await gate.promise
      return undefined
    }),
    http.post('*/api/companies/*/connections/*/test', async () => {
      await delay(30)
      return undefined
    }),
  )
  const dialog = await openForm()
  connect(dialog)
  expect(await screen.findByText('Testando a ligação…')).toBeTruthy()
  expect(await screen.findByText('Lendo o que o Sankhya oferece')).toBeTruthy()
  expect(
    within(screen.getByRole('list', { name: 'Passos' }))
      .getAllByRole('listitem')[1]
      ?.getAttribute('aria-current'),
  ).toBe('step')
  gate.resolve()
  expect(await screen.findByRole('button', { name: 'Continuar' })).toBeTruthy()
  expect(sent[0]?.body).toEqual({
    connector: 'sankhya',
    name: 'Comercial',
    credential: {
      clientId: 'id-plantado-1',
      clientSecret: 'segredo-plantado-2',
      xToken: 'token-plantado-3',
    },
  })
  expect(sent[0]?.attemptKey).toBeTruthy()
  expect(sent[1]?.path).toMatch(/\/test$/)
  expect(document.body.textContent).not.toContain('segredo-plantado-2')
})

test('testando: o sistema que não responde mostra a frase da matriz e os campos para tentar de novo', async () => {
  const hub = connectionsHub(viewOf({ lake: readyLake() }), {}, (one) => ({
    result: 'UNREACHABLE',
    native: null,
    connection: one,
  }))
  server.use(...hub.handlers)
  mount(PAGE)
  const dialog = await openForm()
  connect(dialog)
  expect(
    await screen.findByText('O Sankhya não respondeu. Tente de novo em alguns minutos.'),
  ).toBeTruthy()
  expect(within(dialog).getByLabelText('Client ID', { exact: true })).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Continuar' })).toBeTruthy()
})

test('a recusa: "O Sankhya recusou as chaves", a resposta por extenso, os campos com o nome fixo e Enviar link; chaves boas seguem', async () => {
  let tests = 0
  const view = viewOf({ lake: readyLake() })
  const hub = connectionsHub(view, {}, (one) => {
    tests += 1
    return tests === 1
      ? { result: 'AUTH_REFUSED', native: REFUSAL, connection: { ...one, state: 'NEEDS_REAUTH' } }
      : workingOf(one)
  })
  server.use(...hub.handlers)
  mount(PAGE)
  const dialog = await openForm()
  connect(dialog)
  expect(await screen.findByText('O Sankhya recusou as chaves')).toBeTruthy()
  expect(
    screen.getByText('Sankhya respondeu 403, código SEM_ACESSO: Sem acesso à tela'),
  ).toBeTruthy()
  expect(within(dialog).queryByLabelText('Nome da ligação')).toBeNull()
  expect(within(dialog).getByText('Comercial')).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Enviar link' })).toBeTruthy()
  fill()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect(await screen.findByText('Marque ao menos uma tabela para continuar.')).toBeTruthy()
  const put = hub.sent.find((one) => one.method === 'PUT')
  expect(put?.path).toMatch(/\/credential$/)
  expect(
    hub.sent.filter((one) => one.method === 'POST' && one.path.endsWith('/connections')),
  ).toHaveLength(1)
})

test.each([
  ['CONNECTION_NAME_TAKEN', 'Já existe uma ligação desse conector com esse nome. Dê outro nome.'],
  ['CONNECTION_NAME_INVALID', 'Dê um nome à ligação, de até 60 letras.'],
] as const)(
  'acesso: %s aparece no campo do nome e as chaves coladas ficam',
  async (code, sentence) => {
    open(viewOf(), { link: () => refusal(code) })
    const dialog = await openForm()
    connect(dialog)
    const name = within(dialog).getByLabelText('Nome da ligação')
    await waitFor(() => expect(name.getAttribute('aria-invalid')).toBe('true'))
    expect(within(dialog).getByText(sentence)).toBeTruthy()
    expect(within(dialog).getByDisplayValue(SECRETS['X-Token'])).toBeTruthy()
  },
)

test('acesso: um nome já usado por outra pessoa lê a lista de novo atrás da janela', async () => {
  let reads = 0
  open(viewOf(), { link: () => refusal('CONNECTION_NAME_TAKEN') })
  server.use(
    http.get('*/api/companies/*/connections', () => {
      reads += 1
      return undefined
    }),
  )
  const dialog = await openForm()
  fill('Comercial')
  const before = reads
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  await waitFor(() => expect(reads).toBeGreaterThan(before))
})

test('acesso: chave inválida mostra a frase no formulário; chave grande diz que passou do tamanho; campo vazio pede antes de mandar', async () => {
  const sent = open(viewOf(), { link: () => refusal('CONNECTION_CREDENTIAL_INVALID') })
  const dialog = await openForm()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect((await within(dialog).findAllByText(/^Cole /)).length).toBe(3)
  expect(sent).toHaveLength(0)
  fill('Comercial')
  fireEvent.change(within(dialog).getByLabelText('Client ID', { exact: true }), {
    target: { value: 'a'.repeat(201) },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect(await within(dialog).findByText('Client ID passa de 200 letras.')).toBeTruthy()
  expect(sent).toHaveLength(0)
  fireEvent.change(within(dialog).getByLabelText('Client ID', { exact: true }), {
    target: { value: SECRETS['Client ID'] },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect(
    await within(dialog).findByText('Confira os campos: cole cada chave inteira.'),
  ).toBeTruthy()
})

test.each(undecided('{"connection":'))(
  'acesso: ligar com %s diz "Não confirmamos a ligação" e a repetição leva a mesma chave de tentativa',
  async (_name, reply) => {
    let answers = 0
    const sent = open(viewOf({ lake: readyLake() }), {
      link: () => (answers++ === 0 ? reply() : undefined),
    })
    const dialog = await openForm()
    connect(dialog)
    expect((await within(dialog).findByRole('alert')).textContent).toBe(
      'Não confirmamos a ligação. Tente de novo.',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByText('Marque ao menos uma tabela para continuar.')).toBeTruthy()
    expect(sent[1]?.attemptKey).toBe(sent[0]?.attemptKey)
  },
)

test('acesso: o nome sugerido é o do conector, e vazio quando a empresa já tem uma ligação com ele', async () => {
  open(viewOf({ connections: [connectionOf({ name: 'Sankhya' })] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar outra ligação do Sankhya' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ligar Sankhya' })
  expect(within(dialog).getByLabelText<HTMLInputElement>('Nome da ligação').value).toBe('')
})
