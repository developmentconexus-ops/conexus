import { fireEvent, screen, within } from '@testing-library/react'
import { http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'
import type { View } from './test-hub.tsx'
import {
  API,
  line,
  NOT_RELEASED_NOT_WORKING,
  open as openView,
  READS,
  RELEASED_NOT_WORKING,
  row,
} from './test-hub.tsx'

// The lines of a connection that is not working: no Liberar, and the way to make it work.
const server = hubServer()
function open(view: View) {
  openView(server, view)
}

beforeEach(() => server.use(versionsRead({ versions: [] })))

test('uma ligação ainda não testada não tem Liberar: a linha diz para testar e leva à ligação', async () => {
  const nova = line('Loja 1', { state: 'NEW', access: NOT_RELEASED_NOT_WORKING })
  open({ sankhya: [], ml: [nova], mayManage: true })
  const item = await row('Loja 1')
  expect(item.queryByRole('button', { name: /Liberar/ })).toBeNull()
  const way = item.getByRole('link', { name: 'Teste a ligação antes de liberar' })
  expect(way.getAttribute('href')).toBe(`/companies/${COMPANY.id}/integrations/${nova.id}`)
})

test('uma ligação que pede para conectar de novo, ainda não liberada, também não tem Liberar', async () => {
  open({
    sankhya: [line('Matriz', { state: 'NEEDS_REAUTH', access: NOT_RELEASED_NOT_WORKING })],
    ml: [],
    mayManage: true,
  })
  expect((await row('Matriz')).queryByRole('button', { name: /Liberar/ })).toBeNull()
})

test('a liberação recusada porque a ligação não funciona mais diz a frase na janela', async () => {
  open({ sankhya: [], ml: [line('Loja 1')], mayManage: true })
  server.use(
    http.put(`${API}/projects/${PEDIDOS.id}/connections/:connectionId`, () =>
      refusal('CONNECTION_NOT_WORKING'),
    ),
  )
  fireEvent.click((await row('Loja 1')).getByRole('button', { name: 'Liberar para ler: Loja 1' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Liberar' }))
  expect(
    await within(dialog).findByText(
      'Essa ligação não está funcionando. Teste a ligação, ou conecte de novo, antes de liberar.',
    ),
  ).toBeTruthy()
})

test('o membro vê a ligação não testada sem o caminho, e uma que funciona não leva link', async () => {
  open({
    sankhya: [],
    ml: [line('Loja 1', { state: 'NEW', access: NOT_RELEASED_NOT_WORKING }), line('Loja 2')],
    mayManage: false,
  })
  expect((await row('Loja 1')).getByText('não liberado')).toBeTruthy()
  expect((await row('Loja 1')).queryByRole('link')).toBeNull()
  expect((await row('Loja 2')).queryByRole('link')).toBeNull()
})

test('uma ligação que funciona não leva link de teste, para a dona', async () => {
  open({ sankhya: [], ml: [line('Loja 1'), line('Loja 2', { access: READS })], mayManage: true })
  expect((await row('Loja 1')).queryByRole('link')).toBeNull()
  expect((await row('Loja 2')).queryByRole('link')).toBeNull()
})

test('uma ligação liberada que deixou de funcionar diz que não lê, leva a testá-la e deixa Tirar', async () => {
  const matriz = line('Matriz', { state: 'NEW', access: RELEASED_NOT_WORKING })
  open({ sankhya: [matriz], ml: [], mayManage: true })
  const item = await row('Matriz')
  expect(item.getByText('liberado, mas não lê até a ligação funcionar')).toBeTruthy()
  expect(item.queryByText('lê')).toBeNull()
  const way = item.getByRole('link', { name: 'Testar em Integrações da empresa' })
  expect(way.getAttribute('href')).toBe(`/companies/${COMPANY.id}/integrations/${matriz.id}`)
  expect(item.getByRole('button', { name: 'Tirar: Matriz' })).toBeTruthy()
  expect(item.queryByRole('button', { name: /Liberar/ })).toBeNull()
})

test('uma ligação liberada que pede para conectar de novo leva a conectar de novo, não a testar', async () => {
  open({
    sankhya: [line('Matriz', { state: 'NEEDS_REAUTH', access: RELEASED_NOT_WORKING })],
    ml: [],
    mayManage: true,
  })
  const item = await row('Matriz')
  expect(item.getByText('liberado, mas não lê até a ligação funcionar')).toBeTruthy()
  expect(
    item.getByRole('link', { name: 'Conectar de novo em Integrações da empresa' }),
  ).toBeTruthy()
  expect(item.queryByRole('link', { name: 'Testar em Integrações da empresa' })).toBeNull()
})

test('num conector de uma ligação por Projeto, a liberada que não funciona ainda ocupa o lugar', async () => {
  open({
    sankhya: [line('Matriz', { state: 'NEW', access: RELEASED_NOT_WORKING }), line('Filial')],
    ml: [],
    mayManage: true,
  })
  expect(
    (await row('Filial')).getByText('O Sankhya lê uma ligação por Projeto. Tire a Matriz antes.'),
  ).toBeTruthy()
})
