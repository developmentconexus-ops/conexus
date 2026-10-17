import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { hubServer, refusal, undecided } from '../../platform/test-hub.tsx'

const server = hubServer()
const SENT = 'Se houver uma conta com esse e-mail, enviamos um link. Ele vale por 1 hora.'

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

async function ask(email: string) {
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar o link' }))
}

test('vazio: o campo de e-mail e o botão; 202 mostra "Se houver uma conta…" e o caminho de volta', async () => {
  const sent: unknown[] = []
  server.use(
    http.post('*/api/password-recoveries', async ({ request }) => {
      sent.push(await request.json())
      return new HttpResponse(null, { status: 202 })
    }),
  )
  open('/forgot-password')
  expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeTruthy()
  await ask('ana@example.test')
  expect((await screen.findByRole('status')).textContent).toBe(SENT)
  expect(screen.getByRole('link', { name: 'Voltar para entrar' })).toBeTruthy()
  expect(screen.queryByLabelText('E-mail')).toBeNull()
  expect(sent).toEqual([{ email: 'ana@example.test' }])
})

test('carregando: o botão diz "Enviando…" até o Hub responder', async () => {
  const release = Promise.withResolvers<void>()
  server.use(
    http.post('*/api/password-recoveries', async () => {
      await release.promise
      return new HttpResponse(null, { status: 202 })
    }),
  )
  open('/forgot-password')
  await ask('ana@example.test')
  expect(await screen.findByRole('button', { name: 'Enviando…' })).toBeTruthy()
  release.resolve()
  expect((await screen.findByRole('status')).textContent).toBe(SENT)
})

test('e-mail que não é e-mail: a frase no campo, nada enviado', async () => {
  let sent = 0
  server.use(
    http.post('*/api/password-recoveries', () => {
      sent++
      return new HttpResponse(null, { status: 202 })
    }),
  )
  open('/forgot-password')
  await ask('sem-arroba')
  expect(await screen.findByText('Escreva um e-mail.')).toBeTruthy()
  expect(sent).toBe(0)
})

test('429 RECOVERY_ATTEMPTS_EXCEEDED: a frase e o que fazer, e o formulário continua', async () => {
  server.use(http.post('*/api/password-recoveries', () => refusal('RECOVERY_ATTEMPTS_EXCEEDED')))
  open('/forgot-password')
  await ask('ana@example.test')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Muitos pedidos deste computador ou rede. Espere um minuto e tente de novo.',
  )
  expect(screen.getByLabelText('E-mail')).toBeTruthy()
})

for (const [name, answer] of undecided('{"pers')) {
  test(`${name}: o texto do enviado, igual ao de uma conta que não existe`, async () => {
    server.use(http.post('*/api/password-recoveries', answer))
    open('/forgot-password')
    await ask('ana@example.test')
    expect((await screen.findByRole('status')).textContent).toBe(SENT)
  })
}

test('o login oferece "Esqueci minha senha", que leva à tela', async () => {
  const router = open('/login')
  fireEvent.click(await screen.findByRole('link', { name: 'Esqueci minha senha' }))
  expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/forgot-password')
})
