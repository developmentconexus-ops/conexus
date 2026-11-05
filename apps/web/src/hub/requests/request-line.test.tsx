import { FAILURES } from '@conexus/hub-api'
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
  decisionPath,
  requestView,
  versionsRead,
  versionView,
} from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [versionView(5)] })))

/** The Projeto as `role` reads it, version 5 ready and unpublished, with Bruno's request open. */
function open(role: string, fields: Partial<ProjectsView> = {}) {
  const view: ProjectsView = {
    projects: [PEDIDOS],
    databaseReady: true,
    mayDelete: role === 'owner' || role === 'admin',
    role,
    appVersion: 5,
    publishedVersion: 3,
    publishRequest: requestView({ mayDecide: role === 'owner' || role === 'admin' }),
    ...fields,
  }
  server.use(...projectsRead(view))
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PROJECT] }))} />)
  return view
}

const DECIDED = 'Este pedido já foi decidido.'

test('quem decide lê o pedido com a mensagem, Publicar a versão 5 e Recusar; aprovar manda APPROVE e a linha some', async () => {
  const view = open('owner')
  const sent: unknown[] = []
  server.use(
    http.post(decisionPath, async ({ request }) => {
      sent.push(await request.json())
      view.publishRequest = null
      view.publishedVersion = 5
      return HttpResponse.json({ state: 'APPROVED' })
    }),
  )
  expect(await screen.findByText('Bruno Reis pede para publicar a versão 5.')).toBeTruthy()
  expect(screen.getByText('“pronta para a loja”')).toBeTruthy()
  expect(screen.getByText('há 2 min')).toBeTruthy()
  expect(screen.queryByText('Só o dono e os administradores decidem pedidos.')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Publicar a versão 5' }))
  expect(await screen.findByText('Versão 5 · publicada')).toBeTruthy()
  expect(sent).toEqual([{ decision: 'APPROVE' }])
  expect(screen.queryByText('Bruno Reis pede para publicar a versão 5.')).toBeNull()
})

test('recusar: a caixa pede o motivo, opcional, e manda DECLINE com ele', async () => {
  const view = open('admin')
  const sent: unknown[] = []
  server.use(
    http.post(decisionPath, async ({ request }) => {
      sent.push(await request.json())
      return HttpResponse.json({ state: 'DECLINED' })
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Recusar' }))
  const box = await screen.findByRole('dialog', { name: 'Recusar a versão 5' })
  fireEvent.change(within(box).getByRole('textbox', { name: 'Motivo (opcional)' }), {
    target: { value: 'falta o logo' },
  })
  view.publishRequest = null
  fireEvent.click(within(box).getByRole('button', { name: 'Recusar' }))
  await waitFor(() =>
    expect(screen.queryByText('Bruno Reis pede para publicar a versão 5.')).toBeNull(),
  )
  expect(sent).toEqual([{ decision: 'DECLINE', reason: 'falta o logo' }])
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('recusar sem motivo: a caixa abre vazia e manda DECLINE sem o campo', async () => {
  const view = open('admin')
  const sent: unknown[] = []
  server.use(
    http.post(decisionPath, async ({ request }) => {
      sent.push(await request.json())
      view.publishRequest = null
      return HttpResponse.json({ state: 'DECLINED' })
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Recusar' }))
  const box = await screen.findByRole('dialog', { name: 'Recusar a versão 5' })
  expect(within(box).getByRole('textbox')).toHaveProperty('value', '')
  fireEvent.click(within(box).getByRole('button', { name: 'Recusar' }))
  await waitFor(() =>
    expect(screen.queryByText('Bruno Reis pede para publicar a versão 5.')).toBeNull(),
  )
  expect(sent).toEqual([{ decision: 'DECLINE' }])
})

test('voltar fecha a caixa de recusar sem mandar nada', async () => {
  open('owner')
  server.use(http.post(decisionPath, () => refusal('DATABASE_UNAVAILABLE')))
  fireEvent.click(await screen.findByRole('button', { name: 'Recusar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Voltar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('Bruno Reis pede para publicar a versão 5.')).toBeTruthy()
})

test('o desenvolvedor e outro membro leem a linha sem botões e quem decide', async () => {
  for (const role of ['developer', 'member']) {
    const view = open(role, { mayDelete: false })
    expect(await screen.findByText('Bruno Reis pede para publicar a versão 5.')).toBeTruthy()
    expect(screen.getByText('Só o dono e os administradores decidem pedidos.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Publicar a versão/ })).toBeNull()
    expect(view.publishRequest?.number).toBe(5)
    document.body.innerHTML = ''
  }
})

test('PUBLISH_REQUEST_CLOSED ao aprovar: relê o Projeto e diz que o pedido já foi decidido', async () => {
  const view = open('owner')
  server.use(
    http.post(decisionPath, () => {
      view.publishRequest = null
      return refusal('PUBLISH_REQUEST_CLOSED')
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  expect((await screen.findByRole('alert')).textContent).toBe(DECIDED)
  expect(screen.queryByRole('button', { name: 'Publicar a versão 5' })).toBeNull()
})

test('PUBLISH_REQUEST_CLOSED ao recusar: a caixa fecha e o Projeto diz o mesmo', async () => {
  const view = open('owner')
  server.use(
    http.post(decisionPath, () => {
      view.publishRequest = null
      return refusal('PUBLISH_REQUEST_CLOSED')
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Recusar' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', { name: 'Recusar' }),
  )
  expect((await screen.findByRole('alert')).textContent).toBe(DECIDED)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('PUBLISH_REQUEST_CLOSED ao cancelar: o mesmo, e o botão de pedir volta', async () => {
  const view = open('member', {
    mayDelete: false,
    publishRequest: requestView({ mayCancel: true }),
  })
  server.use(
    http.post(cancelPath, () => {
      view.publishRequest = null
      return refusal('PUBLISH_REQUEST_CLOSED')
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
  expect((await screen.findByRole('alert')).textContent).toBe(DECIDED)
  expect(await screen.findByRole('button', { name: 'Pedir para publicar' })).toBeTruthy()
})

test('NOT_FOUND na linha: relê o Projeto, e a frase de não achado não fica', async () => {
  const view = open('owner')
  server.use(
    http.post(decisionPath, () => {
      view.publishRequest = requestView({ mayDecide: false })
      return refusal('NOT_FOUND')
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Publicar a versão 5' })).toBeNull(),
  )
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.queryByText(FAILURES.NOT_FOUND.phrase)).toBeNull()
})

test('o banco sem resposta ao recusar: a frase fica na caixa e o botão vira Tentar de novo', async () => {
  const view = open('owner')
  let answers = 0
  server.use(
    http.post(decisionPath, () => {
      answers += 1
      if (answers === 1) return refusal('DATABASE_UNAVAILABLE')
      view.publishRequest = null
      return HttpResponse.json({ state: 'DECLINED' })
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Recusar' }))
  const box = await screen.findByRole('dialog', { name: 'Recusar a versão 5' })
  fireEvent.click(within(box).getByRole('button', { name: 'Recusar' }))
  expect((await within(box).findByRole('alert')).textContent).toContain(
    FAILURES.DATABASE_UNAVAILABLE.phrase,
  )
  expect(within(box).queryByRole('button', { name: 'Recusar' })).toBeNull()
  fireEvent.click(within(box).getByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(answers).toBe(2)
})

test('CONNECTOR_NOT_GRANTED: a frase de publicar fica na linha, o pedido segue e a decisão pode ser outra', async () => {
  open('owner')
  server.use(http.post(decisionPath, () => refusal('CONNECTOR_NOT_GRANTED')))
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  const row = FAILURES.CONNECTOR_NOT_GRANTED
  expect((await screen.findByRole('alert')).textContent).toBe(`${row.phrase} ${row.action}`)
  expect(screen.getByText('Bruno Reis pede para publicar a versão 5.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Recusar' })).toBeTruthy()
})

test('o banco sem resposta ao aprovar: a frase na linha e Tentar de novo, que aprova de novo', async () => {
  const view = open('owner')
  let answers = 0
  server.use(
    http.post(decisionPath, () => {
      answers += 1
      if (answers === 1) return refusal('DATABASE_UNAVAILABLE')
      view.publishRequest = null
      view.publishedVersion = 5
      return HttpResponse.json({ state: 'APPROVED' })
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toContain(FAILURES.DATABASE_UNAVAILABLE.phrase)
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  await screen.findByText('Versão 5 · publicada')
  expect(answers).toBe(2)
  expect(screen.queryByRole('alert')).toBeNull()
})

test('publicando: o botão desligado com "Publicando…"', async () => {
  const view = open('owner')
  const held = Promise.withResolvers<void>()
  server.use(
    http.post(decisionPath, async () => {
      await held.promise
      view.publishRequest = null
      return HttpResponse.json({ state: 'APPROVED' })
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  const working = await screen.findByRole('button', { name: 'Publicando…' })
  expect(working.hasAttribute('disabled')).toBe(true)
  expect(screen.getByRole('button', { name: 'Recusar' }).hasAttribute('disabled')).toBe(true)
  held.resolve()
  await screen.findByText('Versão 5 · não publicada')
})
