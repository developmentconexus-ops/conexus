import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copiedLake, readyLake } from './lake-fixtures.ts'
import { openTables } from './test-lake.tsx'

const server = hubServer()

const LEAD =
  'Escolha as tabelas do Sankhya, quando copiar e desde que data. As linhas ficam no lago da empresa.'
const STAY = 'As linhas ficam no lago da empresa.'
const ONLY = 'Só quem gerencia as cópias muda o que se copia.'
const ROLES = [
  { role: 'owner', mayManage: true, may: true },
  { role: 'admin', mayManage: true, may: true },
  { role: 'member', mayManage: false, may: false },
] as const

test.each(ROLES)(
  'sem cópia: $role vê Escolher o que copiar, ligado só se gerencia cópias, e a frase de quem muda e a do que escolher',
  async ({ role, mayManage, may }) => {
    const { section, sent } = await openTables(server, { role, mayManage, lake: readyLake() })
    const choose = within(section).getByRole('button', { name: 'Escolher o que copiar' })
    expect(choose.hasAttribute('disabled')).toBe(!may)
    expect(within(section).queryByText(ONLY) !== null).toBe(!may)
    expect(within(section).queryByText(LEAD) !== null).toBe(may)
    expect(within(section).queryByText(STAY) !== null).toBe(!may)
    fireEvent.click(choose)
    expect(screen.queryByRole('dialog') !== null).toBe(may)
    expect(sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
  },
)

test.each(ROLES)(
  'com cópia: $role vê Ler de novo desde a data, ligado só se gerencia cópias',
  async ({ role, mayManage, may }) => {
    const { section } = await openTables(server, {
      role,
      mayManage,
      lake: copiedLake(['TGFCAB', 'TGFITE'], { startDate: '2021-11-24' }),
    })
    const again = within(section).getByRole('button', { name: 'Ler de novo desde a data' })
    expect(again.hasAttribute('disabled')).toBe(!may)
    fireEvent.click(again)
    expect(screen.queryByRole('alertdialog') !== null).toBe(may)
  },
)
