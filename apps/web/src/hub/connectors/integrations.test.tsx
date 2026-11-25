import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { sentenceOfCode } from '../../platform/hub.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf, SANKHYA } from './fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { connectionsHub, mount, openIntegrations, PAGE, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()
const MEMBER_SENTENCE = 'Só o dono ou um administrador liga, testa e desliga.'
const TESTED = '2026-10-29T14:02:00.000Z'

function open(view?: View, answers?: Answers, path?: string) {
  return openIntegrations(server, view, answers, path)
}

test('a primeira vez: a frase, o logotipo e o resumo do conector, e Ligar para quem pode', async () => {
  open()
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
  expect(screen.getByText(/O Conexus só lê\.$/)).toBeTruthy()
  expect(screen.getByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  const toLink = within(screen.getByRole('region', { name: 'Para ligar' }))
  expect(toLink.getByText('Sankhya')).toBeTruthy()
  expect(toLink.getByText('ERP')).toBeTruthy()
  expect(toLink.getByText(SANKHYA.summary)).toBeTruthy()
  const logo = toLink.getByRole('presentation', { hidden: true })
  expect(logo.getAttribute('src')?.startsWith('data:image/svg+xml;utf8,')).toBe(true)
  expect(screen.queryByText(MEMBER_SENTENCE)).toBeNull()
})

test('a página que chega de Ligar e testar mostra "Testando a ligação…" enquanto espera', async () => {
  const connection = connectionOf()
  open(viewOf({ connections: [connection] }), {}, `${pageOf(connection)}?testar=true`)
  expect(await screen.findByText('Testando a ligação…')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Testando…' })).toBeTruthy()
  expect(await screen.findByText('Ligado e funcionando.')).toBeTruthy()
  await waitFor(() => expect(screen.queryByText('Testando a ligação…')).toBeNull())
})

test('duas ligações do mesmo conector: um grupo com o logotipo, a conta e cada ligação com o seu estado', async () => {
  const tested = connectionOf({ name: 'Comercial', state: 'ACTIVE', testedAt: TESTED })
  const refused = connectionOf({ name: 'Financeiro', state: 'NEEDS_REAUTH', linkedBy: null })
  open(viewOf({ connections: [tested, refused] }))
  const linked = within(await screen.findByRole('region', { name: 'Ligadas' }))
  expect(linked.getByText('2 ligações')).toBeTruthy()
  expect(linked.getAllByRole('presentation', { hidden: true })).toHaveLength(1)
  expect(linked.getByText('Funcionando')).toBeTruthy()
  expect(linked.getByText('Chaves recusadas')).toBeTruthy()
  expect(linked.getByText(/^testada em \d\d\/\d\d, \d\d:\d\d$/)).toBeTruthy()
  expect(linked.getByText(/^Ligada por Ana em \d\d\/\d\d$/)).toBeTruthy()
  expect(linked.getByText(/^Ligada em \d\d\/\d\d$/)).toBeTruthy()
  const links = linked.getAllByRole('link').map((one) => one.getAttribute('href'))
  expect(links).toEqual([pageOf(tested), pageOf(refused)].map((one) => one))
  // The connector stays under "Para ligar" too: another account of it can be linked.
  expect(
    within(screen.getByRole('region', { name: 'Para ligar' })).getByText(SANKHYA.summary),
  ).toBeTruthy()
})

test('a ligação nova diz "ainda não testada", sem selo e sem "testada em"', async () => {
  open(viewOf({ connections: [connectionOf()] }))
  expect(await screen.findByText(/^Ligada por Ana em \d\d\/\d\d, ainda não testada$/)).toBeTruthy()
  expect(screen.queryByText('Funcionando')).toBeNull()
  expect(screen.queryByText(/^testada em/)).toBeNull()
})

test('o membro lê; vazio e erro: a lista sem Ligar, e a frase de quem pode', async () => {
  const sent = open(
    viewOf({
      mayManage: false,
      connections: [connectionOf({ state: 'ACTIVE', testedAt: TESTED })],
    }),
  )
  expect(await screen.findByText(MEMBER_SENTENCE)).toBeTruthy()
  expect(screen.getByText('Comercial')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /^Ligar/ })).toBeNull()
  expect(sent).toHaveLength(0)
  // Vazio: a frase da primeira vez e o conector sem Ligar.
  cleanup()
  open(viewOf({ mayManage: false }))
  expect(await screen.findByText('Nenhuma integração ligada ainda.')).toBeTruthy()
  expect(screen.getByText(SANKHYA.summary)).toBeTruthy()
  expect(screen.queryByRole('button', { name: /^Ligar/ })).toBeNull()
  // Erro: a leitura que falha mostra a frase do Hub e "Tentar de novo" lê outra vez.
  cleanup()
  let failing = true
  server.use(
    http.get('*/api/companies/*/connections', () =>
      failing ? refusal('DATABASE_UNAVAILABLE') : undefined,
    ),
    ...connectionsHub(viewOf({ mayManage: false })).handlers,
  )
  mount(PAGE)
  expect((await screen.findByRole('alert')).textContent).toBe(
    sentenceOfCode('DATABASE_UNAVAILABLE'),
  )
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText(MEMBER_SENTENCE)).toBeTruthy()
})

test('a página: o cabeçalho, o selo, quem testou e quando, o conector e a sua versão; nada de um teste antigo', async () => {
  const connection = connectionOf({
    state: 'ACTIVE',
    testedAt: TESTED,
    testedBy: connectionOf().linkedBy,
  })
  open(viewOf({ connections: [connection] }), {}, pageOf(connection))
  expect(await screen.findByRole('heading', { name: 'Comercial' })).toBeTruthy()
  expect(screen.getByText('Sankhya · ERP')).toBeTruthy()
  expect(screen.getByText('Funcionando')).toBeTruthy()
  expect(screen.getByText(/^Ligada por Ana em \d\d\/\d\d$/)).toBeTruthy()
  expect(screen.getByText(/^testada em \d\d\/\d\d, \d\d:\d\d, por Ana$/)).toBeTruthy()
  expect(screen.getByText('1.0.0')).toBeTruthy()
  // What a Testar answered is shown only on the page that ran it.
  expect(screen.queryByText('Ligado e funcionando.')).toBeNull()
})

test('uma ligação ainda não testada diz que não foi testada, e o menu da dona tem Desligar', async () => {
  const connection = connectionOf()
  open(viewOf({ connections: [connection] }), {}, pageOf(connection))
  expect(await screen.findByText(/^Ligada por Ana em \d\d\/\d\d, ainda não testada$/)).toBeTruthy()
  expect(screen.queryByText(/^testada em/)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }))
  expect(await screen.findByRole('menuitem', { name: 'Desligar' })).toBeTruthy()
})

test('o membro lê a página com quem testou, sem Testar nem Desligar', async () => {
  const connection = connectionOf({ state: 'ACTIVE', testedAt: TESTED })
  const sent = open(viewOf({ mayManage: false, connections: [connection] }), {}, pageOf(connection))
  expect(await screen.findByText(MEMBER_SENTENCE)).toBeTruthy()
  expect(screen.getByText(/^testada em \d\d\/\d\d, \d\d:\d\d$/)).toBeTruthy()
  for (const name of ['Testar', 'Mais ações', 'Ligar']) {
    expect(screen.queryByRole('button', { name })).toBeNull()
  }
  expect(sent).toHaveLength(0)
})
