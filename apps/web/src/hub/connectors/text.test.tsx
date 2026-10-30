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

test('só o status 403 manda liberar a tela; um 400 ou 404 recusado diz que o erro é do Sankhya', () => {
  expect(hintText(refused(403), 'Sankhya', 'client_credentials')).toBe(
    'O usuário de integração não tem acesso a esta parte. Libere a tela no Sankhya e teste de novo.',
  )
  const providerError =
    'O Sankhya deu erro nesta leitura; não é falta de acesso. Os apps leem estes dados pela porta de leitura.'
  expect(hintText(refused(400), 'Sankhya', 'client_credentials')).toBe(providerError)
  expect(hintText(refused(404), 'Sankhya', 'client_credentials')).toBe(providerError)
  expect(hintText(refused(401), 'Sankhya', 'client_credentials')).toBe('')
  expect(hintText(refused(400), 'Mercado Livre', 'oauth2_code')).toBe('')
})

test('com OAuth a dica de 403 é do app do Conexus, sem frase do Sankhya', () => {
  expect(hintText(refused(403), 'Mercado Livre', 'oauth2_code')).toBe(
    'O app do Conexus não tem permissão para esta parte no Mercado Livre.',
  )
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
