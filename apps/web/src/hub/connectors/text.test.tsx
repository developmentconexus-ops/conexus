import { expect, test } from 'vitest'
import { reasonText } from './text.ts'

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
