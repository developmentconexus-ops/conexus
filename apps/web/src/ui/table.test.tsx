import { render, screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { FramedTable } from './table.tsx'

const COLUMNS = [
  { name: 'Pessoa' },
  { name: 'Papel', leavesOnPhone: true, width: 'lg:w-36' },
  { name: 'Ações', width: 'lg:w-80' },
]

function framed() {
  render(
    <FramedTable columns={COLUMNS} aria-label="Pessoas">
      <tbody />
    </FramedTable>,
  )
  return within(screen.getByRole('table', { name: 'Pessoas' }))
}

test('FramedTable names every column in its header and gives each one its width', () => {
  const table = framed()
  expect(table.getAllByRole('columnheader').map((head) => head.textContent)).toEqual([
    'Pessoa',
    'Papel',
    'Ações',
  ])
  const cols = [...document.querySelectorAll('col')].map((col) => col.className)
  expect(cols).toEqual(['', 'lg:w-36', 'lg:w-80'])
  expect(screen.getByRole('table', { name: 'Pessoas' }).className).toContain('lg:table-fixed')
})

test('FramedTable drops the columns that leave on a phone from header and widths', () => {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    const table = framed()
    expect(table.getAllByRole('columnheader').map((head) => head.textContent)).toEqual([
      'Pessoa',
      'Ações',
    ])
    expect(document.querySelectorAll('col').length).toBe(2)
  } finally {
    phone.mockRestore()
  }
})
