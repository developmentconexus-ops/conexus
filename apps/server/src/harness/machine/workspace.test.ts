import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { LocalFilesystem, WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { NEVER_ASKS } from '../spec/public.ts'
import { SandboxFilesystem } from './sandbox-filesystem/filesystem.ts'
import { workspaceOf } from './workspace.ts'

function over(t: TestContext, parts: { neverAsks: boolean; readMedia?: readonly string[] }) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-workspace-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const filesystem = new SandboxFilesystem({
    sandbox: {
      id: 'machine',
      filesystem: new LocalFilesystem({ basePath: folder }),
      executeCommand: async () => ({ exitCode: 0, stdout: '', stderr: '' }),
    },
    workdir: folder,
  })
  return workspaceOf({
    name: 'conexus-machine',
    ensure: async () => {
      throw new Error('the config is read, no tool runs')
    },
    instructions: () => 'told',
    filesystem,
    ...parts,
  })
}

test('o Computador da conversa nunca pergunta, o do Construtor de apps não diz nada, e os dois tiram o AST e pedem descrição do comando', (t) => {
  const conversation = over(t, { neverAsks: true }).getToolsConfig()
  assert.equal(conversation?.requireApproval, NEVER_ASKS)
  const builder = over(t, { neverAsks: false }).getToolsConfig()
  assert.equal(builder?.requireApproval, undefined)
  for (const config of [conversation, builder]) {
    assert.deepEqual(config?.[WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT], { enabled: false })
    assert.deepEqual(config?.[WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND], {
      requireDescription: true,
    })
  }
})

test('os tipos de mídia de read_file só entram quando a conversa os diz', (t) => {
  const none = over(t, { neverAsks: true }).getToolsConfig()
  assert.equal(none?.[WORKSPACE_TOOLS.FILESYSTEM.READ_FILE], undefined)
  const some = over(t, { neverAsks: true, readMedia: ['image/png'] }).getToolsConfig()
  assert.deepEqual(some?.[WORKSPACE_TOOLS.FILESYSTEM.READ_FILE], { mediaTypes: ['image/png'] })
})
