import type { ShownFile } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { CHART, PNG, savedWith, showingOn } from './test-file.tsx'
import { assistantScreens } from './test-hub.tsx'

// The file panel's failures and its download (step 24.1, criterion 27, QA F2, F32, K27).
const server = hubServer()
const { at } = assistantScreens(server)
const showing = showingOn(at)

afterEach(() => vi.restoreAllMocks())

function clicks(impl: (this: HTMLAnchorElement) => void) {
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(impl)
}

function saved() {
  return savedWith(clicks).files
}

test('Baixar clica num link preso à página e só solta o endereço do arquivo 40 s depois (K27)', async () => {
  const files = savedWith(clicks)
  showing('grafico.svg', CHART)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.svg' }))
  const baixar = await screen.findByRole('button', { name: 'Baixar' })
  vi.useFakeTimers({ shouldAdvanceTime: true })
  try {
    fireEvent.click(baixar)
    await waitFor(() => expect(files.files).toHaveLength(1))
    expect(files.attached).toEqual([true])
    expect(document.querySelector('a[download]')).toBeNull()
    expect(files.revoked).toEqual([])
    vi.advanceTimersByTime(39_000)
    expect(files.revoked).toEqual([])
    vi.advanceTimersByTime(1_000)
    expect(files.revoked).toEqual(['blob:arquivo'])
  } finally {
    vi.useRealTimers()
  }
})

test('uma imagem que sumiu e o Baixar que falha do mesmo jeito mostram um bloco só (QA F2)', async () => {
  showing('grafico.png', PNG, { file: () => refusal('FILE_NOT_FOUND') })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.png' }))
  fireEvent.error(await screen.findByRole('img', { name: 'grafico.png' }))
  await screen.findByText('Este arquivo não está mais na máquina da conversa.')
  fireEvent.click(screen.getByRole('button', { name: 'Baixar' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Baixar' })).toHaveProperty('disabled', false),
  )
  expect(screen.getAllByText('Este arquivo não está mais na máquina da conversa.')).toHaveLength(1)
  expect(screen.getAllByRole('button', { name: 'Tentar de novo' })).toHaveLength(1)
})

test.each([
  ['FILE_NOT_FOUND', 'Este arquivo não está mais na máquina da conversa.'],
  ['FILE_TOO_LARGE', 'O arquivo passa do tamanho que o Hub entrega.'],
] as const)(
  'Baixar com %s diz a frase da tabela e deixa tentar de novo (F32)',
  async (code, sentence) => {
    const files = saved()
    const sheet: ShownFile = {
      kind: 'FILE',
      path: 'planilha.xlsx',
      name: 'planilha.xlsx',
      media: 'application/vnd.ms-excel',
      bytes: 4096,
    }
    showing('planilha.xlsx', sheet, { file: () => refusal(code) })
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir planilha.xlsx' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Baixar' }))
    expect(await screen.findByText(sentence)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
    expect(files).toHaveLength(0)
  },
)

test('um arquivo de 0 bytes diz que está vazio, sem desenhar imagem (F32)', async () => {
  showing('vazio.png', { ...PNG, path: 'vazio.png', name: 'vazio.png', bytes: 0 })
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir vazio.png' }))
  expect(await screen.findByText('Arquivo vazio.')).toBeTruthy()
  expect(screen.queryByRole('img', { name: 'vazio.png' })).toBeNull()
})

test('enquanto a imagem não chega, o painel mostra o esqueleto "Carregando", e o tira ao desenhar (F32)', async () => {
  showing('grafico.png', PNG)
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir grafico.png' }))
  const image = await screen.findByRole('img', { name: 'grafico.png', hidden: true })
  expect(screen.getByRole('status', { name: 'Carregando' })).toBeTruthy()
  fireEvent.load(image)
  await waitFor(() => expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull())
})
