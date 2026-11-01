import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ASSISTANT_FILE, assistantFilePath } from './assistant.ts'

test('o endereço do arquivo vem da rota que o servidor registra, com os ids e o caminho codificados', () => {
  const ids = { companyId: 'c1', conversationId: 'v1', path: 'a b/ç.png' }
  assert.equal(
    assistantFilePath(ids),
    `${ASSISTANT_FILE.url.replace(':companyId', 'c1').replace(':conversationId', 'v1')}?path=a+b%2F%C3%A7.png`,
  )
  const odd = assistantFilePath({ ...ids, companyId: 'c/../x' })
  assert.ok(odd.startsWith('/api/companies/c%2F..%2Fx/assistant/conversations/v1/files?'))
})
