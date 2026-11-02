import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'
import { ANA, COMPANY } from './fixtures.ts'
import { companyRead, hubServer, sessionRead } from './test-hub.tsx'
import { applyChosenTheme, THEME_LABELS } from './theme.ts'

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

test('cada escolha que a página grava em <html> tem o seu color-scheme em tokens.css; "Como o sistema" não grava nenhuma e segue os dois', () => {
  const css = readFileSync(join(import.meta.dirname, '../brand/tokens.css'), 'utf8')
  const picks = Object.keys(THEME_LABELS).filter((each) => each !== 'system')
  expect(picks).toEqual(['light', 'dark'])
  for (const pick of picks) {
    expect(css).toMatch(
      new RegExp(`:root\\[data-theme="${pick}"\\]\\s*{\\s*color-scheme:\\s*${pick};\\s*}`),
    )
  }
  expect(css).toMatch(/:root\s*{\s*color-scheme:\s*light dark;\s*}/)
})
