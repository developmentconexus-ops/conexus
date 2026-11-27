import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { built, failed, listOf, notas, openTreatment, venda } from './test-hub.tsx'

// Tratado: the list of treated tables, and Tratar agora beside the last run.
const server = hubServer()

async function layer() {
  await screen.findByRole('navigation', { name: 'Dados' })
  return within(screen.getByRole('main'))
}

test('Tratar agora abre a rodada, sem corpo, e o botão fica desligado enquanto ela roda', async () => {
  const { view, sent } = openTreatment(server, {
    view: { list: listOf({ tables: [notas({ lastRun: built() })] }) },
  })
  const main = await layer()
  const button = await main.findByRole('button', { name: 'Tratar agora' })

  view.list = listOf({
    lastRun: { state: 'RUNNING', since: '2026-11-26T17:00:00.000Z', stopping: false },
    tables: [notas({ lastRun: built() })],
  })
  fireEvent.click(button)

  await waitFor(() =>
    expect(sent.filter((one) => one.path.endsWith('/treated/run'))).toEqual([
      { method: 'POST', path: expect.stringContaining('/data/treated/run'), body: undefined },
    ]),
  )
  await waitFor(() =>
    expect(main.getByRole('button', { name: 'Tratar agora' }).hasAttribute('disabled')).toBe(true),
  )
})

test.each([
  ['ALREADY_RUNNING', 'Uma rodada de tratamento já está em curso.'],
  ['LAKE_NOT_READY', 'O lago desta empresa ainda não está pronto para os tratamentos.'],
  ['NOTHING_TO_TREAT', 'A empresa ainda não tem tratamento para rodar.'],
] as const)(
  'Tratar agora recusado com %s diz a frase do Hub e o botão volta',
  async (code, phrase) => {
    openTreatment(server, {
      view: { list: listOf({ tables: [notas()] }) },
      answers: { run: () => refusal(code) },
    })
    const main = await layer()

    fireEvent.click(await main.findByRole('button', { name: 'Tratar agora' }))

    expect((await main.findByRole('alert')).textContent).toContain(phrase)
    expect(main.getByRole('button', { name: 'Tratar agora' }).hasAttribute('disabled')).toBe(false)
  },
)

test('só quem pode ligar vê Tratar agora', async () => {
  openTreatment(server, { role: 'member', view: { list: listOf({ tables: [notas()] }) } })
  const main = await layer()
  expect(await main.findByText(/^Seu papel ainda não lê nenhuma tabela/)).toBeTruthy()
  expect(main.queryByRole('button', { name: 'Tratar agora' })).toBeNull()
})

test('quem pode propor mas não ligar não vê Tratar agora', async () => {
  openTreatment(server, {
    may: { approveTreatment: false },
    view: { list: listOf({ tables: [notas({ lastRun: built() })] }) },
  })
  const main = await layer()
  expect(await main.findByRole('link', { name: 'Notas' })).toBeTruthy()
  expect(main.queryByRole('button', { name: 'Tratar agora' })).toBeNull()
})

test('com o lago de uma receita anterior, Tratado diz para apagar e criar de novo', async () => {
  openTreatment(server, { view: { list: listOf({ lake: 'OUTDATED', tables: [notas()] }) } })
  const main = await layer()
  expect(await main.findByText('Apague e crie o lago de novo na Central para tratar')).toBeTruthy()
  expect(main.queryByRole('button', { name: 'Tratar agora' })).toBeNull()
  expect(main.queryByText('sankhya_notas')).toBeNull()
})

test('sem tabela tratada, Tratado diz a frase do vazio', async () => {
  openTreatment(server)
  const main = await layer()
  expect(
    await main.findByText(
      'Nenhuma tabela tratada. As tabelas de um sistema com molde aparecem aqui quando ele copia.',
    ),
  ).toBeTruthy()
})

test('só as tabelas tratadas aparecem em Tratado, e as de Negócio ficam em Negócio', async () => {
  openTreatment(server, {
    view: { list: listOf({ tables: [notas({ lastRun: failed('COLUMN_NOT_FOUND') }), venda()] }) },
  })
  const main = await layer()
  expect(await main.findByRole('link', { name: 'Notas' })).toBeTruthy()
  expect(main.queryByText('venda')).toBeNull()
})

test('cada tabela mostra o rótulo como o link e o nome no lago embaixo, sob o sistema e a conexão', async () => {
  openTreatment(server, { view: { list: listOf({ tables: [notas({ lastRun: built() })] }) } })
  const main = await layer()
  expect(await main.findByRole('heading', { name: 'Sankhya · Matriz' })).toBeTruthy()
  const link = await main.findByRole('link', { name: 'Notas' })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/data/treated/sankhya_notas`)
  expect(link.nextElementSibling?.textContent).toBe('sankhya_notas')
})
