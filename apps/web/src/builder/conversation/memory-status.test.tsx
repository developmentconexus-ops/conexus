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
  const trigger = screen.getByRole('button', {
    name: 'Memória da conversa: Mensagens 12%, 3,6/30k, Memória 2,1/40k',
  })
  expect(trigger.querySelectorAll('svg')).toHaveLength(1)
})

test('sem memória o anel está vazio e diz 0% (Critério 15, matriz de estados)', () => {
  render(<MemoryStatus memory={null} />)
  expect(screen.getByRole('button', { name: /Mensagens 0%/ })).toBeTruthy()
  expect(screen.getByText('0%')).toBeTruthy()
})

test('o anel não gira: enquanto observa ou reorganiza a luz corre sobre o arco (Critério 15)', () => {
  const { rerender } = render(<MemoryStatus memory={MEMORY} />)
  function ring() {
    return screen.getByRole('button').querySelector('svg')
  }
  expect(ring()?.hasAttribute('data-working')).toBe(false)
  for (const omPhase of ['observing', 'reflecting'] as const) {
    rerender(<MemoryStatus memory={MEMORY} omPhase={omPhase} />)
    expect(ring()?.hasAttribute('data-working')).toBe(true)
  }
})

test('cada memória mostra sua barra cheia até o percentual usado (Critério 16)', async () => {
  render(<MemoryStatus memory={MEMORY} />)
  fireEvent.click(screen.getByRole('button'))
  await screen.findByText('3,6 de 30k')
  const values = screen.getAllByRole('meter').map((m) => m.getAttribute('aria-valuenow'))
  expect(values).toEqual(['12', '5.25'])
  const meter = screen.getByRole('meter', { name: 'Mensagens' })
  expect(meter.hasAttribute('aria-label')).toBe(false)
  expect(document.getElementById(meter.getAttribute('aria-labelledby') ?? '')?.textContent).toBe(
    'Mensagens',
  )
})

test('o clique abre as duas memórias (Critério 16)', async () => {
  render(<MemoryStatus memory={MEMORY} />)
  fireEvent.click(screen.getByRole('button'))

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
