import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { MemoryGauge } from './memory-status.tsx'
import { MemoryStatus } from './memory-status.tsx'

const MEMORY: MemoryGauge = {
  pendingTokens: 3_600,
  threshold: 30_000,
  observationTokens: 2_100,
  reflectionThreshold: 40_000,
}

test('um anel com o percentual de pendingTokens/threshold (Critério 15)', () => {
  render(<MemoryStatus memory={MEMORY} />)
  const ring = screen.getByRole('meter', { name: /Mensagens 3,6\/30k, Observações 2,1\/40k/ })
  expect(ring.getAttribute('aria-valuenow')).toBe('12')
  expect(ring.querySelectorAll('svg')).toHaveLength(1)
  expect(screen.getByText('12%').className).toContain('max-md:hidden')
})

test('sem memória o anel está vazio e diz 0% (Critério 15, matriz de estados)', () => {
  render(<MemoryStatus memory={null} />)
  expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('0')
  expect(screen.getByText('0%')).toBeTruthy()
})

test('o anel gira enquanto guarda, observa ou reorganiza (Critério 15)', () => {
  const { rerender } = render(<MemoryStatus memory={MEMORY} />)
  expect(screen.getByRole('meter').querySelector('svg')?.getAttribute('class')).not.toContain(
    'animate-spin',
  )
  for (const omPhase of ['buffering', 'observing', 'reflecting'] as const) {
    rerender(<MemoryStatus memory={MEMORY} omPhase={omPhase} />)
    expect(screen.getByRole('meter').querySelector('svg')?.getAttribute('class')).toContain(
      'animate-spin',
    )
  }
})

test('o clique abre as duas memórias (Critério 16)', async () => {
  render(<MemoryStatus memory={MEMORY} />)
  fireEvent.click(screen.getByRole('meter'))

  expect(await screen.findByText('3,6 de 30k')).toBeTruthy()
  expect(screen.getByText('2,1 de 40k')).toBeTruthy()
  expect(screen.getByText('Mensagens')).toBeTruthy()
  expect(screen.getByText('Memória')).toBeTruthy()
  expect(screen.getByText(/Quando encher, o Builder resume a conversa/)).toBeTruthy()
  expect(screen.getByText(/Quando encher, o Builder junta as observações/)).toBeTruthy()
})

test('marca de falha sem o texto bruto do fornecedor (C48, C51)', () => {
  render(<MemoryStatus memory={MEMORY} failed="observation" />)
  expect(screen.getByLabelText('Falha na memória')).toBeTruthy()
  expect(screen.queryByText(/ECONNRESET|AnthropicError|GoogleGenerativeAIError/)).toBeNull()
})
