import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SandboxFilesystem } from './filesystem.ts'

test('a frase diz a regra dos caminhos', () => {
  const base = '/home/user/work'
  const files = new SandboxFilesystem({
    sandbox: {
      id: 'sb-1',
      executeCommand: async () => {
        throw new Error('the phrase runs no command')
      },
    },
    workdir: base,
  })
  const told = files.getInstructions()
  assert.match(told, /relative to \/home\/user\/work, or absolute paths under it/)
  assert.ok(told.includes('(/tmp/x becomes /home/user/work/tmp/x)'))
  assert.ok(!told.includes('/src/index.ts'))
})
