import { screen, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copy, copyRun, detailOf, openCopies, VENDAS } from './test-hub.tsx'

const server = hubServer()
const RUNS = `${detailOf(VENDAS)}?tab=runs`
const REFUSED = { kind: 'ERROR', code: 'COPY_SOURCE_REFUSED' } as const

function refusedRun(
  system: { status: number; code: string | null; message: string | null } | null,
) {
  return copyRun({ outcome: { ...REFUSED, system } })
}

function onPhone() {
  return vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: media.includes('767'),
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
}

test('as rodadas: o que o sistema disse aparece embaixo da frase', async () => {
  const system = { status: 401, code: null, message: 'Sessão expirada' }
  openCopies(server, { copies: [copy()], runs: [refusedRun(system)] }, RUNS)
  const said = await screen.findByText('401 · Sessão expirada')
  expect(said.className).toContain('text-text-2')
  expect(within(screen.getByRole('table')).getByText('O sistema recusou a leitura.')).toBeTruthy()
})

test('as rodadas: o que o sistema disse aparece na linha do celular', async () => {
  const phone = onPhone()
  try {
    const system = { status: 401, code: null, message: 'Sessão expirada' }
    openCopies(server, { copies: [copy()], runs: [refusedRun(system)] }, RUNS)
    const said = await screen.findByText('401 · Sessão expirada')
    expect(said.className).toContain('text-text-2')
    expect(screen.queryByRole('table')).toBeNull()
  } finally {
    phone.mockRestore()
  }
})

test('as rodadas: a mensagem do sistema vem antes do código', async () => {
  const runs = [
    refusedRun({ status: 403, code: 'NO_ACCESS', message: 'Sem permissão' }),
    refusedRun({ status: 200, code: '0', message: null }),
  ]
  openCopies(server, { copies: [copy()], runs }, RUNS)
  expect(await screen.findByText('403 · Sem permissão')).toBeTruthy()
  expect(screen.getByText('200 · 0')).toBeTruthy()
  expect(screen.queryByText(/NO_ACCESS/)).toBeNull()
})

test('as rodadas: sem resposta do sistema, só a frase da falha', async () => {
  openCopies(server, { copies: [copy()], runs: [refusedRun(null)] }, RUNS)
  const cell = (await screen.findByText('O sistema recusou a leitura.')).closest('td')
  expect(cell?.textContent).toBe('O sistema recusou a leitura.')
  expect(cell?.querySelector('span')).toBeNull()
})
