import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Alert } from './alert.tsx'

test('Alert is read as an alert, in the label size and red', () => {
  render(<Alert tone="danger">Não foi possível salvar.</Alert>)
  const alert = screen.getByRole('alert')
  expect(alert.textContent).toBe('Não foi possível salvar.')
  expect(alert.className).toContain('text-label')
  expect(alert.className).toContain('text-danger')
})

test('Alert has only the danger tone', () => {
  // @ts-expect-error neutral was removed: the type fails to compile if the tone comes back
  render(<Alert tone="neutral">Confira os dados.</Alert>)
  expect(screen.getByRole('alert').className).not.toContain('text-text')
})
