import { FAILURES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { delay } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  bound,
  built,
  failed,
  LIST,
  listOf,
  MODEL_ID,
  modelOf,
  notas,
  openTreatment,
  venda,
  version,
} from './test-hub.tsx'

// Tratado and the pages of a treated table and of a treatment: the last run, De onde vem, Quem lê, Versões.
const server = hubServer()
const NOTAS = `${LIST}/treated/sankhya_notas`
const VENDA = `${LIST}/business/${MODEL_ID}`

async function main() {
  await screen.findByRole('navigation', { name: 'Dados' })
  return within(screen.getByRole('main'))
}

test('a tabela tratada mostra as linhas e a hora da última rodada boa', async () => {
  openTreatment(server, { view: { list: listOf({ tables: [notas({ lastRun: built() })] }) } })
  const page = await main()
  expect(await page.findByText('128.402 linhas · tratada às 14:05')).toBeTruthy()
  expect(page.queryByText('Esperando a próxima cópia')).toBeNull()
  expect(page.getByText('Notas fiscais do Sankhya')).toBeTruthy()
  expect(page.getByRole('heading', { name: 'Sankhya · Matriz' })).toBeTruthy()
})

test('antes da primeira rodada a tabela diz Esperando a próxima cópia', async () => {
  openTreatment(server, { view: { list: listOf({ tables: [notas()] }) } })
  expect(await (await main()).findByText('Esperando a próxima cópia')).toBeTruthy()
})

test('a rodada que falhou diz o motivo pelo código e a linha do SQL, e a tabela fica sem linhas', async () => {
  openTreatment(server, {
    view: { list: listOf({ tables: [notas({ lastRun: failed('COLUMN_NOT_FOUND', 3) })] }) },
  })
  const page = await main()
  expect(
    await page.findByText('A última rodada falhou: coluna que não existe, na linha 3'),
  ).toBeTruthy()
  expect(page.queryByText(/linhas · tratada/)).toBeNull()
})

test('um código que a tela não conhece diz que o Athena recusou o SQL, com o código e a linha', async () => {
  openTreatment(server, {
    view: { list: listOf({ tables: [notas({ lastRun: failed('TABLE_NOT_FOUND', 7) })] }) },
  })
  expect(
    await (await main()).findByText(
      'A última rodada falhou: o Athena recusou o SQL (TABLE_NOT_FOUND), na linha 7',
    ),
  ).toBeTruthy()
})

test('sem linha no resultado, o motivo não leva a linha', async () => {
  openTreatment(server, {
    view: { list: listOf({ tables: [notas({ lastRun: failed('TREAT_ENGINE_FAILED', null) })] }) },
  })
  expect(
    await (await main()).findByText('A última rodada falhou: o motor de tratamento falhou'),
  ).toBeTruthy()
})

test('uma rodada que não terminou mostra o motivo dela no topo de Tratado', async () => {
  openTreatment(server, {
    view: {
      list: listOf({
        lastRun: { state: 'FAILED', failure: 'TREAT_START_FAILED', at: '2026-11-26T17:05:00.000Z' },
        tables: [notas({ lastRun: built() })],
      }),
    },
  })
  const alert = await (await main()).findByRole('alert')
  expect(alert.textContent).toBe('A última rodada não terminou: a rodada não conseguiu começar')
})

test('a aba De onde vem lista a tabela copiada, com o link para ela', async () => {
  openTreatment(server, {
    path: NOTAS,
    view: { list: listOf({ tables: [notas({ lastRun: built() })] }) },
  })
  const page = await main()
  fireEvent.click(await page.findByRole('tab', { name: 'De onde vem' }))
  const link = await page.findByRole('link', { name: 'Copiado › sankhya_notas' })
  expect(link.getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/data/lake/11111111-1111-4111-8111-111111111111`,
  )
})

test('a aba Quem lê lista os modelos que leem a tabela, com o link para cada um', async () => {
  openTreatment(server, {
    path: NOTAS,
    view: {
      list: listOf({
        tables: [notas({ readBy: [{ layer: 'negocio', table: 'venda' }] }), venda()],
      }),
    },
  })
  const page = await main()
  fireEvent.click(await page.findByRole('tab', { name: 'Quem lê' }))
  const link = await page.findByRole('link', { name: 'Negócio › venda' })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/data/business/${MODEL_ID}`)
})

test('a página da tabela tem o rótulo por título e o nome no lago embaixo', async () => {
  openTreatment(server, { path: NOTAS, view: { list: listOf({ tables: [notas()] }) } })
  const page = await main()
  const title = await page.findByRole('heading', { level: 1, name: 'Notas' })
  expect(title.nextElementSibling?.textContent).toBe('sankhya_notas')
})

test('a aba De onde vem de um tratamento mostra Tratado › com o rótulo da tabela, e Copiado › com o nome', async () => {
  openTreatment(server, {
    path: VENDA,
    view: {
      list: listOf({ tables: [notas(), venda({ active: bound() })] }),
      models: {
        [MODEL_ID]: modelOf({
          versions: [
            bound({
              inputs: [
                { layer: 'tratado', table: 'sankhya_notas' },
                { layer: 'current', table: 'sankhya_notas' },
                { layer: 'negocio', table: 'venda' },
              ],
            }),
          ],
        }),
      },
    },
  })
  const page = await main()
  fireEvent.click(await page.findByRole('tab', { name: 'De onde vem' }))
  const treated = await page.findByRole('link', { name: 'Tratado › Notas' })
  expect(treated.getAttribute('href')).toBe(`/companies/${COMPANY.id}/data/treated/sankhya_notas`)
  expect(await page.findByRole('link', { name: 'Copiado › sankhya_notas' })).toBeTruthy()
  expect(await page.findByRole('link', { name: 'Negócio › venda' })).toBeTruthy()
})

test('a aba Colunas traz o nome, o tipo e a descrição da coluna copiada, e o tipo que falta fica vazio', async () => {
  openTreatment(server, {
    path: NOTAS,
    view: {
      list: listOf({
        tables: [
          notas({
            columns: [
              { name: 'nunota', type: 'bigint', description: 'Chave da nota' },
              { name: 'dtalter', type: null, description: null },
            ],
          }),
        ],
      }),
    },
  })
  const page = await main()
  fireEvent.click(await page.findByRole('tab', { name: 'Colunas' }))
  const table = await page.findByRole('table', { name: 'Colunas da tabela' })
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent),
  ).toEqual(['Coluna', 'Tipo', 'Descrição'])
  const types = within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1]?.textContent)
  expect(types).toEqual(['bigint', ''])
})

test('a aba Colunas traz o nome e a descrição da coluna copiada', async () => {
  openTreatment(server, { path: NOTAS, view: { list: listOf({ tables: [notas()] }) } })
  const page = await main()
  fireEvent.click(await page.findByRole('tab', { name: 'Colunas' }))
  const table = await page.findByRole('table', { name: 'Colunas da tabela' })
  expect(within(table).getAllByText('nunota').length).toBeGreaterThan(0)
  expect(within(table).getAllByText('Chave da nota').length).toBeGreaterThan(0)
})

test('a tabela cuja cópia saiu diz que não existe mais e dá o caminho para Dados', async () => {
  openTreatment(server, { path: NOTAS })
  const page = await main()
  expect(await page.findByText('Esta tabela não existe mais')).toBeTruthy()
  expect(page.getByRole('link', { name: 'Dados' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/data?layer=treated`,
  )
})

test('quem não lê tratamento vê a frase do papel na página da tabela', async () => {
  openTreatment(server, { role: 'member', path: NOTAS })
  expect(await (await main()).findByText(/^Seu papel ainda não lê nenhuma tabela/)).toBeTruthy()
})

test('quem não lê tratamento vê a frase do papel na página do modelo, também num endereço que não existe', async () => {
  openTreatment(server, { role: 'member', path: VENDA })
  expect(await (await main()).findByText(/^Seu papel ainda não lê nenhuma tabela/)).toBeTruthy()
  expect(screen.queryByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeNull()
})

test('na lista de Negócio, o modelo ligado cuja última rodada falhou diz o motivo', async () => {
  openTreatment(server, {
    path: `${LIST}?layer=business`,
    view: {
      list: listOf({ tables: [venda({ active: bound(), lastRun: failed('COLUMN_NOT_FOUND') })] }),
    },
  })
  const page = await main()
  expect(
    await page.findByText(/A última rodada falhou: coluna que não existe, na linha 3$/),
  ).toBeTruthy()
})

test('a aba Versões lista as versões, com quem propôs e quem ligou, e a ligada continua a de antes', async () => {
  openTreatment(server, {
    path: VENDA,
    view: {
      list: listOf({
        tables: [
          venda({ active: bound(), proposal: version({ number: 2, hash: 'c'.repeat(64) }) }),
        ],
      }),
      models: {
        [MODEL_ID]: modelOf({
          versions: [
            version({ number: 2, hash: 'c'.repeat(64), proposedBy: 'Bia Souza' }),
            bound({ approvedBy: 'Caio Dias' }),
          ],
        }),
      },
    },
  })
  const page = await main()
  expect(await page.findByText('Proposta, à espera do sim')).toBeTruthy()
  fireEvent.click(page.getByRole('tab', { name: 'Versões' }))
  const rows = (await page.findAllByRole('listitem')).map((row) => row.textContent)
  expect(rows).toEqual([
    'v2proposta por Bia Souza em 25/11 14:00',
    'v1Ligadaproposta por Ana Lima em 25/11 14:00, ligada por Caio Dias em 25/11 14:30',
  ])
})

test('com duas versões ligadas, a página mostra a mais nova como a ligada, a que o servidor diz', async () => {
  const newer = bound({
    number: 2,
    hash: 'c'.repeat(64),
    sql: 'select nunota, vlrnota\nfrom current.sankhya_notas',
  })
  const older = bound({ approvedBy: 'Caio Dias' })
  openTreatment(server, {
    path: VENDA,
    view: {
      list: listOf({ tables: [venda({ active: newer })] }),
      models: { [MODEL_ID]: modelOf({ versions: [newer, older], active: newer, proposal: null }) },
    },
  })
  const page = await main()
  expect(await page.findByText(/^Ligada: v2/)).toBeTruthy()
  expect(page.queryByText(/^Ligada: v1/)).toBeNull()
  fireEvent.click(page.getByRole('tab', { name: 'SQL' }))
  expect(await page.findByText('select nunota, vlrnota')).toBeTruthy()
})

test('a aba Versões marca só a versão ligada, e a proposta fica sem a marca', async () => {
  const newer = version({ number: 3, hash: 'd'.repeat(64) })
  const second = bound({ number: 2, hash: 'c'.repeat(64) })
  openTreatment(server, {
    path: VENDA,
    view: {
      list: listOf({ tables: [venda({ active: second, proposal: newer })] }),
      models: {
        [MODEL_ID]: modelOf({
          versions: [newer, second, bound()],
          active: second,
          proposal: newer,
        }),
      },
    },
  })
  const page = await main()
  fireEvent.click(await page.findByRole('tab', { name: 'Versões' }))
  const marked = (await page.findAllByRole('listitem')).filter((row) =>
    row.textContent?.includes('Ligada'),
  )
  expect(marked.map((row) => row.textContent?.slice(0, 2))).toEqual(['v2'])
})

test('enquanto a página do tratamento carrega, mostra o esqueleto das abas', async () => {
  openTreatment(server, {
    path: VENDA,
    answers: {
      model: async () => {
        await delay('infinite')
        return undefined
      },
    },
  })
  await screen.findByRole('navigation', { name: 'Dados' })
  await waitFor(() =>
    expect(document.querySelectorAll('main [data-slot="skeleton"]').length).toBeGreaterThan(2),
  )
  expect(screen.queryByRole('tab')).toBeNull()
})

test('o modelo cujo endereço não existe diz que não existe', async () => {
  openTreatment(server, { path: VENDA })
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
})
