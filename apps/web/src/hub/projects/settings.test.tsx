import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

function open(mayDelete: boolean, role: string) {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete, role }),
    versionsRead({ versions: [] }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [`${PROJECT}/settings`] }))
  render(<Conexus conexus={conexus} />)
}

for (const role of ['owner', 'admin'] as const) {
  test(`${role}: as Configurações mostram as Versões e "Enviar versão"`, async () => {
    open(true, role)
    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Versões' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enviar versão' })).toBeTruthy()
  })
}

test('o membro, pelo endereço: a página de "não encontrado"', async () => {
  open(false, 'member')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
})

test('de Configurações a "Voltar ao Projeto"', async () => {
  open(true, 'owner')
  fireEvent.click(await screen.findByRole('link', { name: 'Voltar ao Projeto' }))
  expect(await screen.findByRole('link', { name: 'Configurações' })).toBeTruthy()
})
