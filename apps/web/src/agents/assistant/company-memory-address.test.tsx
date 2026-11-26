import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { companyRead, hubServer, projectsRead, sessionRead } from '../../platform/test-hub.tsx'

// Conhecimento took the place of Configurações › Memória da empresa (card R2, U1, criterion 22).
const server = hubServer()

test('o endereço antigo não existe: Configurações › Memória da empresa dá a tela de não encontrado', async () => {
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role: 'owner' }),
    ...projectsRead({ projects: [], databaseReady: true, mayDelete: false, role: 'owner' }),
  )
  const history = createMemoryHistory({
    initialEntries: [`/companies/${COMPANY.id}/settings/company-memory`],
  })
  render(<Conexus conexus={createConexus(history)} />)
  // The entry's waiting screen has a `main` of its own, replaced once the frame mounts: the
  // heading is looked for on the page, and only then inside the frame's content.
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  const main = within(screen.getByRole('main'))
  expect(main.queryByRole('region', { name: 'Instruções da empresa' })).toBeNull()
  expect(main.queryByRole('heading', { name: 'Conhecimento' })).toBeNull()
})
