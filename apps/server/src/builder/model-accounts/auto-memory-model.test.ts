import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import { autoMemoryModel } from './auto-memory-model.ts'
import { GROQ_MODEL } from './test-defaults.ts'

test('Automatic on Anthropic is the Haiku the picker lists, not Mastra’s older pick', () => {
  assert.equal(
    autoMemoryModel(ModelId.parse('anthropic/claude-sonnet-5-5')),
    'anthropic/claude-haiku-5-5',
  )
})

test('Automatic on a provider Mastra knows is that provider’s cheap model, when the picker lists it', () => {
  const pick = autoMemoryModel(ModelId.parse('openai/gpt-5'))
  assert.ok(pick === null || pick.startsWith('openai/'), String(pick))
})

test('Automatic on a provider Mastra does not know is the conversation’s own model', () => {
  assert.equal(autoMemoryModel(GROQ_MODEL), GROQ_MODEL)
})
