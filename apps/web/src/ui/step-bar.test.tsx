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
      doneLabel="feito"
      phoneLine={current === null ? 'Ligado' : `Passo ${current + 1} de 4 · ${STEPS[current]}`}
    />,
  )
  return within(screen.getByRole('list', { name: 'Passos' }))
}

/** What a screen reader reads of each step: its name, and "feito" after a step that is done. */
function heard(list: ReturnType<typeof bar>) {
  return list.getAllByRole('listitem').map((one) => ({
    name: STEPS.find((step) => within(one).queryByText(step) !== null),
    done: within(one).queryByText(', feito') !== null,
    number: within(one).queryByText(/^\d$/)?.textContent ?? null,
    current: one.getAttribute('aria-current'),
  }))
}

test('o passo feito diz "feito", o atual é o passo atual e os de depois têm o número', () => {
  expect(heard(bar(2))).toEqual([
    { name: 'Acesso', done: true, number: null, current: null },
    { name: 'Testando e lendo', done: true, number: null, current: null },
    { name: 'O que copiar', done: false, number: '3', current: 'step' },
    { name: 'Quando copiar', done: false, number: '4', current: null },
  ])
})

test('com todos feitos nenhum passo é o atual e todos dizem "feito"', () => {
  const steps = heard(bar(null))
  expect(steps.map((one) => one.done)).toEqual([true, true, true, true])
  expect(steps.map((one) => one.current)).toEqual([null, null, null, null])
})

test('a linha do celular diz o passo em que a pessoa está', () => {
  bar(1)
  expect(screen.getByText('Passo 2 de 4 · Testando e lendo')).toBeTruthy()
})

test('a barra não é parada de teclado: nenhum botão, link ou campo dentro dela', () => {
  const list = bar(0)
  expect(list.queryAllByRole('button')).toEqual([])
  expect(list.queryAllByRole('link')).toEqual([])
  expect(list.queryAllByRole('textbox')).toEqual([])
})
