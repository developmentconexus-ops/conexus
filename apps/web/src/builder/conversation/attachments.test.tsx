import { ConversationId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { LIMITS } from './attachments.ts'
import { conversationOf, say, screens } from './test-hub.tsx'

const { openConversation } = screens(hubServer())

afterEach(() => sessionStorage.clear())

/** A conversation of its own per test: the draft's files live in the page as long as it does. */
function fresh() {
  return conversationOf({ id: ConversationId.parse(crypto.randomUUID()) })
}

function pick(files: File[]) {
  const picker = document.querySelector('input[type=file]')
  if (picker === null) throw new Error('no file picker')
  fireEvent.change(picker, { target: { files } })
}

function chips(): (string | null)[] {
  const group = screen.queryByRole('group', { name: 'Arquivos anexados' })
  if (group === null) return []
  return within(group)
    .getAllByRole('button')
    .map((remove) => remove.getAttribute('aria-label'))
}

/** A file of its name and `bytes` more bytes: its data URL is about 4/3 of that, plus the type. */
function sized(name: string, bytes: number, type = 'application/pdf') {
  return new File([name, new Uint8Array(bytes)], name, { type })
}

const PDF = new File(['%PDF-1.4'], 'tabela-de-precos.pdf', { type: 'application/pdf' })
const PNG = new File([new Uint8Array([137, 80, 78, 71])], 'logo.png', { type: 'image/png' })
const MD = new File(['# Observações'], 'observacoes.md', { type: '' })
const TXT = new File(['telefone'], 'notas.txt', { type: 'text/plain' })

test('escolher, colar e soltar viram etiquetas, e o x tira (8)', async () => {
  const { field, sent } = await openConversation(fresh())
  pick([PDF, MD])
  await waitFor(() =>
    expect(chips()).toEqual(['Tirar tabela-de-precos.pdf', 'Tirar observacoes.md']),
  )
  fireEvent.paste(field, { clipboardData: { files: [PNG] } })
  await waitFor(() => expect(chips()).toHaveLength(3))
  fireEvent.drop(field, { dataTransfer: { files: [TXT] } })
  await waitFor(() =>
    expect(chips()).toEqual([
      'Tirar tabela-de-precos.pdf',
      'Tirar observacoes.md',
      'Tirar logo.png',
      'Tirar notas.txt',
    ]),
  )
  expect(
    document.querySelector('[aria-label="Arquivos anexados"] img')?.getAttribute('src'),
  ).toMatch(/^data:image\/png;base64,/)
  fireEvent.click(screen.getByRole('button', { name: 'Tirar observacoes.md' }))
  expect(chips()).toEqual(['Tirar tabela-de-precos.pdf', 'Tirar logo.png', 'Tirar notas.txt'])
  expect(sent).toHaveLength(0)
})

test('os tetos da rota recusam com frase, e nada é enviado (9)', async () => {
  const { field, sent } = await openConversation(fresh())
  fireEvent.paste(field, {
    clipboardData: { files: [new File(['x'], 'pacote.zip', { type: 'application/zip' })] },
  })
  expect((await screen.findByRole('alert')).textContent).toBe('Este tipo de arquivo não é aceito.')

  pick(Array.from({ length: LIMITS.files + 1 }, (_, at) => sized(`parte-${at}.pdf`, 3)))
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toBe(
      `Até ${LIMITS.files} arquivos por mensagem.`,
    ),
  )
  expect(chips()).toHaveLength(LIMITS.files)
  for (let at = 0; at < LIMITS.files; at++)
    fireEvent.click(screen.getByRole('button', { name: `Tirar parte-${at}.pdf` }))

  pick([sized('grande.pdf', (LIMITS.data / 4) * 3)])
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toBe('Este arquivo passa de 10,5 MB.'),
  )
  expect(chips()).toEqual([])

  const third = Math.floor((LIMITS.total / 4) * 3) / 3
  pick([sized('um.pdf', third), sized('dois.pdf', third), sized('tres.pdf', third)])
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toBe('Os arquivos passam de 21 MB juntos.'),
  )
  expect(chips()).toEqual(['Tirar um.pdf', 'Tirar dois.pdf'])
  expect(sent).toHaveLength(0)
})

test('o envio leva os arquivos como data URL, o .md sem tipo como text/markdown (10)', async () => {
  const { field, sent } = await openConversation(fresh())
  pick([MD, PDF])
  await waitFor(() => expect(chips()).toHaveLength(2))
  say(field, 'Monte um app de encomendas.')
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]?.body).toEqual({
    message: 'Monte um app de encomendas.',
    files: [
      {
        data: `data:text/markdown;base64,${btoa(String.fromCodePoint(...new TextEncoder().encode('# Observações')))}`,
        mediaType: 'text/markdown',
        filename: 'observacoes.md',
      },
      {
        data: 'data:application/pdf;base64,JVBERi0xLjQ=',
        mediaType: 'application/pdf',
        filename: 'tabela-de-precos.pdf',
      },
    ],
  })
  expect(chips()).toEqual([])
})

test('o texto digitado e o arquivo solto durante uma leitura ficam na caixa (8)', async () => {
  const { field } = await openConversation(fresh())
  pick([sized('grande.pdf', 4_000_000)])
  fireEvent.change(field, { target: { value: 'Monte um app' } })
  fireEvent.drop(field, { dataTransfer: { files: [PDF] } })
  await waitFor(() => expect(chips()).toHaveLength(2))
  expect(chips().toSorted()).toEqual(['Tirar grande.pdf', 'Tirar tabela-de-precos.pdf'])
  expect(field).toHaveProperty('value', 'Monte um app')
})

test('um envio durante a leitura não volta à caixa; o arquivo lido fica nela (8, 12)', async () => {
  const { field, sent } = await openConversation(fresh())
  fireEvent.change(field, { target: { value: 'Monte um app' } })
  pick([sized('grande.pdf', 4_000_000)])
  fireEvent.keyDown(field, { key: 'Enter' })
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]?.body).toEqual({ message: 'Monte um app' })
  await waitFor(() => expect(chips()).toEqual(['Tirar grande.pdf']))
  expect(field).toHaveProperty('value', '')
})

test('o envio apaga a frase de recusa (9)', async () => {
  const { field, sent } = await openConversation(fresh())
  fireEvent.paste(field, {
    clipboardData: { files: [new File(['x'], 'pacote.zip', { type: 'application/zip' })] },
  })
  await screen.findByRole('alert')
  say(field, 'Monte um app')
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(screen.queryByRole('alert')).toBeNull()
})

test('o mesmo arquivo anexado duas vezes fica uma vez, sem frase (8)', async () => {
  const { field } = await openConversation(fresh())
  pick([PDF, PDF])
  await waitFor(() => expect(chips()).toEqual(['Tirar tabela-de-precos.pdf']))
  fireEvent.paste(field, { clipboardData: { files: [PDF] } })
  pick([MD])
  await waitFor(() => expect(chips()).toHaveLength(2))
  expect(chips()).toEqual(['Tirar tabela-de-precos.pdf', 'Tirar observacoes.md'])
  expect(screen.queryByRole('alert')).toBeNull()
})

test('sem armazenamento da aba, o texto digitado fica e um arquivo não o apaga (8)', async () => {
  const { field } = await openConversation(fresh())
  const refuse = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError')
  })
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError')
  })
  try {
    fireEvent.change(field, { target: { value: 'Monte um app' } })
    pick([PDF])
    await waitFor(() => expect(chips()).toHaveLength(1))
    expect(field).toHaveProperty('value', 'Monte um app')
  } finally {
    refuse.mockRestore()
    vi.restoreAllMocks()
  }
})
