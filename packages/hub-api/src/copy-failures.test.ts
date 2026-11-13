import assert from 'node:assert/strict'
import { test } from 'node:test'
import { COPY_FAILURES } from './copy-failures.ts'

test('a recusa da coluna de documento diz o motivo e o caminho', () => {
  const refusal = COPY_FAILURES.COPY_PERSONAL_NOT_KEPT
  assert.equal(
    `${refusal.phrase} ${refusal.action}`,
    'Uma cópia não guarda Documento. Tire essa coluna da cópia; o app que precisa dele lê direto do sistema.',
  )
})
