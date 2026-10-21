import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { masked } from './mask.ts'
import { asked, conversing, title } from './test-conversation.ts'

const PASSWORD = 'S3nhaForte!'
const PHRASES = [
  'curl -H "Authorization: Bearer abcd1234efgh5678" https://erp.example.com',
  'psql --password hunter2pass -h db',
  'curl -u admin:S3nhaForte! https://erp.example.com',
  'mysql -pS3nhaForte! -u root',
  'export DB_PASS=S3nhaForte!',
  'PGPASSWORD=S3nhaForte! psql -h db',
]
const LEAKS = ['abcd1234efgh5678', 'hunter2pass', PASSWORD]

test('a máscara cobre a forma Bearer, --password, -p colado, -u usuário:senha e nomes terminados em _PASS', () => {
  for (const phrase of PHRASES) {
    const safe = masked(phrase)
    for (const leak of LEAKS) assert.equal(safe.includes(leak), false, `${phrase} -> ${safe}`)
    assert.ok(safe.includes('***'), safe)
  }
  assert.equal(masked('mysql -u root -h db'), 'mysql -u root -h db')
  assert.equal(masked('ls -la --all'), 'ls -la --all')
})

test('segredo no comando e na saída: mascarado no stream e no run_event, em cada forma', async (t) => {
  const command = PHRASES.map((phrase) => `echo '${phrase}'`).join('; ')
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    return {
      kind: 'blocks',
      blocks: [{ type: 'tool_use', name: 'mastra_workspace_execute_command', input: { command } }],
    }
  })
  const { events } = await asked(t, { hub, person: ana, conversations })
  const stream = JSON.stringify(events satisfies ConversationEvent[])
  const journal = JSON.stringify(await hub.test.asOwner('select event from builder.run_event'))
  for (const leak of LEAKS) {
    assert.equal(stream.includes(leak), false, `stream: ${leak}`)
    assert.equal(journal.includes(leak), false, `run_event: ${leak}`)
  }
})
