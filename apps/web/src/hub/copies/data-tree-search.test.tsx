import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { LIST, onPhone, openData } from './test-hub.tsx'

// The search of the tree: kept in the address and carried by the layer links (Requisito 2).
const server = hubServer()

async function tree() {
  return within(await screen.findByRole('navigation', { name: 'Dados' }))
}

test('a busca da árvore fica no endereço', async () => {
  openData(server, {}, LIST)
  const nav = await tree()
  const box = await nav.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  expect(screen.getAllByRole('searchbox')).toHaveLength(1)
  fireEvent.change(box, { target: { value: 'NUNOTA' } })
  await waitFor(() =>
    expect(nav.getByRole('link', { name: /^Bruto/ }).getAttribute('href')).toContain('q=NUNOTA'),
  )
})

test('o campo mostra o q do endereço', async () => {
  openData(server, {}, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  const box = await nav.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  expect(box).toHaveProperty('value', 'NUNOTA')
})

test('no celular, digitar não fecha a gaveta', async () => {
  await onPhone(async () => {
    openData(server, {}, LIST)
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir navegação' }))
    const drawer = within(await screen.findByRole('dialog'))
    fireEvent.change(await drawer.findByRole('searchbox', { name: 'Buscar tabela ou coluna' }), {
      target: { value: 'NUNOTA' },
    })
    await waitFor(() =>
      expect(drawer.getByRole('searchbox', { name: 'Buscar tabela ou coluna' })).toHaveProperty(
        'value',
        'NUNOTA',
      ),
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(drawer.getByRole('navigation', { name: 'Dados' })).toBeTruthy()
  })
})

test('o campo segue o endereço: tirar o q por fora esvazia o campo', async () => {
  openData(server, {}, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  const box = await nav.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  expect(box).toHaveProperty('value', 'NUNOTA')
  fireEvent.click(screen.getByRole('link', { name: 'Dados' }))
  await waitFor(() => expect(box).toHaveProperty('value', ''))
})

test('os grupos de camada levam o q do endereço', async () => {
  openData(server, {}, `${LIST}?q=NUNOTA`)
  const nav = await tree()
  const apps = await nav.findByRole('link', { name: 'Apps' })
  expect(apps.getAttribute('href')).toContain('q=NUNOTA')
  expect(nav.getByRole('link', { name: 'Negócio 0' }).getAttribute('href')).toContain('q=NUNOTA')
  expect(nav.getByRole('link', { name: /^Bruto/ }).getAttribute('href')).toContain('q=NUNOTA')
})
