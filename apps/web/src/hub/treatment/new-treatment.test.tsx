import { FAILURES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { delay } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  bound,
  LIST,
  listOf,
  MODEL_ID,
  modelOf,
  NEW_ID,
  openTreatment,
  refused,
  venda,
  version,
} from './test-hub.tsx'

// Novo tratamento and Propor mudança: the form, what each refusal says on its field, and the proposal that waits for the yes.
const server = hubServer()
const BUSINESS = `${LIST}?layer=business`
const SQL = 'select nunota\nfrom current.sankhya_notas'

async function openForm(label = 'Novo tratamento') {
  fireEvent.click(await screen.findByRole('button', { name: label }))
  return within(await screen.findByRole('dialog', { name: label }))
}

function fill(form: ReturnType<typeof within>, values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(form.getByRole('textbox', { name: label }), { target: { value } })
  }
}

const TYPED = { Nome: 'venda', 'O que conta como esta tabela': 'Nota que virou venda', SQL }

test('sem tratamento, Negócio diz a frase do vazio e oferece Novo tratamento', async () => {
  openTreatment(server, { path: BUSINESS })
  expect(await screen.findByText('Nenhum tratamento ainda')).toBeTruthy()
  expect(screen.queryByText(/Nenhum conceito/)).toBeNull()
  expect(await screen.findByRole('button', { name: 'Novo tratamento' })).toBeTruthy()
})

test('Novo tratamento envia o nome, a descrição e o SQL, e abre a proposta à espera do sim com as tabelas que o SQL lê', async () => {
  const { view, sent } = openTreatment(server, { path: BUSINESS })
  view.models[NEW_ID] = modelOf({ id: NEW_ID, versions: [version()] })
  const form = await openForm()
  expect(form.getByRole('textbox', { name: 'SQL' }).classList.contains('font-mono')).toBe(true)
  expect(
    ['Nome', 'O que conta como esta tabela', 'SQL'].map((name) =>
      form.getByRole('textbox', { name }).getAttribute('maxlength'),
    ),
  ).toEqual(['60', '500', '20000'])

  fill(form, TYPED)
  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

  expect(await screen.findByText('Proposta, à espera do sim')).toBeTruthy()
  expect(screen.getByText('Copiado › sankhya_notas')).toBeTruthy()
  expect(sent.map(({ method, body }) => ({ method, body }))).toEqual([
    {
      method: 'POST',
      body: { name: 'venda', description: 'Nota que virou venda', sql: SQL },
    },
  ])
})

test('um nome que não é de tabela é recusado no campo, sem pedir nada ao Hub', async () => {
  const { sent } = openTreatment(server, { path: BUSINESS })
  const form = await openForm()

  fill(form, { ...TYPED, Nome: 'Venda Boa' })
  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

  expect(
    await form.findByText('Use letras minúsculas, números e _, começando por uma letra.'),
  ).toBeTruthy()
  expect(sent).toEqual([])
})

test('sem SQL, o campo pede o SELECT', async () => {
  openTreatment(server, { path: BUSINESS })
  const form = await openForm()
  fill(form, { ...TYPED, SQL: '' })
  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))
  expect(await form.findByText('Escreva o SELECT do tratamento.')).toBeTruthy()
})

const ON_THE_SQL = [
  [
    'TREATMENT_SQL_INVALID',
    'O SQL tem um erro de escrita.',
    { position: { line: 2, column: 5 } },
    'Linha 2, coluna 5.',
  ],
  ['TREATMENT_SQL_NOT_A_QUERY', 'Escreva um só comando, que comece com SELECT ou WITH.', {}, ''],
  ['TREATMENT_SQL_TEMPLATE', 'Escreva só SQL, sem {{, {% ou {#.', {}, ''],
  [
    'TREATMENT_INPUT_UNQUALIFIED',
    'Escreva cada tabela com a área na frente: current, tratado ou negocio.',
    { table: 'sankhya_notas' },
    'sankhya_notas',
  ],
  [
    'TREATMENT_INPUT_UNKNOWN',
    'A empresa não tem uma das tabelas que o SQL lê.',
    { table: 'current.sankhya_notax' },
    'current.sankhya_notax',
  ],
  [
    'TREATMENT_INPUT_CYCLE',
    'Este tratamento leria a própria tabela, direto ou por outro tratamento.',
    {},
    '',
  ],
] as const

test.each(ON_THE_SQL)(
  'a recusa %s aparece no campo do SQL, com o texto da tela, e o que foi digitado fica',
  async (code, phrase, extra, named) => {
    openTreatment(server, { path: BUSINESS, answers: { propose: () => refused(code, extra) } })
    const form = await openForm()
    fill(form, TYPED)

    fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

    const sql = form.getByRole('textbox', { name: 'SQL' })
    await waitFor(() => expect(sql.getAttribute('aria-invalid')).toBe('true'))
    const described = document.getElementById(sql.getAttribute('aria-describedby') ?? '')
    expect(described?.textContent).toContain(phrase)
    expect(described?.textContent).toContain(named)
    expect(form.getByRole('textbox', { name: 'Nome' })).toHaveProperty('value', 'venda')
    expect(sql).toHaveProperty('value', SQL)
    expect(form.getByRole('textbox', { name: 'Nome' }).getAttribute('aria-invalid')).toBeNull()
  },
)

test('um nome já usado aparece no campo do nome', async () => {
  openTreatment(server, {
    path: BUSINESS,
    answers: { propose: () => refused('TREATMENT_NAME_TAKEN') },
  })
  const form = await openForm()
  fill(form, TYPED)

  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

  const name = form.getByRole('textbox', { name: 'Nome' })
  await waitFor(() => expect(name.getAttribute('aria-invalid')).toBe('true'))
  expect(document.getElementById(name.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
    'Outro tratamento da empresa já tem este nome.',
  )
  expect(form.getByRole('textbox', { name: 'SQL' })).toHaveProperty('value', SQL)
})

test.each(['LAKE_NOT_READY', 'DATABASE_UNAVAILABLE'] as const)(
  '%s fica acima do botão, e nenhum campo é marcado',
  async (code) => {
    openTreatment(server, { path: BUSINESS, answers: { propose: () => refused(code) } })
    const form = await openForm()
    fill(form, TYPED)

    fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

    const alert = await form.findByRole('alert')
    expect(alert.getAttribute('data-slot')).toBe('alert')
    expect(form.getByRole('textbox', { name: 'SQL' }).getAttribute('aria-invalid')).toBeNull()
    expect(form.getByRole('textbox', { name: 'Nome' })).toHaveProperty('value', 'venda')
  },
)

test('enquanto salva, o botão fica ocupado', async () => {
  openTreatment(server, {
    path: BUSINESS,
    answers: {
      propose: async () => {
        await delay(200)
        return refused('DATABASE_UNAVAILABLE')
      },
    },
  })
  const form = await openForm()
  fill(form, TYPED)

  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

  expect((await form.findByRole('button', { name: 'Salvando…' })).hasAttribute('disabled')).toBe(
    true,
  )
  expect(await form.findByRole('alert')).toBeTruthy()
})

function withBound() {
  return {
    path: `${LIST}/business/${MODEL_ID}`,
    view: {
      list: listOf({ tables: [venda({ active: bound() })] }),
      models: { [MODEL_ID]: modelOf({ versions: [bound()] }) },
    },
  }
}

test('Propor mudança abre o formulário com o SQL da versão ligada e envia a nova versão', async () => {
  const { sent, view } = openTreatment(server, withBound())
  const waiting = version({ number: 2, sql: 'select 2' })
  view.models[MODEL_ID] = modelOf({ versions: [waiting, bound()] })
  view.list = listOf({ tables: [venda({ active: bound(), proposal: waiting })] })
  const form = await openForm('Propor mudança')
  expect(form.getByRole('textbox', { name: 'SQL' })).toHaveProperty('value', SQL)
  expect(form.queryByRole('textbox', { name: 'Nome' })).toBeNull()

  fill(form, { SQL: `${SQL}\nwhere status <> 'C'` })
  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(sent).toEqual([
    {
      method: 'POST',
      path: `/api/companies/${'a'.repeat(32)}/data/treated/models/${MODEL_ID}/versions`,
      body: { description: 'O que conta como venda', sql: `${SQL}\nwhere status <> 'C'` },
    },
  ])
  expect(screen.getByRole('button', { name: 'Ligar' })).toBeTruthy()
})

test('sem versão ligada, Propor mudança abre o formulário vazio, mesmo com uma proposta esperando', async () => {
  const waiting = version({ number: 1, sql: 'select 2' })
  const { view } = openTreatment(server, { path: `${LIST}/business/${MODEL_ID}` })
  view.models[MODEL_ID] = modelOf({ versions: [waiting] })
  view.list = listOf({ tables: [venda({ proposal: waiting })] })
  const form = await openForm('Propor mudança')
  expect(form.getByRole('textbox', { name: 'SQL' })).toHaveProperty('value', '')
})

test('uma proposta ao mesmo tempo diz que a versão já não é a de agora, e o que foi digitado fica', async () => {
  openTreatment(server, {
    ...withBound(),
    answers: { version: () => refused('TREATMENT_VERSION_CHANGED') },
  })
  const form = await openForm('Propor mudança')
  fill(form, { SQL: 'select 2' })

  fireEvent.click(form.getByRole('button', { name: 'Salvar' }))

  expect((await form.findByRole('alert')).textContent).toContain(
    'Esta versão já não é a proposta de agora.',
  )
  expect(form.getByRole('textbox', { name: 'SQL' })).toHaveProperty('value', 'select 2')
})

test('um modelo cujo endereço não existe dá não encontrado e não abre o formulário', async () => {
  openTreatment(server, { path: `${LIST}/business/${MODEL_ID}` })
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Propor mudança' })).toBeNull()
})
