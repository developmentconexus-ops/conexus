import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

async function choose(password: string, confirmation = password) {
  const field = await screen.findByLabelText('Senha')
  fireEvent.change(field, { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Repita a senha'), { target: { value: confirmation } })
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
    'Este link já foi usado ou venceu. Peça um link novo.',
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
    expect(screen.getByRole('alert').id).toBe(field.getAttribute('aria-describedby'))
    expect(sent).toBe(0)
  })
}

test('422 PASSWORD_LINK_INVALID: "Este link já foi usado ou venceu."', async () => {
  server.use(http.put('*/api/passwords', () => refusal('PASSWORD_LINK_INVALID')))
  const router = open('/set-password#token=tok-usado')
  await choose('senha-nova-1')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este link já foi usado ou venceu. Peça um link novo.',
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

test('password saved before slow navigation never renders an invalid-link alert', async () => {
  const entered = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  server.use(
    http.put('*/api/passwords', () => new HttpResponse(null, { status: 204 })),
    http.get('*/api/invitations/:id', async () => {
      entered.resolve()
      await release.promise
      return HttpResponse.json({ invitation: { kind: 'CLOSED', state: 'EXPIRED' } })
    }),
  )
  const back = `/invitations/${'i'.repeat(32)}`
  open(`/set-password?redirect=${encodeURIComponent(back)}#token=tok-123`)
  await screen.findByLabelText('Senha')
  let flashed = false
  const watch = new MutationObserver(() => {
    flashed ||= document.querySelector('[role="alert"]') !== null
  })
  watch.observe(document.body, { childList: true, subtree: true, characterData: true })
  try {
    await choose('senha-nova-1')
    await entered.promise
    expect(screen.queryByRole('alert')).toBeNull()
    release.resolve()
    expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Senha criada. Entre com ela.')
    expect(flashed).toBe(false)
  } finally {
    release.resolve()
    watch.disconnect()
  }
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

test('um link de recuperação diz "Criar senha nova" e 204 leva a /login com "Senha trocada."', async () => {
  server.use(http.put('*/api/passwords', () => new HttpResponse(null, { status: 204 })))
  const router = open('/set-password#token=tok-123&kind=recovery')
  expect(await screen.findByRole('heading', { name: 'Criar senha nova' })).toBeTruthy()
  await choose('senha-nova-1')
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe('Senha trocada. Entre com a nova senha.')
  expect(router.state.location.search).toEqual({ reason: 'password-changed' })
})

test('a confirmação diferente da senha é recusada no campo, antes de enviar ao Hub', async () => {
  let sent = 0
  server.use(
    http.put('*/api/passwords', () => {
      sent++
      return new HttpResponse(null, { status: 204 })
    }),
  )
  open('/set-password#token=tok-123&kind=recovery')
  await choose('senha-nova-1', 'senha-nova-2')
  const field = await screen.findByLabelText('Repita a senha')
  expect(await screen.findByText('As senhas não são iguais.')).toBeTruthy()
  expect(field.getAttribute('aria-invalid')).toBe('true')
  expect(sent).toBe(0)
})

test('422 PASSWORD_LINK_INVALID oferece "Pedir outro link", que leva a /forgot-password', async () => {
  server.use(http.put('*/api/passwords', () => refusal('PASSWORD_LINK_INVALID')))
  const router = open('/set-password#token=tok-usado&kind=recovery')
  await choose('senha-nova-1')
  const ask = await screen.findByRole('link', { name: 'Pedir outro link' })
  // The link is dead: the fields and the button that would use it are gone.
  expect(screen.queryByLabelText('Senha')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Criar a senha' })).toBeNull()
  fireEvent.click(ask)
  expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/forgot-password')
})

test('um link sem token também oferece "Pedir outro link"', async () => {
  open('/set-password?token=tok-123')
  expect(await screen.findByRole('link', { name: 'Pedir outro link' })).toBeTruthy()
})

for (const code of ['PASSWORD_COMPROMISED', 'PASSWORD_CHECK_UNAVAILABLE'] as const) {
  test(`${code}: a frase do Hub fica no formulário, o link continua e o campo mantém o que foi escrito`, async () => {
    server.use(http.put('*/api/passwords', () => refusal(code)))
    const router = open('/set-password#token=tok-123&kind=recovery')
    const field = await choose('123456789')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(`${FAILURES[code].phrase} ${FAILURES[code].action}`)
    expect(screen.queryByRole('link', { name: 'Pedir outro link' })).toBeNull()
    expect(router.state.location.pathname).toBe('/set-password')
    expect(field).toHaveProperty('value', '123456789')
  })
}
