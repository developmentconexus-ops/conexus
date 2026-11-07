import { expect, test } from 'vitest'
import { sentenceOfCode } from './hub.ts'

test('NOT_IN_ROLE: sem ponto dobrado quando o nome termina em ponto, e a ação manda tirar a ferramenta', () => {
  const sentence = sentenceOfCode('NOT_IN_ROLE', undefined, 'Títulos a receber da empresa 1.')
  expect(sentence).toBe(
    'Seu papel não pode usar a ferramenta Títulos a receber da empresa 1. Peça a quem tem esse acesso para publicar, ou tire a ferramenta.',
  )
})
