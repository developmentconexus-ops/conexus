import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  defaultStabilityErrorProcessors,
  PrefillErrorHandler,
  ProviderHistoryCompat,
  UnsupportedFileHandler,
} from '@mastra/core/processors'
import { stabilityProcessors } from './processors.ts'

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
