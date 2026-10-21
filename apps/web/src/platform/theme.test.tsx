import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'
import { ANA, COMPANY } from './fixtures.ts'
import { companyRead, hubServer, sessionRead } from './test-hub.tsx'
import { applyChosenTheme } from './theme.ts'

const server = hubServer()
const APPEARANCE = `/companies/${COMPANY.id}/settings/appearance`

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
    <Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [APPEARANCE] }))} />,
  )
}

test('Aparência oferece Claro, Escuro e Como o sistema, e começa em Como o sistema', async () => {
  open()
  expect(await screen.findByRole('heading', { name: 'Aparência' })).toBeTruthy()
  const options = screen.getAllByRole('radio')
  expect(options.map((radio) => radio.parentElement?.textContent)).toEqual([
    'Claro',
    'Escuro',
    'Como o sistema',
  ])
  expect(screen.getByRole('radio', { name: 'Como o sistema' }).getAttribute('aria-checked')).toBe(
    'true',
  )
})

test('a escolha vale na hora e fica ao recarregar: um roteador novo sobre o mesmo armazenamento', async () => {
  const view = open()
  fireEvent.click(await screen.findByRole('radio', { name: 'Escuro' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  await waitFor(() =>
    expect(screen.getByRole('radio', { name: 'Escuro' }).getAttribute('aria-checked')).toBe('true'),
  )

  view.unmount()
  delete document.documentElement.dataset.theme
  applyChosenTheme()
  expect(document.documentElement.dataset.theme).toBe('dark')
  open()
  await screen.findByRole('heading', { name: 'Aparência' })
  expect(screen.getByRole('radio', { name: 'Escuro' }).getAttribute('aria-checked')).toBe('true')
})

test('voltar a Como o sistema esquece a escolha', async () => {
  localStorage.setItem('conexus-theme', 'light')
  applyChosenTheme()
  open()
  expect((await screen.findByRole('radio', { name: 'Claro' })).getAttribute('aria-checked')).toBe(
    'true',
  )
  fireEvent.click(screen.getByRole('radio', { name: 'Como o sistema' }))
  expect(document.documentElement.dataset.theme).toBeUndefined()
  expect(localStorage.getItem('conexus-theme')).toBeNull()
})
