import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { conversationsNone, hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'
import type { View } from './test-hub.tsx'
import {
  API,
  ASK,
  line,
  NOT_RELEASED_NOT_WORKING,
  open as openView,
  READS,
  row,
  sent,
} from './test-hub.tsx'

const server = hubServer()
function open(view: View) {
  openView(server, view)
}

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

test('a dona libera a ligação certa e a linha passa a ler', async () => {
  const loja = line('Loja 2')
  open({ sankhya: [], ml: [line('Loja 1', { access: READS }), loja], mayManage: true })
  expect(await screen.findByRole('heading', { name: 'Integrações deste Projeto' })).toBeTruthy()
  expect((await row('Loja 1')).getByRole('button', { name: 'Tirar: Loja 1' })).toBeTruthy()
  fireEvent.click((await row('Loja 2')).getByRole('button', { name: 'Liberar para ler: Loja 2' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(
    within(dialog).getByText(
      'O app, o Conexus e os agentes poderão usar o Mercado Livre da empresa. O que cada um faz nele depende do papel de quem publica. Quem usa o app vê o que o app mostrar.',
    ),
  ).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Liberar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toEqual([
    {
      method: 'PUT',
      path: `/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/connections/${loja.id}`,
    },
  ])
  expect(await (await row('Loja 2')).findByRole('button', { name: 'Tirar: Loja 2' })).toBeTruthy()
})

test('sem cópias: as Integrações do Projeto não listam nem liberam cópia (critério 74)', async () => {
  const asked: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('/copies')) asked.push(request.url)
  })
  open({ sankhya: [], ml: [line('Loja 1', { access: READS })], mayManage: true })
  expect(await row('Loja 1')).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'Cópias' })).toBeNull()
  expect(screen.queryByText('A empresa ainda não tem cópias.')).toBeNull()
  expect(screen.queryByRole('button', { name: /^Liberar: / })).toBeNull()
  expect(asked).toEqual([])
})

test('num conector de uma ligação por Projeto, as outras linhas dizem qual tirar e não liberam', async () => {
  open({
    sankhya: [line('Matriz', { access: READS }), line('Filial')],
    ml: [line('Loja 1'), line('Loja 2')],
    mayManage: true,
  })
  const filial = await row('Filial')
  expect(
    filial.getByText('O Sankhya lê uma ligação por Projeto. Tire a Matriz antes.'),
  ).toBeTruthy()
  expect(filial.queryByRole('button')).toBeNull()
  for (const name of ['Loja 1', 'Loja 2']) {
    expect(
      (await row(name)).getByRole('button', { name: `Liberar para ler: ${name}` }),
    ).toBeTruthy()
  }
})

test('o membro vê o estado e a frase, sem botões', async () => {
  open({ sankhya: [line('Matriz', { access: READS })], ml: [line('Loja 1')], mayManage: false })
  expect(await screen.findByText(ASK)).toBeTruthy()
  expect((await row('Matriz')).getByText('lê')).toBeTruthy()
  expect((await row('Loja 1')).getByText('não liberado')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Liberar|Tirar/ })).toBeNull()
})

test('uma ligação que pede para conectar de novo mostra o selo e o caminho', async () => {
  const matriz = line('Matriz', { state: 'NEEDS_REAUTH', access: NOT_RELEASED_NOT_WORKING })
  open({ sankhya: [matriz], ml: [], mayManage: true })
  const item = await row('Matriz')
  expect(item.getByText('Chaves recusadas')).toBeTruthy()
  const way = item.getByRole('link', { name: 'Conectar de novo em Integrações da empresa' })
  expect(way.getAttribute('href')).toBe(`/companies/${COMPANY.id}/integrations/${matriz.id}`)
})

test('o selo de uma ligação diz o login do conector da própria lista do Projeto', async () => {
  open({ sankhya: [], ml: [line('Loja', { state: 'NEEDS_REAUTH' })], mayManage: true })
  expect((await row('Loja')).getByText('Pede para conectar de novo')).toBeTruthy()
})

test('sem nenhuma ligação, a frase e o caminho para a dona; para o membro, quem pede', async () => {
  open({ sankhya: [], ml: [], mayManage: true })
  expect(await screen.findByText('A empresa ainda não ligou nenhum sistema.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ligar em Integrações da empresa' })).toBeTruthy()
})

test('o membro, sem nenhuma ligação, lê a frase de quem pedir', async () => {
  open({ sankhya: [], ml: [], mayManage: false })
  expect(await screen.findByText('A empresa ainda não ligou nenhum sistema.')).toBeTruthy()
  expect(screen.getByText(ASK)).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Ligar em Integrações da empresa' })).toBeNull()
})

test('a liberação recusada porque o Projeto já lê outra ligação diz a frase na janela', async () => {
  open({ sankhya: [], ml: [line('Loja 1')], mayManage: true })
  server.use(
    http.put(`${API}/projects/${PEDIDOS.id}/connections/:connectionId`, () =>
      refusal('PROJECT_CONNECTION_TAKEN'),
    ),
  )
  fireEvent.click((await row('Loja 1')).getByRole('button', { name: 'Liberar para ler: Loja 1' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Liberar' }))
  expect(
    await within(dialog).findByText(
      'Este Projeto já lê outra ligação desse sistema. Tire a outra ligação antes de liberar esta.',
    ),
  ).toBeTruthy()
})

test('a leitura das ligações que falha diz a frase com Tentar de novo', async () => {
  open({ sankhya: [], ml: [], mayManage: true })
  server.use(
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () => refusal('DATABASE_UNAVAILABLE')),
  )
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByText(sentenceOfCode('DATABASE_UNAVAILABLE'))).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('a lista da empresa que falha também diz a frase, e não deixa a dona sem saber', async () => {
  open({ sankhya: [line('Matriz')], ml: [], mayManage: true })
  server.use(http.get(`${API}/connections`, () => refusal('DATABASE_UNAVAILABLE')))
  expect(await screen.findByText(sentenceOfCode('DATABASE_UNAVAILABLE'))).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Liberar|Tirar/ })).toBeNull()
})
