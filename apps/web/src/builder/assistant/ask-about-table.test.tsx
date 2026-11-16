import { fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { copiesHub, copy, detailOf, VENDAS } from '../../hub/copies/test-hub.tsx'
import { hubServer } from '../../platform/test-hub.tsx'
import { assistantScreens } from './test-hub.tsx'

// O link Perguntar ao Assistente da página de uma tabela: abre o Início com a tabela na caixa, sem enviar (Dados, parte 4).
const server = hubServer()
afterEach(() => server.events.removeAllListeners())
const { at } = assistantScreens(server)
const LINE = 'Sobre a tabela sankhya_vendas: '
const DETAIL = detailOf(VENDAS)

/** A member on the page of `sankhya_vendas`, on the Hub of the copies and the Assistant together. */
function openAsMember() {
  copiesHub(server, { copies: [copy({ name: 'sankhya_vendas' })], runs: [] })
  return at(DETAIL, { role: 'member' })
}

async function box() {
  const found = await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
  if (!(found instanceof HTMLTextAreaElement)) throw new Error('the box is not a textarea')
  return found
}

async function ask() {
  fireEvent.click(await screen.findByRole('link', { name: 'Perguntar ao Assistente' }))
}

/** From Início to the table's page, the way a person goes: Dados in the rail, then the table. */
async function toTable() {
  fireEvent.click(screen.getAllByRole('link', { name: 'Dados' })[0] ?? document.body)
  const [link] = await screen.findAllByRole('link', { name: 'sankhya_vendas' })
  fireEvent.click(link ?? document.body)
}

/** Every write the page makes, whichever handler answers it: the server's own event, not a list a handler keeps. */
function writesOf() {
  const posts: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST') posts.push(new URL(request.url).pathname)
  })
  return posts
}

test('Perguntar ao Assistente abre o Início com a tabela na caixa, sem enviar (critério 88)', async () => {
  const posts = writesOf()
  openAsMember()
  const link = await screen.findByRole('link', { name: 'Perguntar ao Assistente' })
  expect(screen.queryByRole('button', { name: /Rodar agora/ })).toBeNull()
  fireEvent.click(link)
  const written = await box()
  expect(written.value).toBe(LINE)
  expect(posts).toEqual([])
  fireEvent.change(written, { target: { value: '' } })
})

test('o rascunho que já havia fica, e a linha não se repete (critério 89)', async () => {
  openAsMember()
  await ask()
  fireEvent.change(await box(), { target: { value: 'Oi' } })
  await toTable()
  await ask()
  expect((await box()).value).toBe(`Oi\n${LINE}`)
  await toTable()
  await ask()
  expect((await box()).value).toBe(`Oi\n${LINE}`)
})
