import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE, SANKHYA, workingOf } from './fixtures.ts'
import type { Answers } from './test-hub.tsx'
import {
  AUTHORIZE_URL,
  connectionsHub,
  fill,
  mount,
  openIntegrations,
  pageOf,
  viewOf,
} from './test-hub.tsx'

const server = hubServer()

afterEach(() => vi.unstubAllGlobals())

function assignSpy() {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...globalThis.location, assign, origin: globalThis.location.origin })
  return assign
}

function open(connections = [connectionOf({ connector: 'mercado-livre' })], answers: Answers = {}) {
  return openIntegrations(
    server,
    viewOf({ connectors: [MERCADO_LIVRE, SANKHYA], connections }),
    answers,
  )
}

test('um conector OAuth abre a janela só com o nome e "Continuar no Mercado Livre", nunca campos', async () => {
  const assign = assignSpy()
  const sent = open([])
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar Mercado Livre' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ligar Mercado Livre' })
  expect(
    within(dialog).getByText('Você vai ao Mercado Livre entrar com a conta e autorizar o Conexus.'),
  ).toBeTruthy()
  expect(within(dialog).queryByRole('region', { name: 'Antes de colar' })).toBeNull()
  expect(within(dialog).getAllByRole('textbox')).toHaveLength(1)
  expect(within(dialog).queryByLabelText('Client ID')).toBeNull()
  fireEvent.change(within(dialog).getByLabelText('Nome da ligação'), {
    target: { value: 'Loja 2' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar no Mercado Livre' }))
  await vi.waitFor(() => expect(assign).toHaveBeenCalledWith(AUTHORIZE_URL))
  expect(sent[0]).toMatchObject({
    method: 'POST',
    path: `/api/companies/${COMPANY.id}/connection-sign-ins`,
    body: { connector: 'mercado-livre', name: 'Loja 2' },
  })
  expect(within(dialog).getByRole('button', { name: 'Continuar no Mercado Livre' })).toHaveProperty(
    'disabled',
    true,
  )
})

test('CONNECTOR_NOT_CONFIGURED e nome já usado ficam na janela, e o navegador não sai', async () => {
  const assign = assignSpy()
  open([], { start: () => refusal('CONNECTOR_NOT_CONFIGURED') })
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar Mercado Livre' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ligar Mercado Livre' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar no Mercado Livre' }))
  expect(await within(dialog).findByRole('alert')).toBeTruthy()
  expect(assign).not.toHaveBeenCalled()
  expect(within(dialog).getByRole('button', { name: 'Continuar no Mercado Livre' })).toHaveProperty(
    'disabled',
    false,
  )
})

test('Conectar de novo numa ligação OAuth recusada vai direto ao Mercado Livre, sem janela e sem campos', async () => {
  const assign = assignSpy()
  const refused = connectionOf({
    connector: 'mercado-livre',
    state: 'NEEDS_REAUTH',
    name: 'Loja 2',
  })
  const hub = connectionsHub(viewOf({ connectors: [MERCADO_LIVRE], connections: [refused] }))
  server.use(...hub.handlers)
  mount(pageOf(refused))
  expect(await screen.findByText('O Mercado Livre pediu para conectar de novo.')).toBeTruthy()
  expect(screen.getByText('Pede para conectar de novo')).toBeTruthy()
  expect(screen.queryByText(/Sankhya|chaves/i)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Conectar de novo' }))
  await vi.waitFor(() => expect(assign).toHaveBeenCalledWith(AUTHORIZE_URL))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(hub.sent[0]?.body).toEqual({ connectionId: refused.id })
})

test('um client_credentials NEEDS_REAUTH abre a janela das chaves com o nome travado e manda PUT …/credential', async () => {
  const refused = connectionOf({ state: 'NEEDS_REAUTH', name: 'Comercial' })
  const hub = connectionsHub(viewOf({ connections: [refused] }))
  server.use(...hub.handlers)
  mount(pageOf(refused))
  fireEvent.click(await screen.findByRole('button', { name: 'Conectar de novo' }))
  const dialog = await screen.findByRole('dialog', { name: 'Conectar de novo' })
  expect(within(dialog).queryByLabelText('Nome da ligação')).toBeNull()
  expect(within(dialog).getByText('Comercial')).toBeTruthy()
  fill()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Conectar de novo' }))
  expect(await screen.findByRole('button', { name: 'Testando…' })).toBeTruthy()
  const put = hub.sent.find((one) => one.method === 'PUT')
  expect(put).toMatchObject({
    path: `/api/companies/${COMPANY.id}/connections/${refused.id}/credential`,
    body: {
      credential: {
        clientId: 'id-plantado-1',
        clientSecret: 'segredo-plantado-2',
        xToken: 'token-plantado-3',
      },
    },
  })
})

test('Ligar e testar recusado, depois Conectar de novo com chaves boas: a janela fecha, o teste roda e a página volta a funcionar', async () => {
  const connection = connectionOf({ name: 'Comercial' })
  const hub = connectionsHub(viewOf({ connections: [connection] }), {}, (one) => {
    const tests = hub.sent.filter((sent) => sent.method === 'POST' && sent.path.endsWith('/test'))
    return tests.length === 1
      ? {
          result: 'AUTH_REFUSED',
          native: { status: 401, code: 'NEGADO', message: null, body: null },
          connection: { ...one, state: 'NEEDS_REAUTH' },
        }
      : workingOf(one)
  })
  server.use(...hub.handlers)
  mount(`${pageOf(connection)}?testar=true`)
  expect(await screen.findByText('As chaves foram recusadas pelo Sankhya.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Conectar de novo' }))
  const dialog = await screen.findByRole('dialog', { name: 'Conectar de novo' })
  fill()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Conectar de novo' }))
  expect(await screen.findByText('Funcionando')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.queryByText('As chaves foram recusadas pelo Sankhya.')).toBeNull()
  expect(hub.sent.filter((sent) => sent.path.endsWith('/test'))).toHaveLength(2)
})

test('o membro lê a frase e "Peça ao dono ou a um administrador.", sem botão', async () => {
  const refused = connectionOf({ connector: 'mercado-livre', state: 'NEEDS_REAUTH' })
  const hub = connectionsHub(
    viewOf({ connectors: [MERCADO_LIVRE], connections: [refused], mayManage: false }),
  )
  server.use(...hub.handlers)
  mount(pageOf(refused))
  expect(
    await screen.findByText(
      'O Mercado Livre pediu para conectar de novo. Peça ao dono ou a um administrador.',
    ),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Conectar de novo' })).toBeNull()
})

test('a lista e a página mostram a conta do fornecedor', async () => {
  const one = connectionOf({
    connector: 'mercado-livre',
    name: 'Loja 2',
    account: { label: 'PADARIASOL' },
  })
  open([one])
  expect(await screen.findByText(/conta PADARIASOL/)).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: /Loja 2/ }))
  expect(await screen.findByText(/ · conta PADARIASOL/)).toBeTruthy()
})
