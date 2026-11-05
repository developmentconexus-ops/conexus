import { FAILURES, requestPublish } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { ProjectsView } from '../../platform/test-hub.tsx'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import {
  cancelPath,
  PUBLISH_REQUEST_PATH,
  requested,
  requestView,
  versionsRead,
  versionView,
} from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const VERSIONS = `${PROJECT}/about?part=versions`

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [versionView(5)] })))

/** Bruno, a member who does not publish: version 5 is ready and version 3 is on the air. */
function bruno(fields: Partial<ProjectsView> = {}) {
  const view: ProjectsView = {
    projects: [PEDIDOS],
    databaseReady: true,
    mayDelete: false,
    role: 'member',
    appVersion: 5,
    publishedVersion: 3,
    ...fields,
  }
  server.use(...projectsRead(view))
  return view
}

function open(path = PROJECT) {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}

test('pedir para publicar: o botão no lugar de Publicar, a caixa com a mensagem, a linha com Cancelar pedido, e cancelar volta ao botão', async () => {
  const view = bruno()
  const sent: { body: unknown; key: string | null }[] = []
  server.use(
    http.post(PUBLISH_REQUEST_PATH, async ({ request }) => {
      sent.push({ body: await request.json(), key: request.headers.get('idempotency-key') })
      view.publishRequest = requestView({ mayCancel: true })
      return requested(view.publishRequest)
    }),
    http.post(cancelPath, () => {
      view.publishRequest = null
      return new HttpResponse(null, { status: 204 })
    }),
  )
  open()
  expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  const box = await screen.findByRole('dialog', { name: 'Pedir para publicar a versão 5' })
  expect(box.textContent).toContain('Um dono ou um administrador decide.')
  fireEvent.change(within(box).getByRole('textbox', { name: 'Mensagem (opcional)' }), {
    target: { value: 'pronta para a loja' },
  })
  fireEvent.click(within(box).getByRole('button', { name: 'Pedir' }))
  expect(await screen.findByText('Você pediu para publicar a versão 5.')).toBeTruthy()
  expect(sent).toHaveLength(1)
  expect(sent[0]?.body).toEqual({ number: 5, message: 'pronta para a loja' })
  expect(sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
  expect(screen.getByText('“pronta para a loja”')).toBeTruthy()
  expect(screen.getByText('há 2 min')).toBeTruthy()
  // Who asked can withdraw it, so the line does not say that only the deciders decide.
  expect(screen.queryByText('Só o dono e os administradores decidem pedidos.')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Pedir para publicar' })).toBeNull()
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
  expect(await screen.findByRole('button', { name: 'Pedir para publicar' })).toBeTruthy()
  expect(screen.queryByText('Você pediu para publicar a versão 5.')).toBeNull()
})

test('a mensagem é opcional: sem ela, o pedido vai com a mensagem vazia', async () => {
  const view = bruno()
  const sent: unknown[] = []
  server.use(
    http.post(PUBLISH_REQUEST_PATH, async ({ request }) => {
      sent.push(await request.json())
      view.publishRequest = requestView({ mayCancel: true, message: '' })
      return requested(view.publishRequest)
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  expect(await screen.findByText('Você pediu para publicar a versão 5.')).toBeTruthy()
  expect(sent).toEqual([{ number: 5, message: '' }])
  expect(screen.queryByText(/“/)).toBeNull()
})

test('enviando: o botão desligado com "Enviando…"; a caixa fecha ao fim', async () => {
  const view = bruno()
  const held = Promise.withResolvers<void>()
  server.use(
    http.post(PUBLISH_REQUEST_PATH, async () => {
      await held.promise
      view.publishRequest = requestView({ mayCancel: true })
      return requested(view.publishRequest)
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  const sending = await screen.findByRole('button', { name: 'Enviando…' })
  expect(sending.hasAttribute('disabled')).toBe(true)
  held.resolve()
  await screen.findByText('Você pediu para publicar a versão 5.')
})

test('com outro pedido aberto: a linha diz quem pediu, sem botão de pedir nem de decidir', async () => {
  bruno({ publishRequest: requestView() })
  open()
  expect(await screen.findByText('Bruno Reis pede para publicar a versão 5.')).toBeTruthy()
  expect(screen.getByText('Só o dono e os administradores decidem pedidos.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Pedir para publicar' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).toBeNull()
  expect(screen.queryByRole('button', { name: /^Publicar/ })).toBeNull()
})

test('PUBLISH_REQUEST_ALREADY_OPEN: a caixa fecha e o Projeto relido mostra a linha de quem pediu antes', async () => {
  const view = bruno()
  server.use(
    http.post(PUBLISH_REQUEST_PATH, () => {
      view.publishRequest = requestView({ requestedBy: { name: 'Diego Alves' } })
      return refusal('PUBLISH_REQUEST_ALREADY_OPEN')
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  expect(await screen.findByText('Diego Alves pede para publicar a versão 5.')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('PUBLISH_REQUEST_ALREADY_LIVE: a caixa fecha e o Projeto relido mostra a versão publicada, sem botão', async () => {
  const view = bruno()
  server.use(
    http.post(PUBLISH_REQUEST_PATH, () => {
      view.publishedVersion = 5
      return refusal('PUBLISH_REQUEST_ALREADY_LIVE')
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  expect(await screen.findByText('Versão 5 · publicada')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Pedir para publicar' })).toBeNull()
})

test('APP_VERSION_NOT_FOUND: a caixa fecha e a frase de hoje fica abaixo do alto', async () => {
  bruno()
  server.use(http.post(PUBLISH_REQUEST_PATH, () => refusal('APP_VERSION_NOT_FOUND')))
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Essa versão não existe mais.')
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

test('PUBLISH_REQUEST_NOT_NEEDED: a caixa fecha e a frase de hoje fica abaixo do alto', async () => {
  bruno()
  server.use(http.post(PUBLISH_REQUEST_PATH, () => refusal('PUBLISH_REQUEST_NOT_NEEDED')))
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  expect((await screen.findByRole('alert')).textContent).toContain(
    FAILURES.PUBLISH_REQUEST_NOT_NEEDED.phrase,
  )
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

test('NOT_FOUND ao pedir: a caixa fecha sem frase de erro, como Publicar', async () => {
  bruno()
  server.use(http.post(PUBLISH_REQUEST_PATH, () => refusal('NOT_FOUND')))
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(screen.queryByText(FAILURES.NOT_FOUND.phrase)).toBeNull()
})

test('a frase de um pedido que já fechou sai quando a pessoa abre a caixa de pedir de novo', async () => {
  const view = bruno({ publishRequest: requestView({ mayCancel: true }) })
  server.use(
    http.post(cancelPath, () => {
      view.publishRequest = null
      return refusal('PUBLISH_REQUEST_CLOSED')
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
  expect(await screen.findByText('Este pedido já foi decidido.')).toBeTruthy()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  await screen.findByRole('dialog', { name: 'Pedir para publicar a versão 5' })
  expect(screen.queryByText('Este pedido já foi decidido.')).toBeNull()
})

test('o banco sem resposta: a caixa não confirma, "Tentar de novo" manda a mesma chave', async () => {
  const view = bruno()
  const keys: (string | null)[] = []
  let answers = 0
  server.use(
    http.post(PUBLISH_REQUEST_PATH, ({ request }) => {
      keys.push(request.headers.get('idempotency-key'))
      answers += 1
      if (answers === 1) return refusal('DATABASE_UNAVAILABLE')
      view.publishRequest = requestView({ mayCancel: true })
      return requested(view.publishRequest)
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir para publicar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  const box = await screen.findByRole('dialog')
  // The Hub may have acted before the database stopped answering: the box says so (web W24).
  expect((await within(box).findByRole('alert')).textContent).toBe(
    'Não confirmamos o pedido. Tente de novo.',
  )
  fireEvent.click(within(box).getByRole('button', { name: 'Tentar de novo' }))
  await screen.findByText('Você pediu para publicar a versão 5.')
  expect(keys).toHaveLength(2)
  expect(keys[0]).toBe(keys[1])
})

test('nas Versões: Pedir esta no lugar de Publicar esta, e a caixa pede a versão da linha', async () => {
  const view = bruno()
  server.use(
    versionsRead({ versions: [versionView(5), versionView(4)] }),
    http.post(PUBLISH_REQUEST_PATH, async ({ request }) => {
      const { number } = requestPublish.input.body.parse(await request.json())
      view.publishRequest = requestView({ mayCancel: true, number })
      return requested(view.publishRequest)
    }),
  )
  open(VERSIONS)
  const rows = await within(await screen.findByRole('main')).findAllByRole('listitem')
  expect(rows).toHaveLength(2)
  expect(screen.queryByRole('button', { name: 'Publicar esta' })).toBeNull()
  const [, older] = rows
  if (older === undefined) throw new Error('the list has no second row')
  fireEvent.click(within(older).getByRole('button', { name: 'Pedir esta' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pedir' }))
  expect(await screen.findByText('Você pediu para publicar a versão 4.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Pedir esta' })).toBeNull()
})

test('quem publica sem pedido aberto vê Publicar no alto', async () => {
  bruno({ mayDelete: true, mayPublish: true, role: 'owner', publishRequest: null })
  open()
  expect(await screen.findByRole('button', { name: 'Publicar' })).toBeTruthy()
})

test('quem publica com um pedido aberto decide na linha do pedido e não vê Publicar no alto', async () => {
  bruno({
    mayDelete: true,
    mayPublish: true,
    role: 'owner',
    publishRequest: requestView({ mayDecide: true }),
  })
  open()
  expect(await screen.findByRole('button', { name: /^Publicar a versão \d+$/ })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Pedir para publicar' })).toBeNull()
})

test('quem publica e não decide, com um pedido aberto, vê Publicar no alto e nenhum botão na linha do pedido', async () => {
  bruno({
    mayPublish: true,
    role: 'developer',
    publishRequest: requestView({ mayDecide: false }),
  })
  open()
  expect(await screen.findByRole('button', { name: 'Publicar' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: /^Publicar a versão \d+$/ })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull()
})
