import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { ASKED, assistantConversation, assistantScreens, COMPANY_ROOT } from './test-hub.tsx'

// The model's button in a conversation with the Assistant (step 13.3, criterion 25).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`

async function toolsOf() {
  return screen.findByRole('button', { name: '2 ferramentas' })
}

async function pickOpus() {
  fireEvent.click(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Claude Opus 4' }))
}

describe('o modelo', () => {
  test('escolher outro modelo manda o PUT da conversa e o botão mostra o que o Hub guardou', async () => {
    const { writes } = at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    await pickOpus()
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toMatch(
        /Opus/,
      ),
    )
    const [put] = writes()
    expect(put?.method).toBe('PUT')
    expect(put?.path).toBe(`/api/companies/${COMPANY.id}/assistant/conversations/${ASKED}/model`)
    expect(put?.body).toMatchObject({ model: 'anthropic/claude-opus-4' })
  })

  test('enquanto o Hub não responde, o botão fica marcado como ocupado e solta quando responde', async () => {
    let answer: () => void = () => undefined
    const held = new Promise<void>((resolve) => {
      answer = resolve
    })
    at(OPEN, { conversations: [assistantConversation()] })
    server.use(
      http.put('*/api/companies/:companyId/assistant/conversations/:id/model', async () => {
        await held
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
  test('se a releitura da sessão falha depois do PUT, o botão fica no modelo que o Hub guardou', async () => {
    at(OPEN, { conversations: [assistantConversation()] })
    await toolsOf()
    // From here the session read fails, so only what the write put in the cache can keep Opus.
    server.use(http.get(/\/sessions\/[^/]+$/, () => refusal('DATABASE_UNAVAILABLE')))
    await pickOpus()
    const picker = screen.getByRole('combobox', { name: 'Modelo e raciocínio' })
    await waitFor(() =>
      expect(picker.closest('[aria-busy]')?.getAttribute('aria-busy')).toBe('false'),
    )
    expect(picker.textContent).toMatch(/Opus/)
  })
})
