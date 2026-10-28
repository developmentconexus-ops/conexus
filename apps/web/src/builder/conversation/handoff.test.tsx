import { CompanyId } from '@conexus/hub-api'
import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import type { DataUrl } from './attachments.ts'
import { hasInterruptedHandoff, stashHandoffFiles } from './handoff.ts'
import { conversationOf, FIRST, PROJECT, screens, typed, view } from './test-hub.tsx'
import { UNCONFIRMED_SEND } from './text.ts'

const { open } = screens(hubServer())

afterEach(() => sessionStorage.clear())

function messagesOf(sent: { path: string; body: unknown }[]) {
  return sent.filter((one) => one.path.endsWith('/messages'))
}

const REQUEST = 'Um app de encomendas com cliente, data de entrega e valor'

function isDataUrl(text: string): text is DataUrl {
  return text.startsWith('data:')
}
const PDF_DATA = 'data:application/pdf;base64,JVBERi0xLjQ='
const TABLE = {
  data: isDataUrl(PDF_DATA)
    ? PDF_DATA
    : (() => {
        throw new Error('not a data URL')
      })(),
  mediaType: 'application/pdf',
  filename: 'tabela.pdf',
}

/** Início's hand-over: the conversation opens by a navigation that carries the request. */
async function handedOver(answers: Parameters<typeof open>[2] = {}) {
  const shown = view()
  const hub = open(shown, PROJECT, answers)
  await screen.findByText('Nenhuma conversa')
  shown.conversations.push(conversationOf({ id: FIRST }))
  stashHandoffFiles(FIRST, [TABLE])
  await hub.conexus.router.navigate({
    to: '/companies/$companyId/projects/$projectId/conversations/$conversationId',
    params: {
      companyId: CompanyId.parse(COMPANY.id),
      projectId: PEDIDOS.id,
      conversationId: FIRST,
    },
    state: { handoff: { content: REQUEST } },
  })
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  return { ...hub, field }
}

test('o pedido do Início sai uma vez ao abrir, em modo estrito e sem aviso (8)', async () => {
  const { sent, conexus, field } = await handedOver()
  await waitFor(() => expect(messagesOf(sent)).toHaveLength(1))
  expect(messagesOf(sent)[0]?.body).toEqual({ message: REQUEST, files: [TABLE] })
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(await within(log).findByText(REQUEST)).toBeTruthy()
  expect(within(log).getByText('tabela.pdf')).toBeTruthy()
  expect(typed(field)).toBe('')
  await waitFor(() => expect(conexus.router.state.location.state.handoff).toBeUndefined())
  await waitFor(() => expect(conexus.queryClient.isFetching()).toBe(0))
  expect(messagesOf(sent)).toHaveLength(1)
  expect(screen.queryByRole('alert')).toBeNull()
  expect(sessionStorage.getItem(`conexus-handoff:${FIRST}`)).toBeNull()
})

test('o pedido recusado volta à caixa com o arquivo e a frase (11)', async () => {
  const { field } = await handedOver({ message: () => HttpResponse.error() })
  expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED_SEND)
  expect(typed(field)).toBe(REQUEST)
  expect(screen.getByRole('button', { name: 'Tirar tabela.pdf' })).toBeTruthy()
  // The send answered, so the words are back in the box and the copy leaves: a reload gives nothing back.
  await waitFor(() => expect(sessionStorage.getItem(`conexus-handoff:${FIRST}`)).toBeNull())
  expect(hasInterruptedHandoff(FIRST)).toBe(false)
})

test('o modelo recusado depois do Projeto: a página sem conversa diz por quê (10)', async () => {
  const { conexus } = open(view(), PROJECT)
  await screen.findByText('Nenhuma conversa')
  await conexus.router.navigate({
    to: '/companies/$companyId/projects/$projectId',
    params: { companyId: CompanyId.parse(COMPANY.id), projectId: PEDIDOS.id },
    state: { refused: 'MODEL_NO_ACCOUNT' },
  })
  expect(await screen.findByText(/O Projeto foi criado, mas o seu pedido não saiu\./)).toBeTruthy()
  expect(screen.getByText(/Comece uma Nova conversa e escreva de novo\./)).toBeTruthy()
})
