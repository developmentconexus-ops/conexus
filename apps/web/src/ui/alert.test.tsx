import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Alert } from './alert.tsx'

test('Alert is read as an alert, in the same size for both tones', () => {
  render(
    <>
      <Alert tone="danger">Não foi possível salvar.</Alert>
      <Alert tone="neutral">Confira os dados.</Alert>
    </>,
  )
  const alerts = screen.getAllByRole('alert')
  expect(alerts.map((a) => a.textContent)).toEqual([
    'Não foi possível salvar.',
    'Confira os dados.',
  ])
  for (const alert of alerts) expect(alert.className).toContain('text-label')
})

test('Alert danger is red and neutral is the body colour', () => {
  render(
    <>
      <Alert tone="danger">a</Alert>
      <Alert tone="neutral">b</Alert>
    </>,
  )
  const [danger, neutral] = screen.getAllByRole('alert')
  expect(danger?.className).toContain('text-danger')
  expect(neutral?.className).toContain('text-text')
  expect(neutral?.className).not.toContain('text-danger')
})
