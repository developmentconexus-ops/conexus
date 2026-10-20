import type { MessagePart } from '@conexus/hub-api'
import { MessageId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hourOf } from '../../platform/dates.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { builderSaid, conversationOf, FIRST, say, screens } from './test-hub.tsx'

const { openConversation } = screens(hubServer())

function tool(
  id: string,
  kind: 'read_page' | 'search_web' = 'read_page',
  state: 'running' | 'completed' | 'error' = 'completed',
): MessagePart {
  return { type: 'tool', id, kind, state, subject: null }
}

/** A turn the Hub began `seconds` ago, speaking on the first line. */
async function begin(seconds = 3) {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Compare')
  await screen.findByText('Pensando…')
  const startedAt = new Date(Date.now() - seconds * 1000).toISOString()
  const line = opened.lines[0]
  line?.emit({ type: 'turn', message: { ...builderSaid(''), parts: [] }, startedAt })
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  function parts(...of: MessagePart[]) {
    for (const part of of) line?.emit({ type: 'part', part })
  }
  return { ...opened, log, parts, line }
}

test('o turno do Builder leva a marca, "Conexus" e o modelo; o da pessoa, a bolha e a hora', async () => {
  const createdAt = '2026-10-19T12:01:00.000Z'
  await openConversation(
    conversationOf({
      id: FIRST,
      messages: [
        {
          id: MessageId.parse('p1'),
          role: 'person',
          parts: [{ type: 'text', text: 'Oi' }],
          model: null,
          createdAt,
        },
        builderSaid('Olá'),
      ],
    }),
  )
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  const [person, builder] = within(log)
    .getAllByText(/^(Oi|Olá)$/)
    .map((text) => text.closest<HTMLElement>('[data-slot="message"]'))
  expect(person?.getAttribute('data-align')).toBe('end')
  expect(within(person ?? log).getByText(hourOf(createdAt))).toBeTruthy()
  expect(builder?.getAttribute('data-align')).toBe('start')
  expect(within(builder ?? log).getByText('Conexus')).toBeTruthy()
  expect(within(builder ?? log).getByText('claude-sonnet-4')).toBeTruthy()
  expect(builder?.querySelector('svg path')).toBeTruthy()
})

test('uma ou duas ferramentas são linhas; três ou mais viram uma linha que abre', async () => {
  const { log, line, parts } = await begin()
  parts(tool('a'), tool('b', 'search_web'))
  expect(await within(log).findByText('Leu uma página')).toBeTruthy()
  expect(within(log).getByText('Pesquisou na internet')).toBeTruthy()
  expect(within(log).queryByRole('button')).toBeNull()
  parts(tool('c'), tool('d'))
  line?.emit({ type: 'text', delta: 'Pronto.' })
  const group = await within(log).findByRole('button', {
    name: 'Leu 3 páginas, pesquisou 1 vez',
  })
  expect(group.getAttribute('aria-expanded')).toBe('false')
  expect(within(log).queryByText('Leu uma página')).toBeNull()
  fireEvent.click(group)
  expect(group.getAttribute('aria-expanded')).toBe('true')
  expect(await within(log).findAllByText('Leu uma página')).toHaveLength(3)
  expect(within(log).getByText('Pesquisou na internet')).toBeTruthy()
})

test('um texto ou um pensamento entre as ferramentas quebra a sequência', async () => {
  const { log, line, parts } = await begin()
  parts(tool('a'), tool('b'))
  line?.emit({ type: 'text', delta: 'Agora outra.' })
  parts(tool('c'), tool('d'))
  await within(log).findByText('Agora outra.')
  expect(within(log).getAllByText('Leu uma página')).toHaveLength(4)
  expect(within(log).queryByRole('button')).toBeNull()
})

test('o grupo rodando diz a ferramenta e quantas acabaram, e está aberto', async () => {
  const { log, parts } = await begin()
  parts(
    tool('a'),
    tool('b'),
    { type: 'tool', id: 'c', kind: 'read_page', state: 'running', subject: null },
    { type: 'tool', id: 'd', kind: 'read_page', state: 'running', subject: null },
  )
  const header = await within(log).findByRole('button', { name: /Lendo uma página/ })
  expect(header.textContent).toBe('Lendo uma página2/4')
  expect(header.getAttribute('aria-expanded')).toBe('true')
  parts(tool('c'), tool('d'))
  await waitFor(() => expect(header.textContent).toBe('Leu uma página4/4'))
})

test('a ferramenta que falhou diz que falhou e não mostra o texto do fornecedor', async () => {
  const { log, parts } = await begin()
  parts(Object.assign(tool('a', 'read_page', 'error'), { error: 'SECRET-PLANTED-TEXT' }))
  expect(await within(log).findByText('Não conseguiu ler uma página')).toBeTruthy()
  expect(log.textContent).not.toContain('SECRET-PLANTED-TEXT')
})

test('o endereço da página é um link só se for http ou https', async () => {
  const { log, parts } = await begin()
  parts(
    {
      type: 'tool',
      id: 'a',
      kind: 'read_page',
      state: 'completed',
      subject: { url: 'https://padaria.example.test/pedidos', title: 'Pedidos da padaria' },
    },
    {
      type: 'tool',
      id: 'b',
      kind: 'read_page',
      state: 'completed',
      subject: { url: 'javascript:alert(1)', title: 'Armadilha' },
    },
  )
  const link = await within(log).findByRole('link', { name: /Pedidos da padaria/ })
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  expect(within(log).getByText('Armadilha')).toBeTruthy()
  expect(within(log).queryByRole('link', { name: /Armadilha/ })).toBeNull()
})

test('"Pensando…" vale até o primeiro conteúdo; o pensamento acabado diz o tempo e não abre', async () => {
  const { log, parts } = await begin()
  expect(within(log).getAllByText('Pensando…')).toHaveLength(1)
  parts({ type: 'reasoning', id: 'r', state: 'running', seconds: null })
  expect(within(log).getAllByText('Pensando…')).toHaveLength(1)
  parts({ type: 'reasoning', id: 'r', state: 'completed', seconds: 9 })
  expect(await within(log).findByText('Pensou por 9 s')).toBeTruthy()
  expect(within(log).queryByText('Pensando…')).toBeNull()
  expect(within(log).queryByRole('button')).toBeNull()
})

test('o pensamento relido, sem tempo, diz só "Pensou"', async () => {
  await openConversation(
    conversationOf({
      id: FIRST,
      messages: [
        {
          ...builderSaid(''),
          parts: [
            { type: 'reasoning', id: 'r', state: 'completed', seconds: null },
            { type: 'text', text: 'Pronto.' },
          ],
        },
      ],
    }),
  )
  expect(screen.getByText('Pensou')).toBeTruthy()
})

test('"Builder trabalhando" conta desde o início do turno no servidor, e segue ao reconectar', async () => {
  const { lines, line } = await begin(65)
  const status = await screen.findByRole('status')
  expect(status.textContent).toMatch(/^Builder trabalhando · há 1 min 0[5-6] s$/)
  line?.close()
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  const startedAt = new Date(Date.now() - 125_000).toISOString()
  lines[1]?.emit({ type: 'turn', message: { ...builderSaid(''), parts: [] }, startedAt })
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toMatch(
      /^Builder trabalhando · há 2 min 0[5-6] s$/,
    ),
  )
  lines[1]?.emit({ type: 'turnEnd', reason: 'complete' })
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
})

test('a falha fica no turno, relida depois de recarregar', async () => {
  await openConversation(
    conversationOf({
      id: FIRST,
      messages: [
        {
          ...builderSaid(''),
          parts: [
            { type: 'text', text: 'Vou tentar.' },
            { type: 'failure', code: 'MODEL_CALL_FAILED' },
          ],
        },
      ],
    }),
  )
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O modelo não respondeu. Envie a mensagem de novo.',
  )
  expect(screen.getByText('Vou tentar.')).toBeTruthy()
})

/** What jsdom lacks of a scrolling element, as members to lend the elements: a `scrollTop` that sticks. */
class Scrolling {
  declare dataset: DOMStringMap
  top = 0
  get scrollHeight() {
    return 1000
  }
  get clientHeight() {
    return 200
  }
  get scrollTop() {
    return this.top
  }
  set scrollTop(top: number) {
    this.top = top
  }
  scrollTo(options: ScrollToOptions) {
    this.top = options.top ?? 0
  }
  getBoundingClientRect() {
    return new DOMRect(0, 0, 0, this.dataset.messageId ? 1000 : 200)
  }
}

/** jsdom lays nothing out: a viewport of 200 over 1000 of conversation. */
function withGeometry() {
  const lent = Object.getOwnPropertyDescriptors(Scrolling.prototype)
  Reflect.deleteProperty(lent, 'constructor')
  Object.defineProperties(HTMLElement.prototype, lent)
  return () => {
    for (const name of Object.keys(lent)) Reflect.deleteProperty(HTMLElement.prototype, name)
  }
}

test('a conversa abre no fim, quem subiu não é puxado quando ela cresce e volta com "Ir para o fim da conversa"', async () => {
  const restore = withGeometry()
  try {
    const { parts } = await begin()
    const viewport = screen.getByLabelText('Rolagem da conversa')
    parts(tool('a'), tool('b'))
    await waitFor(() => expect(viewport.scrollTop).toBe(800))
    viewport.scrollTop = 100
    fireEvent.wheel(viewport, { deltaY: -50 })
    fireEvent.scroll(viewport)
    parts(tool('c'))
    await screen.findByRole('button', { name: /Leu uma página3\/3/ })
    expect(viewport.scrollTop).toBe(100)
    fireEvent.click(await screen.findByRole('button', { name: 'Ir para o fim da conversa' }))
    await waitFor(() => expect(viewport.scrollTop).toBe(800))
  } finally {
    restore()
  }
})
