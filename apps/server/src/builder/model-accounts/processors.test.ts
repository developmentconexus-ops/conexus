import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ModelId } from '@conexus/hub-api'
import {
  defaultStabilityErrorProcessors,
  PrefillErrorHandler,
  ProviderHistoryCompat,
  UnsupportedFileHandler,
} from '@mastra/core/processors'
import { minusProviderTools, stabilityProcessors } from './public.ts'

test('os padrões de estabilidade do Mastra seguem na ordem deles: o de prefill e o de arquivo recusado ficam os do Mastra, e só o de histórico ganha a regra nossa', () => {
  const ours = stabilityProcessors()
  const native = defaultStabilityErrorProcessors({
    retryUnknownErrors: true,
    retryBadRequests: true,
  })
  assert.deepEqual(
    ours.map((processor) => processor.id),
    native.map((processor) => processor.id),
  )
  for (const [index, processor] of ours.entries()) {
    const kind = native[index]?.constructor
    if (kind === PrefillErrorHandler || kind === UnsupportedFileHandler)
      assert.ok(processor instanceof kind, `${processor.id} stays Mastra's own`)
    if (kind === ProviderHistoryCompat)
      assert.ok(processor instanceof ProviderHistoryCompat, 'the history rules stay')
  }
  assert.equal(ours.filter((processor) => processor instanceof PrefillErrorHandler).length, 1)
  assert.equal(ours.filter((processor) => processor instanceof UnsupportedFileHandler).length, 1)
  assert.equal(ours.filter((processor) => processor instanceof ProviderHistoryCompat).length, 1)
})

test('a troca de modelo tira a busca e a leitura de página', () => {
  const active = ['web_search', 'web_fetch', 'recall']
  assert.deepEqual(minusProviderTools(active, ModelId.parse('anthropic/claude-sonnet-4-6')), [
    'recall',
  ])
  for (const other of ['openai/gpt-5', 'xai/grok-4', 'google/gemini-2.5-pro'])
    assert.deepEqual(
      minusProviderTools(active, ModelId.parse(other)),
      ['web_fetch', 'recall'],
      other,
    )
})
