import { expect, test } from 'vitest'
import { hintText } from './text.ts'

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
