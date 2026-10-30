import { expect, test } from 'vitest'
import { hintText, reasonText } from './text.ts'

function refused(status: number) {
  return [
    {
      id: 'empresas',
      label: 'Empresas',
      subject: 'Cadastros',
      outcome: 'REFUSED' as const,
      native: { status, code: null },
    },
  ]
}

test('só o status 403 manda liberar a tela; um 404 recusado não', () => {
  expect(hintText(refused(403), 'Sankhya')).toBe(
    'O usuário de integração não tem acesso a esta parte. Libere a tela no Sankhya e teste de novo.',
  )
  expect(hintText(refused(404), 'Sankhya')).toBe('')
})

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
