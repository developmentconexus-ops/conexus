import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'
import { ANA, COMPANY } from './fixtures.ts'
import { companyRead, hubServer, sessionRead } from './test-hub.tsx'
import { applyChosenTheme } from './theme.ts'

const server = hubServer()
const SETTINGS = `/companies/${COMPANY.id}/settings/account`

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

function open() {
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role: 'owner' }),
  )
  return render(
    <Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [SETTINGS] }))} />,
  )
}

async function openMenu() {
  fireEvent.click(await screen.findByRole('button', { name: 'Conta de Ana Lima' }))
}

test('a escolha vale na hora e fica ao recarregar: um roteador novo sobre o mesmo armazenamento', async () => {
  const view = open()
  await openMenu()
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Escuro' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  await waitFor(() =>
    expect(screen.getByRole('menuitemradio', { name: 'Escuro' }).getAttribute('aria-checked')).toBe(
      'true',
    ),
  )

  view.unmount()
  delete document.documentElement.dataset.theme
  applyChosenTheme()
  expect(document.documentElement.dataset.theme).toBe('dark')
  open()
  await openMenu()
  expect(
    (await screen.findByRole('menuitemradio', { name: 'Escuro' })).getAttribute('aria-checked'),
  ).toBe('true')
})

test('voltar a Como o sistema esquece a escolha', async () => {
  localStorage.setItem('conexus-theme', 'light')
  applyChosenTheme()
  open()
  await openMenu()
  expect(
    (await screen.findByRole('menuitemradio', { name: 'Claro' })).getAttribute('aria-checked'),
  ).toBe('true')
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Como o sistema' }))
  expect(document.documentElement.dataset.theme).toBeUndefined()
  expect(localStorage.getItem('conexus-theme')).toBeNull()
})
