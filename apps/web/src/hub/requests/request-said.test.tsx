import { RequestId } from '@conexus/hub-api'
import { focusManager } from '@tanstack/react-query'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  decisionPath,
  requestView,
  versionsRead,
  versionView,
} from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const DECIDED = 'Este pedido já foi decidido.'

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [versionView(5)] })))

/** The Projeto as its owner reads it: version 5 ready and unpublished, Bruno's request open. */
function open() {
  const view: ProjectsView = {
    projects: [PEDIDOS],
    databaseReady: true,
    mayDelete: true,
    role: 'owner',
    appVersion: 5,
    publishedVersion: 3,
    publishRequest: requestView({ mayDecide: true }),
  }
  server.use(...projectsRead(view))
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PROJECT] }))} />)
  return view
}

test('a frase de um pedido que já fechou sai quando a pessoa age sobre o pedido novo', async () => {
  const view = open()
  server.use(
    http.post(decisionPath, () => {
      view.publishRequest = requestView({ mayDecide: true, number: 6 })
      return refusal('PUBLISH_REQUEST_CLOSED')
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  expect(await screen.findByText(DECIDED)).toBeTruthy()
  fireEvent.click(await screen.findByRole('button', { name: 'Recusar' }))
  await screen.findByRole('dialog', { name: 'Recusar a versão 6' })
  expect(screen.queryByText(DECIDED)).toBeNull()
})

test('a frase de um pedido que já fechou não fica sobre o pedido novo que a releitura traz, sem que a pessoa aja', async () => {
  const view = open()
  server.use(
    http.post(decisionPath, () => {
      view.publishRequest = null
      return refusal('PUBLISH_REQUEST_CLOSED')
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  expect(await screen.findByText(DECIDED)).toBeTruthy()
  await waitFor(() =>
    expect(screen.queryByText('Bruno Reis pede para publicar a versão 5.')).toBeNull(),
  )
  view.publishRequest = requestView({
    id: RequestId.parse('00000000-0000-4000-8000-000000000002'),
    mayDecide: true,
    number: 6,
  })
  focusManager.setFocused(false)
  focusManager.setFocused(true)
  expect(await screen.findByRole('button', { name: 'Publicar a versão 6' })).toBeTruthy()
  expect(screen.getByText('Bruno Reis pede para publicar a versão 6.')).toBeTruthy()
  expect(screen.queryByText(DECIDED)).toBeNull()
})

test('agir de novo sobre o mesmo pedido apaga a frase da ação anterior', async () => {
  const view = open()
  let answered = 0
  server.use(
    http.post(decisionPath, () => {
      answered += 1
      if (answered === 1) return refusal('PUBLISH_REQUEST_CLOSED')
      view.publishRequest = null
      return HttpResponse.json({ request: requestView({ mayDecide: true }) })
    }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  expect(await screen.findByText(DECIDED)).toBeTruthy()
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar a versão 5' }))
  await waitFor(() => expect(answered).toBe(2))
  await waitFor(() => expect(screen.queryByText(DECIDED)).toBeNull())
})
