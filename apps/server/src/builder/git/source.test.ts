import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { call, codeOf, personOn } from '../../hub/identity/test-hub.ts'
import { asked, conversing, title } from '../conversation/test-conversation.ts'
import { openRepository } from './public.ts'

// The test machine is a folder, whose app is the `app` inside it.
const COMMAND = [
  'cd app',
  `printf 'a\\0b' > b.bin`,
  `head -c 1100000 /dev/zero | tr '\\0' x > big.txt`,
].join('; ')

function writesThree() {
  let step = 0
  return (call: Parameters<typeof title>[0]) => {
    if (title(call) !== undefined) return { kind: 'text' as const, text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text' as const, text: 'Pronto.' }
    const write = { path: 'a.ts', content: 'x\n' }
    return {
      kind: 'blocks' as const,
      blocks: [
        { type: 'tool_use' as const, name: 'mastra_workspace_write_file', input: write },
        {
          type: 'tool_use' as const,
          name: 'mastra_workspace_execute_command',
          input: { command: COMMAND },
        },
      ],
    }
  }
}

test('a aba Código lê o main: vazio antes da primeira versão; depois, arquivos, texto, e as recusas', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, writesThree())
  const source = `/api/companies/${companyId}/projects/${projectId}/source`
  const before = await call(hub, ana, 'GET', source)
  assert.equal(before.statusCode, 200)
  assert.equal(Object(before.json()).version, 0)
  assert.deepEqual(Object(before.json()).files, [])
  assert.equal(Object(before.json()).commit, null)
  assert.equal(Object(before.json()).savedAt, null)
  // A read makes no repository: only the first turn's seed does.
  assert.equal(existsSync(join(hub.config.gitRoot, companyId, `${projectId}.git`)), false)

  await asked(t, { hub, person: ana, conversations })
  const read = await call(hub, ana, 'GET', source)
  const { version, commit, files } = Object(read.json())
  assert.equal(version, 1)
  // The versions stand on the starter: its files are there beside the turn's three.
  const paths = files.map((each: { path: string }) => each.path)
  assert.deepEqual(
    files.filter((each: { path: string }) => /^[ab]\.|^big/.test(each.path)),
    [
      { path: 'a.ts', bytes: 2 },
      { path: 'b.bin', bytes: 3 },
      { path: 'big.txt', bytes: 1_100_000 },
    ],
  )
  assert.ok(paths.includes('src/main.tsx') && paths.includes('package.json'))

  function file(path: string, at = commit) {
    return call(hub, ana, 'GET', `${source}/file?commit=${at}&path=${encodeURIComponent(path)}`)
  }
  assert.equal(Object((await file('a.ts')).json()).text, 'x\n')
  const binary = await file('b.bin')
  assert.deepEqual([binary.statusCode, codeOf(binary)], [422, 'SOURCE_FILE_NOT_TEXT'])
  const large = await file('big.txt')
  assert.deepEqual([large.statusCode, codeOf(large)], [422, 'SOURCE_FILE_NOT_TEXT'])
  const absent = await file('nada.ts')
  assert.deepEqual([absent.statusCode, codeOf(absent)], [404, 'SOURCE_FILE_NOT_FOUND'])
  const outside = await file('a.ts', 'a'.repeat(40))
  assert.deepEqual([outside.statusCode, codeOf(outside)], [404, 'SOURCE_FILE_NOT_FOUND'])
  const traversal = await file('../a.ts')
  assert.equal(traversal.statusCode, 404)

  const stranger = await personOn(hub, {
    name: 'Olga Souza',
    email: 'olga@example.test',
    role: 'user',
  })
  for (const url of [source, `${source}/file?commit=${commit}&path=a.ts`]) {
    const refused = await call(hub, stranger, 'GET', url)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'NOT_FOUND'])
  }
})

test('um repositório que só tem o commit do starter responde como sem versão', async (t) => {
  const { hub, ana, companyId, projectId } = await conversing(t, writesThree())
  const source = `/api/companies/${companyId}/projects/${projectId}/source`
  const silent = { info: () => undefined, error: () => undefined }
  const empty = await openRepository({
    root: hub.config.gitRoot,
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
    log: silent,
  }).ensure()
  const read = await call(hub, ana, 'GET', source)
  assert.equal(read.statusCode, 200)
  assert.deepEqual(read.json(), { version: 0, commit: null, savedAt: null, files: [] })
  const file = await call(hub, ana, 'GET', `${source}/file?commit=${empty}&path=a.ts`)
  assert.deepEqual([file.statusCode, codeOf(file)], [404, 'SOURCE_FILE_NOT_FOUND'])
})
