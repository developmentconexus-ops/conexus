import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { conversationsNone, hubServer, PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

beforeEach(() => server.use(conversationsNone))
afterEach(() => vi.restoreAllMocks())

for (const lens of ['code']) {
  test(`celular de verdade, aba ${lens}: o alto continua com Abrir app, que só a Prévia tira`, async () => {
    vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
      Object.assign(new EventTarget(), {
        matches: true,
        media,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      }),
    )
    server.use(
      ...projectsRead({
        projects: [PEDIDOS],
        databaseReady: true,
        mayDelete: true,
        appVersion: 1,
        publishedVersion: 1,
      }),
    )
    render(
      <Conexus
        conexus={createConexus(
          createMemoryHistory({ initialEntries: [`${PROJECT}?lens=${lens}`] }),
        )}
      />,
    )
    expect(await screen.findByRole('link', { name: 'Abrir app' })).toBeTruthy()
  })
}

test('celular de verdade: a gaveta tem as mesmas entradas da barra do Projeto', async () => {
  vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }))
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PROJECT] }))} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir navegação' }))
  const drawer = await screen.findByRole('dialog')
  for (const name of ['Construir', 'Sobre', 'Quem usa o app']) {
    expect(within(drawer).getByRole('link', { name })).toBeTruthy()
  }
  expect(within(drawer).getByRole('button', { name: /Trocar de Projeto/ })).toBeTruthy()
})
