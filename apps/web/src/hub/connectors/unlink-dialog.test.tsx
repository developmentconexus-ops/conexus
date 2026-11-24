import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE } from './fixtures.ts'
import { openIntegrations, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()

const STORE = connectionOf({ connector: 'mercado-livre', name: 'Loja A' })

test('sem a lista de cópias', async () => {
  const sent = openIntegrations(
    server,
    viewOf({ connections: [STORE], connectors: [MERCADO_LIVRE] }),
    undefined,
    pageOf(STORE),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Desligar' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  expect(dialog.getByText('O Conexus apaga as chaves que guardou.')).toBeTruthy()
  expect(dialog.queryByRole('list', { name: 'O que some' })).toBeNull()
  expect(dialog.queryByText(/cópia/)).toBeNull()
  const button = dialog.getByRole('button', { name: 'Desligar' })
  expect(button.hasAttribute('disabled')).toBe(false)
  fireEvent.click(button)
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['DELETE'])
})
