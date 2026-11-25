import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { connectionOf, REFUSAL } from './fixtures.ts'
import { Refused } from './said.tsx'
import { nativeText } from './text.ts'

test('um teste recusado por chaves é um alerta só, com a frase das chaves e a resposta do sistema', () => {
  const answer = {
    result: 'AUTH_REFUSED',
    native: REFUSAL,
    connection: connectionOf({ state: 'NEEDS_REAUTH' }),
  } as const
  render(<Refused answer={answer} name="Sankhya" />)
  expect(screen.getAllByRole('alert')).toHaveLength(1)
  expect(screen.getByRole('alert').textContent).toContain(
    'Sankhya respondeu 403, código SEM_ACESSO',
  )
  expect(screen.getByRole('button', { name: 'Ver a resposta inteira' })).toBeTruthy()
})

test('a frase do que o sistema respondeu aceita status nulo, sem inventar número', () => {
  expect(nativeText({ status: 403, code: 'ACESSO', message: 'Sem acesso' }, 'Sankhya')).toBe(
    'Sankhya respondeu 403, código ACESSO: Sem acesso',
  )
  expect(nativeText({ status: null, code: 'X', message: null }, 'Sankhya')).toBe(
    'Sankhya respondeu código X',
  )
  expect(nativeText({ status: null, code: null, message: 'Parou' }, 'Sankhya')).toBe(
    'Sankhya respondeu: Parou',
  )
})
