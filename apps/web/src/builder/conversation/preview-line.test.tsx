import type { MastraMessagePart } from '@mastra/client-js'
import { screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import { AGENT_START, RUNNING, stepStarted } from './test-events.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'
import { builderSaid, personSaid } from './test-stream.tsx'

const server = hubServer()

const VERSION: MastraMessagePart = {
  type: 'data-conexus-version',
  data: { number: 1, changed: true, files: 3, changedFiles: 3, check: { state: 'passed' } },
}

function preview(data: object): MastraMessagePart {
  return { type: 'data-conexus-preview', data }
}
const { openConversation } = screens(server)

async function turn() {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Crie um app de encomendas')
  const line = opened.line()
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(stepStarted('step-1', []))
  return { line, log: screen.getByRole('log', { name: 'Conversa com o Builder' }) }
}

test('a Prévia sending diz "Subindo o app…", e a mesma mensagem pronta diz "Prévia pronta."', async () => {
  const { line, log } = await turn()
  line.emit(stepStarted('ours', [VERSION, preview({ state: 'sending', number: 1 })]))
  const said = await within(log).findByText(/^Subindo o app…/)
  expect(said.compareDocumentPosition(within(log).getByText(/^Versão 1 guardada/))).toBe(
    Node.DOCUMENT_POSITION_PRECEDING,
  )
  line.emit(stepStarted('ours', [VERSION, preview({ state: 'ready', number: 1 })]))
  await within(log).findByText('Prévia pronta.')
  expect(within(log).queryByText(/^Subindo o app…/)).toBeNull()
})

test('a Prévia que falhou diz o motivo pela frase do código', async () => {
  const { line, log } = await turn()
  line.emit(
    stepStarted('m-preview', [
      {
        type: 'data-conexus-preview',
        data: { state: 'failed', number: 2, code: 'APP_VERSION_NOT_STARTING' },
      },
    ]),
  )
  const said = await within(log).findByText(/^Prévia não atualizada: /)
  expect(said.textContent?.length).toBeGreaterThan('Prévia não atualizada: '.length)
  expect(within(log).queryByText('Prévia pronta.')).toBeNull()
  await waitFor(() => expect(said.textContent).not.toContain('APP_VERSION'))
})

test('a Prévia pronta faz o Projeto ser lido de novo; a que falhou, não', async () => {
  const { line } = await turn()
  let reads = 0
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}`, () => {
      reads += 1
    }),
  )
  const before = reads
  line.emit(
    stepStarted('m-failed', [
      {
        type: 'data-conexus-preview',
        data: { state: 'failed', number: 2, code: 'APP_VERSION_FAILED' },
      },
    ]),
  )
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(reads).toBe(before)
  line.emit(
    stepStarted('m-ready', [{ type: 'data-conexus-preview', data: { state: 'ready', number: 2 } }]),
  )
  await waitFor(() => expect(reads).toBeGreaterThan(before))
})

/** A conversation whose kept version message still holds `sending`. */
function keptSending() {
  return conversationOf({
    id: FIRST,
    messages: [
      personSaid('Crie um app de encomendas'),
      builderSaid('Pronto.'),
      {
        id: 'ours',
        role: 'assistant',
        createdAt: '2026-10-19T12:03:00.000Z',
        content: { parts: [VERSION, preview({ state: 'sending', number: 1 })] },
      },
    ],
  })
}

test('recarregar no meio do envio mostra a versão e "Subindo o app…", até a Prévia pronta (31)', async () => {
  const opened = await openConversation(keptSending(), {
    conversations: [],
    providers: ['anthropic', 'google'],
    display: { isRunning: true },
  })
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  await within(log).findByText(/^Versão 1 guardada/)
  await within(log).findByText(/^Subindo o app…/)
  opened.line().emit(stepStarted('ours', [VERSION, preview({ state: 'ready', number: 1 })]))
  await within(log).findByText('Prévia pronta.')
  expect(within(log).queryByText(/^Subindo o app…/)).toBeNull()
})

test('recarregar uma conversa parada cujo envio foi cortado não mostra "Subindo o app…"', async () => {
  await openConversation(keptSending())
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  await within(log).findByText(/^Versão 1 guardada/)
  expect(within(log).queryByText(/^Subindo o app…/)).toBeNull()
})
