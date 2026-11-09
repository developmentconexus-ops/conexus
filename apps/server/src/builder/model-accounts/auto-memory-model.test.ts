import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import { autoMemoryModel } from './auto-memory-model.ts'

const GEMINI = ModelId.parse('google/gemini-3.8-flash-high')

test('o Automático da memória: no CLIProxy é o modelo barato que o proxy serve, e nos outros caminhos do Google segue a escolha do Mastra', () => {
  assert.equal(autoMemoryModel(GEMINI, 'google_cliproxy'), 'google/gemini-3.5-flash-lite')
  assert.equal(autoMemoryModel(GEMINI, 'api_key'), 'google/gemini-2.5-flash')
  assert.equal(autoMemoryModel(GEMINI, undefined), 'google/gemini-2.5-flash')
})

test('o Automático da memória: Anthropic e ChatGPT não mudam com o tipo da conta', () => {
  const claude = ModelId.parse('anthropic/claude-sonnet-4-6')
  for (const kind of ['api_key', 'claude_subscription', 'google_cliproxy'] as const) {
    assert.equal(autoMemoryModel(claude, kind), 'anthropic/claude-haiku-5-5')
  }
  const gpt = ModelId.parse('openai/gpt-5.2')
  assert.equal(autoMemoryModel(gpt, 'openai_codex'), autoMemoryModel(gpt, 'api_key'))
})
