import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { conversationOf, FIRST, screens } from './test-hub.tsx'

const { openConversation } = screens(hubServer())

let logged: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => logged.mockRestore())

/** The stream's answers by call, `undefined` being the line a screen follows. */
function answering(...answers: (() => Response | undefined)[]) {
  const times: number[] = []
  return {
    times,
    stream: () => {
      times.push(Date.now())
      return answers[times.length - 1]?.()
    },
  }
}

test('a reconexão que recebe um 4xx qualquer assina o stream de novo, depois da pausa, e registra o código', async () => {
  const hub = answering(
    () => undefined,
    () => refusal('REQUEST_ORIGIN_REFUSED'),
  )
  const { line, lines } = await openConversation(conversationOf({ id: FIRST }), undefined, {
    stream: hub.stream,
  })
  line().close()
  await waitFor(() => expect(hub.times.length).toBeGreaterThanOrEqual(3), { timeout: 8000 })
  await waitFor(() => expect(lines).toHaveLength(2))
  expect(logged).toHaveBeenCalledWith('SESSION_STREAM_REOPENED', 'REQUEST_ORIGIN_REFUSED')
})

test.each(['CONVERSATION_NOT_FOUND', 'SESSION_REQUIRED'] as const)(
  'a reconexão recusada com %s encerra o laço: nenhuma assinatura nova',
  async (code) => {
    const hub = answering(
      () => undefined,
      () => refusal(code),
    )
    const { line } = await openConversation(conversationOf({ id: FIRST }), undefined, {
      stream: hub.stream,
    })
    line().close()
    await waitFor(() => expect(hub.times).toHaveLength(2), { timeout: 8000 })
    // biome-ignore lint/plugin: the absence of a call has no event; 2.5 s is longer than the 1 s pause plus the client's own delay
    await new Promise((done) => setTimeout(done, 2500))
    expect(hub.times).toHaveLength(2)
    expect(logged).not.toHaveBeenCalled()
  },
)

test('depois de uma assinatura que abriu, a pausa volta a ser a primeira', async () => {
  const hub = answering(
    () => HttpResponse.error(),
    () => HttpResponse.error(),
    () => undefined,
    () => refusal('REQUEST_ORIGIN_REFUSED'),
  )
  const { line } = await openConversation(conversationOf({ id: FIRST }), undefined, {
    stream: hub.stream,
  })
  await waitFor(() => expect(hub.times.length).toBeGreaterThanOrEqual(3), { timeout: 8000 })
  line().close()
  await waitFor(() => expect(hub.times.length).toBeGreaterThanOrEqual(5), { timeout: 12_000 })
  const [refused, reopened] = hub.times.slice(3)
  expect((reopened ?? 0) - (refused ?? 0)).toBeLessThan(3000)
})
