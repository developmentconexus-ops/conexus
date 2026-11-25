import type { LakeTablesOfConnection } from '@conexus/hub-api'
import { fireEvent, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copiedLake } from './lake-fixtures.ts'
import { openTables } from './test-lake.tsx'

const server = hubServer()

const COPIED = ['TGFCAB', 'TGFITE']
function lake(fields: Partial<LakeTablesOfConnection> = {}) {
  return copiedLake(COPIED, { startDate: '2021-11-24', ...fields })
}

test('a data inicial: mostra a data da cópia e, salva uma mais nova, diz que vale da próxima rodada', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  const since = within(section).getByLabelText<HTMLInputElement>('Desde')
  expect(since.value).toBe('2021-11-24')
  fireEvent.change(since, { target: { value: '2022-01-01' } })
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(
    await within(section).findByText(
      'A data nova vale a partir da próxima rodada. As linhas de antes dela continuam no lago até você ler de novo desde a data.',
    ),
  ).toBeTruthy()
  expect(sent.find((one) => one.method === 'PUT')?.body).toMatchObject({ startDate: '2022-01-01' })
  expect(within(section).getAllByText('Desde 01/01/2022')).toHaveLength(2)
})

test('a data inicial: uma mais antiga, ou vazia, diz que as próximas rodadas seguem de onde pararam e como trazer as linhas', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  const since = within(section).getByLabelText('Desde')
  fireEvent.change(since, { target: { value: '2020-01-01' } })
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(
    await within(section).findByText(
      'As próximas rodadas continuam de onde pararam. Para trazer as linhas desde 01/01/2020, clique Ler de novo desde a data.',
    ),
  ).toBeTruthy()
  fireEvent.change(since, { target: { value: '' } })
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(
    await within(section).findByText(
      'As próximas rodadas continuam de onde pararam. Para trazer as linhas desde o começo, clique Ler de novo desde a data.',
    ),
  ).toBeTruthy()
  expect(sent.filter((one) => one.method === 'PUT').map((one) => one.body)).toMatchObject([
    { startDate: '2020-01-01' },
    { startDate: null },
  ])
})

test('a data inicial: depois de hoje recusa e desliga Salvar; sem data o campo diz Todo o histórico', async () => {
  const { section, sent } = await openTables(server, { lake: copiedLake(COPIED) })
  const since = within(section).getByLabelText<HTMLInputElement>('Desde')
  expect(since.value).toBe('')
  fireEvent.change(since, { target: { value: '2999-01-01' } })
  expect(await within(section).findByText('A data não pode ser depois de hoje.')).toBeTruthy()
  expect(within(section).getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(
    true,
  )
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(0)
})

test('a data inicial: quem não gerencia cópias vê a data sem o campo e o botão de ler de novo desligado', async () => {
  const { section } = await openTables(server, { role: 'member', mayManage: false, lake: lake() })
  expect(within(section).getAllByText(/Desde 24\/11\/2021/).length).toBeGreaterThan(0)
  expect(within(section).queryByLabelText('Desde')).toBeNull()
  expect(
    within(section)
      .getByRole('button', { name: 'Ler de novo desde a data' })
      .hasAttribute('disabled'),
  ).toBe(true)
})
