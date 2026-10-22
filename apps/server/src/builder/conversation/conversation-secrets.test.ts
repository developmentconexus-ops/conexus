import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
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
// Joined here so the file holds no string a secret scanner would take for a real token.
const PREFIXED = [
  ['glpat', '-xYz1234567890abcdefg'],
  ['ghs', '_16C7e42F292c6912E7710c838347Ae178B4a'],
  ['npm', '_a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ'],
  ['AIza', 'SyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q'],
].map(([prefix, rest]) => `${prefix}${rest}`)
const LEAKS = ['abcd1234efgh5678', 'hunter2pass', PASSWORD, ...PREFIXED]
/**
 * Output with no secret, which the mask leaves as it is: what a person reads to see what was
 * saved (a commit, a tree, an `integrity`, a path) is as long as a key and is not one.
 */
const PLAIN = [
  'mysql -u root -h db',
  'ls -la --all',
  'commit fa2dba17c04b29b5ab2f9ee6f6b6fdb3b5e0d5d1',
  '100644 blob 997f430a4a5dd6e2b9f8c1ac0d8a5b6e2ac4f7d1',
  'integrity sha512-Jd3yQ8h0o4cT7lZbXa2eKfVnU1sPqRm9wYxN5tLg6BvH8uCiDzAe0oS4kFrWjEG3pMh1nQdTy7XcVb2LaZ9uw==',
  'src/builder/conversation/some-long-directory/another-long-directory-name/mask.test.ts',
]

test('segredo no comando e na saída: mascarado no stream e no run_event em cada forma (Bearer, --password, -p, -u usuário:senha, _PASS), e um comando sem segredo intacto', async (t) => {
  const command = [...PHRASES, ...PREFIXED.map((token) => `using ${token}`), ...PLAIN]
    .map((phrase) => `echo '${phrase}'`)
    .join('; ')
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
  for (const plain of PLAIN) assert.ok(stream.includes(plain), `stream: ${plain}`)
})
