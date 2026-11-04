import { ModelId } from '@conexus/hub-api'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { PersonBubble } from './person-turn.tsx'
import { OPENED, session } from './session-state.ts'
import { AGENT_START, RUNNING, stepStarted, textDelta } from './test-events.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'
import { recordedRun } from './test-recorded.ts'
import { NO_OLDER, shownOf, Transcript } from './transcript.tsx'

const { openConversation } = screens(hubServer())
const { events, read } = recordedRun('files')
const MODEL = ModelId.parse('anthropic/claude-sonnet-4')

/** Each of the person's bubbles: the files' names, the words, and the picture an image draws. */
function bubbles() {
  return screen.getAllByRole('group', { name: 'Arquivos' }).map((group) => ({
    files: within(group)
      .getAllByText(/\./)
      .map((name) => name.textContent),
    words: group.parentElement?.querySelector('[data-slot=bubble-content]')?.textContent,
    pictures: [...group.querySelectorAll('img')].map((img) => img.src.slice(0, 22)),
  }))
}

const SENT = [
  {
    files: ['observacoes.md', 'precos.pdf', 'logo.png'],
    words: 'Leia os arquivos e diga, em uma frase, o que a padaria inventada precisa.',
    pictures: ['data:image/png;base64,'],
  },
  { files: ['cardapio.pdf'], words: 'Este PDF também vale.', pictures: [] },
]

test('a bolha mostra o texto e uma etiqueta por arquivo, ao vivo e depois de recarregar, a imagem em miniatura (11)', () => {
  let live = OPENED
  for (const event of events) live = session(live, { type: 'event', event })
  const shown = render(
    <Transcript
      turns={shownOf(live)}
      steers={[]}
      model={MODEL}
      older={NO_OLDER}
      onAsk={() => undefined}
    />,
  )
  expect(bubbles()).toEqual(SENT)
  shown.unmount()

  const reread = session(OPENED, { type: 'loaded', messages: read })
  render(
    <Transcript
      turns={shownOf(reread)}
      steers={[]}
      model={MODEL}
      older={NO_OLDER}
      onAsk={() => undefined}
    />,
  )
  expect(bubbles()).toEqual(SENT)
})

test('um arquivo enviado com o Builder trabalhando aparece pendente com a sua etiqueta (11)', async () => {
  const { field, line, sent } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Crie um app de encomendas')
  await waitFor(() => expect(sent).toHaveLength(1))
  line().emit(AGENT_START)
  line().emit(RUNNING)
  line().emit(stepStarted())
  line().emit(textDelta('Vou começar'))
  await screen.findByRole('button', { name: 'Parar' })
  const picker = document.querySelector('input[type=file]')
  if (picker === null) throw new Error('no file picker')
  fireEvent.change(picker, {
    target: { files: [new File(['%PDF-1.4'], 'cardapio.pdf', { type: 'application/pdf' })] },
  })
  await screen.findByRole('button', { name: 'Tirar cardapio.pdf' })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() =>
    expect(bubbles()).toEqual([{ files: ['cardapio.pdf'], words: undefined, pictures: [] }]),
  )
  expect(screen.getByText('Vai ao Builder no próximo passo')).toBeTruthy()
})

test('dois arquivos de mesmo nome na mesma mensagem são duas etiquetas, sem chave repetida', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const chip = { filename: 'tabela.pdf', image: null }
  render(<PersonBubble text="" files={[chip, chip]} footer={null} />)
  expect(screen.getAllByText('tabela.pdf')).toHaveLength(2)
  expect(error).not.toHaveBeenCalled()
  error.mockRestore()
})

function assistantMark() {
  return screen.queryByRole('note', { name: 'Enviado pelo Assistente' })
}

test('o pedido do Assistente mostra "via Assistente" com a hora, ao vivo e relido; o da pessoa não (24.3.2)', () => {
  const handoff = recordedRun('handoff')
  let live = OPENED
  for (const event of handoff.events) live = session(live, { type: 'event', event })
  const shown = render(
    <Transcript
      turns={shownOf(live)}
      steers={[]}
      model={MODEL}
      older={NO_OLDER}
      onAsk={() => undefined}
    />,
  )
  expect(assistantMark()?.textContent).toMatch(/^via Assistente · \d{2}h\d{2}$/)
  shown.unmount()

  const reread = session(OPENED, { type: 'loaded', messages: handoff.read })
  const again = render(
    <Transcript
      turns={shownOf(reread)}
      steers={[]}
      model={MODEL}
      older={NO_OLDER}
      onAsk={() => undefined}
    />,
  )
  expect(assistantMark()?.textContent).toMatch(/^via Assistente · \d{2}h\d{2}$/)
  again.unmount()

  const plain = session(OPENED, { type: 'loaded', messages: read })
  render(
    <Transcript
      turns={shownOf(plain)}
      steers={[]}
      model={MODEL}
      older={NO_OLDER}
      onAsk={() => undefined}
    />,
  )
  expect(assistantMark()).toBeNull()
})
