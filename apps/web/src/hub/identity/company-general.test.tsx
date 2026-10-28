import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { companyRead, hubServer, PEDIDOS_ADDRESS, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()

function open() {
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role: 'owner' }),
  )
  render(
    <Conexus
      conexus={createConexus(
        createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/settings/general`] }),
      )}
    />,
  )
}

test('Geral: o nome vem da Central e o apelido entra no endereço de exemplo', async () => {
  open()
  const name = await screen.findByRole('region', { name: 'Nome' })
  expect(name.textContent).toContain('Definido pela Central.')
  expect(name.textContent).toContain(COMPANY.name)
  const nickname = screen.getByRole('region', { name: 'Apelido' })
  expect(nickname.textContent).toContain('Entra no endereço de cada app da empresa e não muda.')
  expect(within(nickname).getByText(COMPANY.nickname)).toBeTruthy()
  expect(within(nickname).getByText(PEDIDOS_ADDRESS)).toBeTruthy()
})
