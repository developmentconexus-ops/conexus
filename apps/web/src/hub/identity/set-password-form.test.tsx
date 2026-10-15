import { FAILURES, Problem } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function refusal(code: keyof typeof FAILURES) {
  const row = FAILURES[code]
  const body = Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: row.phrase,
    status: row.status,
    code,
    traceId: 'a1b2c3',
  })
  return HttpResponse.json(body, { status: row.status })
}

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

async function choose(password: string) {
  const field = await screen.findByLabelText('Senha')
  fireEvent.change(field, { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar a senha' }))
  return field
}

test('o token vem do fragmento do link; 204 leva a /login com "Senha criada. Entre com ela."', async () => {
  const sent: unknown[] = []
  server.use(
    http.put('*/api/passwords', async ({ request }) => {
      sent.push(await request.json())
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const router = open('/set-password#token=tok-123')
  expect(await screen.findByRole('heading', { name: 'Criar sua senha' })).toBeTruthy()
  await choose('senha-nova-1')
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe('Senha criada. Entre com ela.')
  expect(router.state.location.pathname).toBe('/login')
  expect(sent).toEqual([{ token: 'tok-123', password: 'senha-nova-1' }])
})

test('um token na consulta, e não no fragmento, não vale: só a frase do link, sem título nem campo', async () => {
  open('/set-password?token=tok-123')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este link já foi usado ou venceu. Peça um link novo a quem cuida do Conexus.',
  )
  expect(screen.queryByRole('heading', { name: 'Criar sua senha' })).toBeNull()
  expect(screen.queryByLabelText('Senha')).toBeNull()
})

for (const password of ['curta', '']) {
  test(`senha curta ("${password}"): o formulário diz no campo, antes de enviar ao Hub`, async () => {
    let sent = 0
    server.use(
      http.put('*/api/passwords', () => {
        sent++
        return new HttpResponse(null, { status: 204 })
      }),
    )
    open('/set-password#token=tok-123')
    const field = await choose(password)
    expect(await screen.findByText('A senha precisa de 8 caracteres ou mais.')).toBeTruthy()
    expect(field.getAttribute('aria-invalid')).toBe('true')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(sent).toBe(0)
  })
}

test('422 PASSWORD_LINK_INVALID: "Este link já foi usado ou venceu."', async () => {
  server.use(http.put('*/api/passwords', () => refusal('PASSWORD_LINK_INVALID')))
  const router = open('/set-password#token=tok-usado')
  await choose('senha-nova-1')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este link já foi usado ou venceu. Peça um link novo a quem cuida do Conexus.',
  )
  expect(router.state.location.pathname).toBe('/set-password')
})

test('vindo de um convite, 204 leva a /login com o convite de volta (W16)', async () => {
  server.use(http.put('*/api/passwords', () => new HttpResponse(null, { status: 204 })))
  const router = open('/set-password?redirect=%2Finvitations%2Fabc#token=tok-123')
  await choose('senha-nova-1')
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(router.state.location.href).toBe(
    '/login?reason=password-set&redirect=%2Finvitations%2Fabc',
  )
})

for (const hostile of [
  '//evil.example.test/',
  'https://evil.example.test/',
  '/\\evil.example.test',
]) {
  test(`um endereço de volta fora do Hub (${hostile}) é ignorado: 204 leva a /login sem ele`, async () => {
    server.use(http.put('*/api/passwords', () => new HttpResponse(null, { status: 204 })))
    const router = open(`/set-password?redirect=${encodeURIComponent(hostile)}#token=tok-123`)
    await choose('senha-nova-1')
    expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
    expect(router.state.location.search).toEqual({ reason: 'password-set' })
  })
}
