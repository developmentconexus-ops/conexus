import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { CLIENTES, copy, LIST, onPhone, openCopies } from './test-hub.tsx'

// The search of the tree: kept in the address, shared with the Bruto layer and the links (Requisito 2).
const server = hubServer()

const SHOWN = copy().shown
const COLUMN = { type: 'text', description: null, inactiveSince: null } as const

async function tree() {
  return within(await screen.findByRole('navigation', { name: 'Dados' }))
}

function searchable() {
  return [
    copy({
      name: 'sankhya_vendas',
      shown: { ...SHOWN, columns: [{ name: 'NUNOTA', ...COLUMN }] },
    }),
    copy({
      id: CLIENTES,
      name: 'sankhya_clientes',
      label: 'Clientes',
      shown: { ...SHOWN, description: 'Devoluções', columns: [{ name: 'CODPARC', ...COLUMN }] },
    }),
  ]
}

test('o q do endereço filtra a árvore', async () => {
  openCopies(server, { copies: searchable() }, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  expect(await nav.findByText('sankhya_vendas')).toBeTruthy()
  expect(nav.queryByText('sankhya_clientes')).toBeNull()
})

test('o q fica ao abrir uma tabela', async () => {
  openCopies(server, { copies: searchable() }, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  fireEvent.click(await nav.findByRole('link', { name: /^sankhya_vendas/ }))
  expect(await screen.findByRole('heading', { name: 'sankhya_vendas' })).toBeTruthy()
  expect(nav.queryByText('sankhya_clientes')).toBeNull()
})

test('a busca da árvore filtra e fica no endereço', async () => {
  openCopies(server, { copies: searchable() }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })).toBeTruthy()
  expect(screen.getAllByRole('searchbox')).toHaveLength(1)
  fireEvent.change(nav.getByRole('searchbox', { name: 'Buscar tabela ou coluna' }), {
    target: { value: 'NUNOTA' },
  })
  await waitFor(() => expect(nav.queryByText('sankhya_clientes')).toBeNull())
  expect(nav.getByText('sankhya_vendas')).toBeTruthy()
  const main = within(await screen.findByRole('main'))
  expect(main.queryByText('sankhya_clientes')).toBeNull()
  expect(main.getByText('sankhya_vendas')).toBeTruthy()
  expect(nav.getByRole('link', { name: /^sankhya_vendas/ }).getAttribute('href')).toContain(
    'q=NUNOTA',
  )
})

test('o campo mostra o q do endereço', async () => {
  openCopies(server, { copies: searchable() }, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  const box = await nav.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  expect(box).toHaveProperty('value', 'NUNOTA')
})

test('a busca sem resposta', async () => {
  openCopies(server, { copies: searchable() }, LIST)
  const nav = await tree()
  fireEvent.change(await nav.findByRole('searchbox', { name: 'Buscar tabela ou coluna' }), {
    target: { value: 'zzz' },
  })
  expect(await nav.findByText('Nenhuma tabela com esse texto.')).toBeTruthy()
})

test('no celular, digitar não fecha a gaveta', async () => {
  await onPhone(async () => {
    openCopies(server, { copies: searchable() }, LIST)
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir navegação' }))
    const drawer = within(await screen.findByRole('dialog'))
    fireEvent.change(await drawer.findByRole('searchbox', { name: 'Buscar tabela ou coluna' }), {
      target: { value: 'NUNOTA' },
    })
    await waitFor(() => expect(drawer.queryByText('sankhya_clientes')).toBeNull())
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(drawer.getByRole('navigation', { name: 'Dados' })).toBeTruthy()
  })
})

test('o campo segue o endereço: tirar o q por fora esvazia o campo', async () => {
  openCopies(server, { copies: searchable() }, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  const box = await nav.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  expect(box).toHaveProperty('value', 'NUNOTA')
  fireEvent.click(screen.getByRole('link', { name: 'Dados' }))
  await waitFor(() => expect(box).toHaveProperty('value', ''))
  expect(await nav.findByText('sankhya_clientes')).toBeTruthy()
})

test('os grupos de camada levam o q do endereço', async () => {
  openCopies(server, { copies: searchable() }, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  const apps = await nav.findByRole('link', { name: 'Apps' })
  expect(apps.getAttribute('href')).toContain('q=NUNOTA')
  expect(nav.getByRole('link', { name: 'Negócio 0' }).getAttribute('href')).toContain('q=NUNOTA')
  expect(nav.getByRole('link', { name: /^Bruto/ }).getAttribute('href')).toContain('q=NUNOTA')
  fireEvent.click(apps)
  fireEvent.click(await nav.findByRole('link', { name: /^Bruto/ }))
  expect(await nav.findByText('sankhya_vendas')).toBeTruthy()
  expect(nav.queryByText('sankhya_clientes')).toBeNull()
})
