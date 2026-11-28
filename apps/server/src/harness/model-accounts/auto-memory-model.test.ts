import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import { autoMemoryModel } from './public.ts'

const GEMINI = ModelId.parse('google/gemini-3.8-flash-high')

test('o Automático da memória: no Google, pelo CLIProxy ou por chave, é o modelo barato vivo, não o que o Mastra aposentou', () => {
  assert.equal(autoMemoryModel(GEMINI), 'google/gemini-3.5-flash-lite')
})

test('o Automático da memória: a Anthropic usa o Haiku do seletor', () => {
  const claude = ModelId.parse('anthropic/claude-sonnet-4-6')
  assert.equal(autoMemoryModel(claude), 'anthropic/claude-haiku-5-5')
})
