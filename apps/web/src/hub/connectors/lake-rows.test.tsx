import { within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copiedLake } from './lake-fixtures.ts'
import { openTables } from './test-lake.tsx'

const server = hubServer()

function rowOf(section: HTMLElement, label: string): HTMLElement {
  const row = within(section).getByText(label).closest('li')
  if (row === null) throw new Error(`no row for ${label}`)
  return row
}

test('a seção abre com a frase inteira do protótipo', async () => {
  const { section } = await openTables(server, { lake: copiedLake(['TGFCAB', 'TGFITE']) })
  expect(
    within(section).getByText(
      'As linhas ficam no lago da empresa. Marque outra tabela e salve: ela começa inteira, numa rodada só dela. O nome das que já existem não muda mais.',
    ),
  ).toBeTruthy()
})

test('a seção: com data, a tabela que ela limita diz desde a data e a que não limita diz todo o histórico; sem data a linha não diz nenhuma', async () => {
  const dated = await openTables(server, {
    lake: copiedLake(['TGFCAB', 'TGFPAR'], { startDate: '2021-11-24' }),
  })
  const limited = within(rowOf(dated.section, 'Notas e pedidos'))
  const whole = within(rowOf(dated.section, 'Parceiros'))
  expect(limited.getByText('Desde 24/11/2021')).toBeTruthy()
  expect(limited.queryByText('todo o histórico')).toBeNull()
  expect(whole.getByText('todo o histórico')).toBeTruthy()
  expect(whole.queryByText(/^Desde /)).toBeNull()
})

test('a seção: sem data a linha das tabelas não diz desde nem todo o histórico', async () => {
  const { section } = await openTables(server, {
    lake: copiedLake(['TGFCAB', 'TGFITE'], { startDate: null }),
  })
  expect(within(section).queryByText(/^Desde /)).toBeNull()
  expect(within(section).queryByText('todo o histórico')).toBeNull()
})
