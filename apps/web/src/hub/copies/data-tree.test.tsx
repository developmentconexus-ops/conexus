import { fireEvent, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connection, LIST, openData } from './test-hub.tsx'
import { CATALOG } from './test-sources.ts'

// The tree of Dados in the frame, in place of the conversations (Requisito 1).
const server = hubServer()

async function tree() {
  return within(await screen.findByRole('navigation', { name: 'Dados' }))
}

test('a árvore: no lugar Dados ela toma o lugar das conversas', async () => {
  openData(server, {}, LIST)
  const nav = await tree()
  expect(nav.queryByRole('link', { name: 'Nova conversa' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Nova conversa' })).toBeNull()
})

test('a árvore: fora de Dados, as conversas ficam', async () => {
  openData(server, {}, `/companies/${COMPANY.id}`)
  expect(await screen.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Dados' })).toBeNull()
})

test('a árvore: o membro em Dados vê Copiado sem tabela do papel e não vê Apps', async () => {
  openData(server, {}, `${LIST}?layer=apps`, 'member')
  const nav = await tree()
  expect(await nav.findByRole('link', { name: 'Negócio' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Tratado' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Copiado 0' })).toBeTruthy()
  expect(nav.getByText('Seu papel ainda não lê nenhuma tabela.')).toBeTruthy()
  expect(nav.queryByRole('link', { name: 'Apps' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Nova conversa' })).toBeNull()
})

test('a árvore: Copiado 0, Tratado, Negócio, Apps, e nenhuma tabela nem sistema aberto', async () => {
  openData(server, { connections: [connection()] }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('link', { name: 'Negócio' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Tratado' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Copiado 0' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Apps' })).toBeTruthy()
  expect(
    await nav.findByText('Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'),
  ).toBeTruthy()
  expect(nav.queryByRole('button', { name: /^Sankhya/ })).toBeNull()
})

async function currentGroups(path: string) {
  openData(server, {}, path)
  const nav = await tree()
  async function current(name: string) {
    return (await nav.findByRole('link', { name })).getAttribute('aria-current')
  }
  return [
    await current('Copiado 0'),
    await current('Tratado'),
    await current('Negócio'),
    await current('Apps'),
  ]
}

test('a árvore: Copiado é o lugar atual na camada copiada e só nela', async () => {
  expect(await currentGroups(LIST)).toEqual(['page', null, null, null])
})

test('a árvore: Tratado é o lugar atual em ?layer=treated', async () => {
  expect(await currentGroups(`${LIST}?layer=treated`)).toEqual([null, 'page', null, null])
})

test('a árvore: Negócio é o lugar atual em ?layer=business', async () => {
  expect(await currentGroups(`${LIST}?layer=business`)).toEqual([null, null, 'page', null])
})

test('a árvore: Apps é o lugar atual em ?layer=apps', async () => {
  expect(await currentGroups(`${LIST}?layer=apps`)).toEqual([null, null, null, 'page'])
})

test('a árvore: carregando, três esqueletos', async () => {
  let arrive: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    arrive = resolve
  })
  openData(server, {}, LIST)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, async () => {
      await held
      return HttpResponse.json({ connectors: CATALOG, connections: [], mayManage: true })
    }),
  )
  const nav = await tree()
  const status = nav.getByRole('status')
  expect(status.textContent).toBe('Carregando')
  expect(document.querySelectorAll('nav [data-slot="skeleton"]')).toHaveLength(3)
  arrive()
  expect(await nav.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
})

test('a árvore: a falha das conexões e Tentar de novo', async () => {
  let fail = true
  openData(server, { answer: () => (fail ? refusal('DATABASE_UNAVAILABLE') : undefined) }, LIST)
  const nav = await tree()
  const alert = await nav.findByRole('alert')
  expect(alert.textContent).toBe(
    'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.',
  )
  fail = false
  fireEvent.click(nav.getByRole('button', { name: 'Tentar de novo' }))
  expect(
    await nav.findByText('Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'),
  ).toBeTruthy()
})

test('a árvore: sem sistema, Copiado 0 e a frase', async () => {
  openData(server, { connections: [] }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('link', { name: 'Copiado 0' })).toBeTruthy()
  expect(await nav.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
})
