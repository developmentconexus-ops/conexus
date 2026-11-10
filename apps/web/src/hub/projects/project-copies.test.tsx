import { listProjectCopies } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const API = `*/api/companies/${COMPANY.id}`
const VENDAS = '00000000-0000-4000-8000-0000000000a1'
const CLIENTES = '00000000-0000-4000-8000-0000000000a2'

type Release = { id: string; label: string; name: string; granted: boolean }
const sent: { method: string; copy: string }[] = []
let reads = 0

function body(releases: Release[]) {
  return listProjectCopies.success.body.parse({
    copies: releases.map(({ granted, ...copy }) => ({
      copy: { ...copy, connector: 'sankhya' },
      granted,
    })),
  })
}

function open(releases: Release[], role = 'owner', down: 'grant' | undefined = undefined) {
  sent.length = 0
  reads = 0
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }),
    http.get(`${API}/connections`, () =>
      HttpResponse.json({ connectors: [], connections: [], mayManage: role !== 'member' }),
    ),
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () =>
      HttpResponse.json({ connectors: [] }),
    ),
    http.get(`${API}/projects/${PEDIDOS.id}/copies`, () => {
      reads += 1
      return HttpResponse.json(body(releases))
    }),
    http.put(`${API}/projects/${PEDIDOS.id}/copies/:copyId`, ({ params, request }) => {
      sent.push({ method: request.method, copy: String(params.copyId) })
      if (down === 'grant') return refusal('COPY_DATABASE_UNAVAILABLE')
      const found = releases.find((one) => one.id === params.copyId)
      if (found) found.granted = true
      return HttpResponse.json({ granted: true })
    }),
    http.delete(`${API}/projects/${PEDIDOS.id}/copies/:copyId`, ({ params, request }) => {
      sent.push({ method: request.method, copy: String(params.copyId) })
      const found = releases.find((one) => one.id === params.copyId)
      if (found) found.granted = false
      return HttpResponse.json({ granted: false })
    }),
  )
  render(
    <Conexus
      conexus={createConexus(createMemoryHistory({ initialEntries: [`${PROJECT}/integrations`] }))}
    />,
  )
}

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

async function row(label: string) {
  const heading = await screen.findByText(label)
  const item = heading.closest('li')
  if (item === null) throw new Error(`sem linha para ${label}`)
  return within(item)
}

function copies(): Release[] {
  return [
    { id: VENDAS, label: 'Vendas', name: 'vendas', granted: false },
    { id: CLIENTES, label: 'Clientes', name: 'clientes', granted: true },
  ]
}

test.each(['owner', 'developer'])('liberar e tirar, como %s', async (role) => {
  open(copies(), role)
  const section = within(await screen.findByRole('region', { name: 'Cópias' }))
  expect((await row('Clientes')).getByText('Liberada')).toBeTruthy()
  expect(section.queryByText('Dono, administrador ou desenvolvedor libera uma cópia.')).toBeNull()
  fireEvent.click((await row('Vendas')).getByRole('button', { name: 'Liberar: Vendas' }))
  expect(await (await row('Vendas')).findByRole('button', { name: 'Tirar: Vendas' })).toBeTruthy()
  expect(sent).toEqual([{ method: 'PUT', copy: VENDAS }])
  expect((await row('Vendas')).getByText('Liberada')).toBeTruthy()
  fireEvent.click((await row('Clientes')).getByRole('button', { name: 'Tirar: Clientes' }))
  expect(
    await (await row('Clientes')).findByRole('button', { name: 'Liberar: Clientes' }),
  ).toBeTruthy()
  expect(sent.at(-1)).toEqual({ method: 'DELETE', copy: CLIENTES })
  expect((await row('Clientes')).queryByText('Liberada')).toBeNull()
})

test('liberar, o banco da empresa não respondeu: a frase e o botão de novo', async () => {
  open(copies(), 'owner', 'grant')
  fireEvent.click((await row('Vendas')).getByRole('button', { name: 'Liberar: Vendas' }))
  expect(await screen.findByText(sentenceOfCode('COPY_DATABASE_UNAVAILABLE'))).toBeTruthy()
  expect((await row('Vendas')).queryByText('Liberada')).toBeNull()
  await waitFor(async () => {
    const button = (await row('Vendas')).getByRole('button', { name: 'Liberar: Vendas' })
    expect(button.hasAttribute('disabled')).toBe(false)
  })
})

test('nenhuma cópia na empresa: a frase e o caminho para Cópias', async () => {
  open([], 'owner')
  expect(await screen.findByText('A empresa ainda não tem cópias.')).toBeTruthy()
  const link = screen.getByRole('link', { name: 'Ligar uma cópia' })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/copies`)
})

test('quem não gerencia cópias lê quem pode e não pede a lista', async () => {
  open(copies(), 'member')
  const section = within(await screen.findByRole('region', { name: 'Cópias' }))
  expect(section.getByText('Dono, administrador ou desenvolvedor libera uma cópia.')).toBeTruthy()
  expect(section.queryByRole('button')).toBeNull()
  expect(section.queryByRole('link', { name: 'Ligar uma cópia' })).toBeNull()
  expect(reads).toBe(0)
})
