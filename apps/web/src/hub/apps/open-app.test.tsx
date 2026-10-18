import { createAppHandoff } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA } from '../../platform/fixtures.ts'
import { homeHub, hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()
const HOST = 'pedidos--empresa-teste'
const BINDING = 'B'.repeat(43)
const OPEN = `/apps/open?host=${HOST}&binding=${BINDING}`
const APP = `https://${HOST}.apps.example.test/__conexus/passagem?code=${'C'.repeat(43)}`

const assign = vi.fn<(url: string) => void>()
beforeEach(() => {
  vi.stubGlobal('location', { origin: globalThis.location.origin, assign })
})
afterEach(() => {
  assign.mockReset()
  vi.unstubAllGlobals()
})

/** The Hub with Ana signed in, or not; the pass is answered by `answer` and its bodies recorded. */
function hub(signedIn: boolean, answer: () => Response = given) {
  const sent: unknown[] = []
  server.use(
    ...homeHub({ signedIn }),
    http.post('*/api/apps/handoffs', async ({ request }) => {
      sent.push(await request.json())
      return answer()
    }),
  )
  return sent
}

function given() {
  return HttpResponse.json(createAppHandoff.success.body.parse({ location: APP }), { status: 201 })
}

function open(path = OPEN) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('com sessão: "Abrindo o app…", um pedido com o endereço e o vínculo, e vai ao app', async () => {
  const held = Promise.withResolvers<void>()
  const sent = hub(true, () => given())
  server.use(
    http.post('*/api/apps/handoffs', async ({ request }) => {
      sent.push(await request.json())
      await held.promise
      return given()
    }),
  )
  open()
  expect(await screen.findByText('Abrindo o app…')).toBeTruthy()
  expect(assign).not.toHaveBeenCalled()
  held.resolve()
  await waitFor(() => expect(assign).toHaveBeenCalledWith(APP))
  expect(assign).toHaveBeenCalledTimes(1)
  expect(sent).toEqual([{ host: HOST, binding: BINDING }])
})

test('sem sessão: Entrar com o endereço de volta, e depois de entrar abre o app', async () => {
  const state = { signedIn: false }
  const sent: unknown[] = []
  server.use(
    ...homeHub(state),
    http.post('*/api/apps/handoffs', async ({ request }) => {
      sent.push(await request.json())
      return given()
    }),
  )
  const router = open()
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(router.state.location.search).toEqual({ redirect: OPEN })
  expect(sent).toHaveLength(0)
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(assign).toHaveBeenCalledWith(APP))
  expect(sent).toEqual([{ host: HOST, binding: BINDING }])
})

test('404: "Este app não existe ou você não tem acesso a ele.", sem ir a lugar nenhum', async () => {
  hub(true, () => refusal('NOT_FOUND'))
  open()
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este app não existe ou você não tem acesso a ele.',
  )
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  expect(assign).not.toHaveBeenCalled()
})

for (const [name, path] of [
  ['sem o endereço', `/apps/open?binding=${BINDING}`],
  ['sem o vínculo', `/apps/open?host=${HOST}`],
  ['com um vínculo curto', `/apps/open?host=${HOST}&binding=abc`],
  ['com um endereço que não é de app', `/apps/open?host=Pedidos&binding=${BINDING}`],
] as const) {
  test(`um link ${name}: a mesma frase, e o Hub não é chamado`, async () => {
    const sent = hub(true)
    open(path)
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Este app não existe ou você não tem acesso a ele.',
    )
    expect(sent).toHaveLength(0)
  })
}

test('503: a frase e "Tentar de novo", que pede outra passagem', async () => {
  let refuse = true
  const sent = hub(true, () => (refuse ? refusal('DATABASE_UNAVAILABLE') : given()))
  open()
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  expect(assign).not.toHaveBeenCalled()
  refuse = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(assign).toHaveBeenCalledWith(APP))
  expect(sent).toHaveLength(2)
})
