import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { conversationsNone, hubServer, PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

async function groups(role: string): Promise<[string, string[]][]> {
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true, role }))
  const conexus = createConexus(createMemoryHistory({ initialEntries: [PROJECT] }))
  render(<Conexus conexus={conexus} />)
  const nav = await screen.findByRole('navigation', { name: 'Navegação' })
  await within(nav).findByRole('combobox', { name: 'Trocar de Projeto. Agora: Pedidos' })
  const list = nav.querySelector<HTMLElement>('[data-sidebar="sidebar"]')
  if (list === null) throw new Error('the sidebar has no list')
  return [...list.querySelectorAll<HTMLElement>('[data-slot="sidebar-group"]')].map((group) => [
    group.querySelector('[data-slot="sidebar-group-label"]')?.textContent ?? '',
    within(group)
      .getAllByRole('link')
      .map((link) => link.textContent ?? ''),
  ])
}

test('o dono vê quatro grupos com título, os oito itens na ordem do mapa', async () => {
  expect(await groups('owner')).toEqual([
    ['O app', ['Construir']],
    ['Agentes', ['Conversas', 'Agentes', 'Automações']],
    ['Dados', ['Integrações', 'Dados']],
    ['O Projeto', ['Quem usa o app', 'Sobre']],
  ])
})

test('o membro vê "Agentes" só com Conversas e "Dados" só com Integrações, e nenhum título sem item', async () => {
  expect(await groups('member')).toEqual([
    ['O app', ['Construir']],
    ['Agentes', ['Conversas']],
    ['Dados', ['Integrações']],
    ['O Projeto', ['Quem usa o app', 'Sobre']],
  ])
})
