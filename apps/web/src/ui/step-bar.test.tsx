import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StepBar } from './step-bar.tsx'

const STEPS = ['Acesso', 'Testando e lendo', 'O que copiar', 'Quando copiar']

function bar(current: number | null) {
  render(
    <StepBar
      label="Passos"
      steps={STEPS}
      current={current}
      phoneLine={current === null ? 'Ligado' : `Passo ${current + 1} de 4 · ${STEPS[current]}`}
    />,
  )
  return within(screen.getByRole('list', { name: 'Passos' }))
}

test('os passos feitos têm visto, o atual é aria-current="step" e os de depois têm o número', () => {
  const list = bar(2)
  const items = list.getAllByRole('listitem')
  expect(items.map((one) => one.getAttribute('aria-current'))).toEqual([null, null, 'step', null])
  expect(items.map((one) => one.querySelector('svg.lucide-check') !== null)).toEqual([
    true,
    true,
    false,
    false,
  ])
  expect(items[2]?.textContent).toBe('3O que copiar')
  expect(items[3]?.textContent).toBe('4Quando copiar')
})

test('com todos feitos nenhum passo é o atual e todos têm visto', () => {
  const items = bar(null).getAllByRole('listitem')
  expect(items.some((one) => one.hasAttribute('aria-current'))).toBe(false)
  expect(items.every((one) => one.querySelector('svg.lucide-check') !== null)).toBe(true)
})

test('o leitor de tela lê a lista pelo nome e cada passo pelo seu nome; a linha do celular diz o passo', () => {
  bar(1)
  expect(screen.getAllByRole('listitem').map((one) => one.textContent)).toEqual([
    'Acesso',
    '2Testando e lendo',
    '3O que copiar',
    '4Quando copiar',
  ])
  expect(screen.getByText('Passo 2 de 4 · Testando e lendo')).toBeTruthy()
})

test('a barra não é parada de teclado: nenhum botão, link ou campo dentro dela', () => {
  bar(0)
  const root = document.querySelector('[data-slot="step-bar"]')
  expect(root?.querySelectorAll('a, button, input, select, textarea, [tabindex]').length).toBe(0)
})

test('abaixo de sm só a linha do celular aparece e a lista some', () => {
  bar(0)
  expect(screen.getByRole('list', { name: 'Passos' }).className).toContain('max-sm:hidden')
  expect(screen.getByText('Passo 1 de 4 · Acesso').className).toContain('sm:hidden')
})
