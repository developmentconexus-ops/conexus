import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Sent } from '../../platform/test-anthropic.ts'
import { conversing, sent, started, streamOf, title } from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { INSTALLATION, moveMain } from '../machine/test-machine.ts'

type Tool = { name: string; input: Record<string, string> }

function writing(path: string, content: string): Tool {
  return { name: 'mastra_workspace_write_file', input: { path, content } }
}

function repositoryOf({ hub, companyId, projectId }: Awaited<ReturnType<typeof conversing>>) {
  return hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
}

type Between = { app: string; dir: string; git: (...args: string[]) => string }

/**
 * Two turns of one conversation, each its tools then a text, `between` run while the machine rests
 * after the first; the calls of the second turn are kept.
 */
async function twoTurns(
  t: Parameters<typeof conversing>[0],
  between: (where: Between) => void,
  turns: { first: Tool[]; second: Tool[] } = {
    first: [writing('src/a.ts', 'um\n')],
    second: [writing('src/b.ts', 'dois\n')],
  },
) {
  const script: (Tool | 'end')[] = [...turns.first, 'end', ...turns.second, 'end']
  const seen: Sent[] = []
  const world = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    seen.push(call)
    const next = script.shift()
    if (next === undefined || next === 'end') return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', ...next }] }
  })
  const { hub, ana, conversations } = world
  const id = await started(hub, ana, conversations)
  const url = `${conversations}/${id}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Primeira')).statusCode, 200)
  const first = await stream.turn()
  const name = `conexus-${INSTALLATION}-${id}`
  const dir = join(hub.config.gitRoot, world.companyId, `${world.projectId}.git`)
  function git(...args: string[]) {
    return execFileSync('git', ['--git-dir', dir, ...args]).toString()
  }
  between({ app: join(hub.builder.folder, 'app'), dir, git })
  seen.length = 0
  hub.builder.control.discoverable = [name]
  assert.equal((await sent(hub, ana, url, 'Segunda')).statusCode, 200)
  const second = await stream.turn()
  assert.deepEqual(failuresOf([...first, ...second]), [])
  return { ...world, repository: repositoryOf(world), git, seen }
}

function paths(git: Between['git'], revision: string) {
  return git('ls-tree', '-r', '--name-only', revision).split('\n')
}

test('o processo morreu no meio do turno: o turno seguinte acha a máquina com os arquivos, e a versão dele os leva', async (t) => {
  const { hub, repository, git } = await twoTurns(t, ({ app }) => {
    // What a dead process leaves: a file no save took, and no end that put the folder back.
    writeFileSync(join(app, 'src/cut.ts'), 'meio\n')
  })
  assert.equal(await repository.version(), 2, 'a, then b with the cut turn')
  assert.ok(!paths(git, 'main~1').includes('src/cut.ts'))
  assert.ok(paths(git, 'main').includes('src/cut.ts') && paths(git, 'main').includes('src/b.ts'))
  assert.equal(
    hub.lines.some((line) => line.message === 'MACHINE_CONFLICTS'),
    false,
  )
})

test('o processo morreu e outra conversa do Projeto moveu o main enquanto a máquina descansava: o main traz as duas, e o turno cortado fica', async (t) => {
  const { repository, git } = await twoTurns(t, ({ app, dir }) => {
    writeFileSync(join(app, 'src/cut.ts'), 'meio\n')
    moveMain(dir, 'src/outra.ts', 'outra\n')
  })
  assert.equal(await repository.version(), 3, 'a, the other conversation, then b with the cut')
  const main = paths(git, 'main')
  for (const path of ['src/a.ts', 'src/outra.ts', 'src/cut.ts', 'src/b.ts'])
    assert.ok(main.includes(path), path)
})

test('o turno cortado e outra conversa mudaram a mesma linha: o Builder lê as marcas do conflito, e as instruções dele nomeiam o arquivo', async (t) => {
  const reading = { name: 'mastra_workspace_read_file', input: { path: 'src/s.ts' } }
  const { repository, git, seen } = await twoTurns(
    t,
    ({ app, dir }) => {
      writeFileSync(join(app, 'src/s.ts'), 'meio\n')
      moveMain(dir, 'src/s.ts', 'outra\n')
    },
    { first: [writing('src/s.ts', 'um\n')], second: [reading] },
  )
  const after = seen.at(-1)
  assert.ok(after)
  assert.match(after.system, /conflict markers; resolve them before any other change: `src\/s\.ts`/)
  assert.ok(after.texts.some((text) => /<<<<<<<[\s\S]*outra[\s\S]*=======[\s\S]*meio/.test(text)))
  assert.equal(await repository.version(), 3, 'one, the other conversation, then the merge')
  assert.match(git('show', 'main:src/s.ts'), /outra[\s\S]*meio/)
})

test('o processo morreu depois de mover o main e antes de a máquina saber: o turno seguinte não guarda uma versão vazia', async (t) => {
  const { repository, git } = await twoTurns(t, ({ app, git }) => {
    // The save moved `main` and the process died before telling the machine its new base.
    const starter = git('rev-parse', 'main~1').trim()
    execFileSync('git', ['-C', app, 'update-ref', 'refs/conexus/base', starter])
  })
  assert.equal(await repository.version(), 2, 'a, then b, and nothing between them')
  assert.ok(paths(git, 'main~1').includes('src/a.ts') && !paths(git, 'main~1').includes('src/b.ts'))
})
