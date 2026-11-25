import { ASSISTANT_CONTROLLER, CONVERSATION_ROUTES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { ASKED, assistantConversation, assistantScreens, COMPANY_ROOT } from './test-hub.tsx'

// The model's button in a conversation with the Assistant (step 13.3, criterion 25).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const SESSION = `${CONVERSATION_ROUTES}/agent-controller/${ASSISTANT_CONTROLLER}/sessions/${ASKED}`

async function toolsOf() {
  return screen.findByRole('button', { name: '2 ferramentas' })
}

async function pickOpus() {
  fireEvent.click(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Claude Opus 4' }))
}

describe('o modelo', () => {
  test('escolher outro modelo manda a troca da sessão pela rota nativa e o botão mostra a escolha que o Hub aceitou', async () => {
    const { writes } = at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    await pickOpus()
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toMatch(
        /Opus/,
      ),
    )
    const [put] = writes()
    expect(put?.method).toBe('POST')
    expect(put?.path).toBe(`${SESSION}/model`)
    expect(put?.body).toEqual({ modelId: 'anthropic/claude-opus-4', thinkingLevel: 'off' })
  })

  test('enquanto o Hub não responde, o botão fica marcado como ocupado e solta quando responde', async () => {
    let answer: () => void = () => undefined
    const held = new Promise<void>((resolve) => {
      answer = resolve
    })
    at(OPEN, { conversations: [assistantConversation()] })
    server.use(
      http.post(`*${SESSION}/model`, async () => {
        await held
        return HttpResponse.json({ ok: true })
      }),
    )
    await toolsOf()
    const busy = (await screen.findByRole('combobox', { name: 'Modelo e raciocínio' })).closest(
      '[aria-busy]',
    )
    expect(busy?.getAttribute('aria-busy')).toBe('false')
    await pickOpus()
    await waitFor(() => expect(busy?.getAttribute('aria-busy')).toBe('true'))
    answer()
    await waitFor(() => expect(busy?.getAttribute('aria-busy')).toBe('false'))
  })

  test('uma recusa diz a frase do código e o botão volta ao modelo de antes', async () => {
    at(OPEN, {
      conversations: [assistantConversation()],
      answers: { model: () => refusal('MODEL_NO_ACCOUNT') },
    })
    await toolsOf()
    await pickOpus()
    expect((await screen.findByRole('alert')).textContent).toMatch(/Nenhuma conta/)
    expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toMatch(
      /Sonnet/,
    )
  })

  test('depois de recarregar, o botão mostra o modelo que a leitura da sessão dá', async () => {
    const first = at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    await pickOpus()
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toMatch(
        /Opus/,
      ),
    )
    first.conexus.queryClient.clear()
    await first.conexus.router.invalidate()
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toMatch(
        /Opus/,
      ),
    )
  })
})

describe('o modelo guardado', () => {
  test('se a releitura da sessão falha depois da troca, o botão fica no modelo que o Hub aceitou', async () => {
    at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    // From here the session read fails, so only what the write put in the cache can keep Opus.
    let failedReads = 0
    server.use(
      http.get(/\/sessions\/[^/]+$/, () => {
        failedReads++
        return refusal('DATABASE_UNAVAILABLE')
      }),
    )
    await pickOpus()
    await waitFor(() => expect(failedReads).toBeGreaterThan(0))
    const picker = screen.getByRole('combobox', { name: 'Modelo e raciocínio' })
    await waitFor(() =>
      expect(picker.closest('[aria-busy]')?.getAttribute('aria-busy')).toBe('false'),
    )
    expect(picker.textContent).toMatch(/Opus/)
  })
})
