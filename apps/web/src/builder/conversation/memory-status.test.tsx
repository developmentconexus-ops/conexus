import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { MemoryGauge } from './memory-status.tsx'
import { MemoryStatus } from './memory-status.tsx'

const MEMORY: MemoryGauge = {
  pendingTokens: 14_900,
  threshold: 30_000,
  observationTokens: 2_100,
  reflectionThreshold: 40_000,
}

test('anéis visuais de memória mostram os tokens formatados em pt-BR (Critério 11)', () => {
  render(<MemoryStatus memory={MEMORY} />)
  expect(screen.getByText('14,9/30k')).toBeTruthy()
  expect(screen.getByText('2,1/40k')).toBeTruthy()
})

test('estado inicial com memory null mostra 0/30k (Critério 11, matriz de estados)', () => {
  render(<MemoryStatus memory={null} />)
  expect(screen.getByText('0/30k')).toBeTruthy()
})

test('"Guardando a memória…" enquanto segura o turno em observação (Critério 11)', () => {
  render(<MemoryStatus memory={MEMORY} omPhase="observing" />)
  expect(screen.getByText('Guardando a memória…')).toBeTruthy()
})

test('"Reorganizando a memória…" enquanto segura o turno em reflexão (Critério 11)', () => {
  render(<MemoryStatus memory={MEMORY} omPhase="reflecting" />)
  expect(screen.getByText('Reorganizando a memória…')).toBeTruthy()
})

test('o quadro abre ao clicar no botão e detalha mensagens e memória (Critério 11)', async () => {
  render(<MemoryStatus memory={MEMORY} />)
  const trigger = screen.getByRole('button', { name: /Memória da conversa/ })
  fireEvent.click(trigger)

  expect(await screen.findByText('14,9 de 30k')).toBeTruthy()
  expect(screen.getByText('2,1 de 40k')).toBeTruthy()
  expect(screen.getByText(/Quando encher, o Builder resume a conversa/)).toBeTruthy()
  expect(screen.getByText(/Quando encher, o Builder junta as observações/)).toBeTruthy()
})

test('marca de falha sem o texto bruto do fornecedor (C48, C51, Critério 11)', () => {
  render(<MemoryStatus memory={MEMORY} failed="observation" />)
  expect(screen.getByLabelText('Falha na memória')).toBeTruthy()
  expect(screen.queryByText(/ECONNRESET|AnthropicError|GoogleGenerativeAIError/)).toBeNull()
})
