import type { MastraMessagePart } from '@mastra/client-js'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  AGENT_START,
  agentEnd,
  MSG_ID,
  RUNNING,
  readPage,
  stepStarted,
  textDelta,
  updatePart,
} from './test-events.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'
import { builderSaid, personSaid } from './test-stream.tsx'

const { openConversation } = screens(hubServer())

/** The person's message sent and the run going, as Mastra's stream tells them. */
async function running(text = 'Compare') {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, text)
  await waitFor(() => expect(opened.sent).toHaveLength(1))
  opened.line().emit(AGENT_START)
  opened.line().emit(RUNNING)
  opened.line().emit({ type: 'message_start', message: opened.shown.conversations[0]?.messages[0] })
  await screen.findByText('Pensando…')
  return { ...opened, log: screen.getByRole('log', { name: 'Conversa com o Builder' }) }
}

/** A message of ours, as `end.ts` saves and tells it at the run's end. */
function ours(...parts: MastraMessagePart[]) {
  const message = builderSaid('', 'ours-1')
  return { ...message, content: { ...message.content, parts } }
}

test('o texto parcial fecha a marca aberta, a região viva espera o fim, e o fim relido é o que o stream desenhou (4)', async () => {
  const { line, shown, log } = await running()
  line().emit(stepStarted())
  line().emit(updatePart(readPage('https://padaria.example.test/pedidos'), 1))
  line().emit(updatePart(readPage('https://padaria.example.test/pedidos', 'Pedidos da padaria'), 1))
  line().emit(textDelta('O **primei'))
  expect((await within(log).findByText('primei')).tagName).toBe('STRONG')
  expect(log.getAttribute('aria-live')).toBe('polite')
  expect(log.getAttribute('aria-busy')).toBe('true')
  expect(within(log).getAllByText(/Leu uma página/)).toHaveLength(1)
  line().emit(textDelta('ro** é bom.'))
  await within(log).findByText('primeiro')
  const drawn = log.textContent
  const step = builderSaid('', MSG_ID)
  step.content = {
    ...step.content,
    parts: [
      { type: 'text', text: 'O **primeiro** é bom.' },
      readPage('https://padaria.example.test/pedidos', 'Pedidos da padaria'),
    ],
  }
  shown.conversations[0]?.messages.push(step)
  line().emit(agentEnd())
  await waitFor(() => expect(log.getAttribute('aria-busy')).toBe('false'))
  expect((await within(log).findByText('primeiro')).tagName).toBe('STRONG')
  expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull()
  expect(log.textContent).toBe(drawn)
})

test('um endereço de página é acessível sem link arbitrário', async () => {
  const { line } = await running('Leia')
  line().emit(stepStarted())
  line().emit(updatePart(readPage('javascript:alert(1)', 'Armadilha'), 0))
  expect(await screen.findByText(/Leu uma página/)).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Armadilha/ })).toBeNull()
})

test('"Parar" pede o abort do Mastra e devolve o foco ao campo', async () => {
  const { field, line, sent } = await running()
  fireEvent.click(await screen.findByRole('button', { name: 'Parar' }))
  await waitFor(() => expect(sent.at(-1)?.path).toMatch(/\/abort$/))
  expect(document.activeElement).toBe(field)
  line().emit(agentEnd('aborted'))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  expect(document.activeElement).toBe(field)
})

test.each([
  ['MODEL_CALL_FAILED', 'O modelo não respondeu. Envie a mensagem de novo.'],
  [
    'MODEL_REFUSED',
    'O modelo recusou este pedido. Reescreva a mensagem de outro jeito ou peça outra coisa ao Builder.',
  ],
  [
    'MODEL_NO_ACCOUNT',
    'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa.',
  ],
])(
  'a falha %s diz a frase da tabela, segue na conversa relida e a resposta termina (30)',
  async (code, phrase) => {
    const { line, shown, log } = await running()
    const failure = ours({ type: 'data-conexus-failure', data: { code } })
    shown.conversations[0]?.messages.push(failure)
    line().emit({ type: 'message_start', message: failure })
    line().emit(agentEnd('error'))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
    expect(screen.queryByText('Pensando…')).toBeNull()
    expect(
      within(log)
        .getAllByRole('alert')
        .map((alert) => alert.textContent),
    ).toEqual([phrase])
  },
)

test('a linha que cai abre de novo e a conversa é lida outra vez: o que se guardou durante a queda aparece uma vez (31)', async () => {
  const { line, lines, shown, reads, log } = await running()
  line().emit(stepStarted())
  line().emit(textDelta('Começo'))
  await within(log).findByText('Começo')
  const step = builderSaid('Começo e fim.', MSG_ID)
  shown.conversations[0]?.messages.push(step)
  const before = reads.length
  line().close()
  await waitFor(() => expect(reads.length).toBeGreaterThan(before), { timeout: 5000 })
  await waitFor(() => expect(lines.length).toBe(2))
  line().emit(agentEnd())
  expect(await within(log).findByText('Começo e fim.')).toBeTruthy()
  expect(within(log).queryByText('Começo')).toBeNull()
})

test('ao abrir com a execução em curso, a semente diz "Parar" e a leitura traz o que já foi dito (31)', async () => {
  const opened = await openConversation(
    conversationOf({ id: FIRST, messages: [personSaid('Compare')] }),
    { conversations: [], providers: ['anthropic', 'google'], display: { isRunning: true } },
  )
  expect(await screen.findByRole('button', { name: 'Parar' })).toBeTruthy()
  expect(screen.getByText('Compare')).toBeTruthy()
  opened.line().emit(stepStarted())
  opened.line().emit(textDelta('Sigo.'))
  expect(await screen.findByText('Sigo.')).toBeTruthy()
})

test('60 s sem o Builder dizer nada: "Ainda trabalhando…", contado desde o início da execução', async () => {
  const { line } = await openConversation(conversationOf({ id: FIRST }))
  vi.useFakeTimers({ shouldAdvanceTime: true })
  try {
    const now = Date.now()
    line().emit(AGENT_START)
    line().emit(RUNNING)
    line().emit(stepStarted())
    line().emit(textDelta('Vou ver.'))
    await screen.findByText('Vou ver.')
    vi.setSystemTime(now + 59_000)
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Builder trabalhando · há 59 s'),
    )
    vi.setSystemTime(now + 60_000)
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Ainda trabalhando… há 1 min 00 s'),
    )
  } finally {
    vi.useRealTimers()
  }
})
