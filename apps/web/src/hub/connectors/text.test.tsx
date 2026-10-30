import { expect, test } from 'vitest'
import { busyText, reasonText } from './text.ts'

test('a causa de um 2xx que não leu: onde e que tipo veio, ou o tamanho', () => {
  expect(
    reasonText({
      kind: 'SHAPE',
      issues: [
        { path: 'data', expected: 'array', received: 'object' },
        { path: '', expected: 'json', received: 'text' },
      ],
    }),
  ).toBe('data: esperava lista, veio objeto; A resposta: esperava JSON, veio texto')
  expect(reasonText({ kind: 'TOO_LARGE', limitBytes: 2 * 1024 * 1024 })).toBe(
    'Resposta acima de 2 MB',
  )
})

test('o fornecedor pediu para esperar: a espera em segundos ou minutos, e sem espera diz que são alguns minutos', () => {
  expect(busyText('Mercado Livre', 1_200)).toBe(
    'O Mercado Livre pediu para esperar 2 segundos. Tente de novo depois disso.',
  )
  expect(busyText('Mercado Livre', 50)).toBe(
    'O Mercado Livre pediu para esperar 1 segundo. Tente de novo depois disso.',
  )
  expect(busyText('Mercado Livre', 90_000)).toBe(
    'O Mercado Livre pediu para esperar 2 minutos. Tente de novo depois disso.',
  )
  expect(busyText('Mercado Livre', null)).toBe(
    'O Mercado Livre pediu para esperar. Tente de novo em alguns minutos.',
  )
})
