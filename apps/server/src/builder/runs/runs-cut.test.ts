import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { conversing, sent, started, streamOf, title } from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { INSTALLATION } from '../machine/test-machine.ts'

const WRITE = 'mastra_workspace_write_file'

function writing(path: string, content: string) {
  return { name: WRITE, input: { path, content } }
}

function repositoryOf({ hub, companyId, projectId }: Awaited<ReturnType<typeof conversing>>) {
  return hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
}

/** Two turns of one conversation, `between` run while the machine rests after the first. */
async function twoTurns(
  t: Parameters<typeof conversing>[0],
  between: (where: { app: string; name: string; git: (...args: string[]) => string }) => void,
) {
  const turns = [writing('src/a.ts', 'um\n'), writing('src/b.ts', 'dois\n')]
  let step = 0
  const world = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    const tool = step % 2 === 1 ? turns[(step - 1) / 2] : undefined
    if (tool === undefined) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', ...tool }] }
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
  between({ app: join(hub.builder.folder, 'app'), name, git })
  hub.builder.control.discoverable = [name]
  assert.equal((await sent(hub, ana, url, 'Segunda')).statusCode, 200)
  const second = await stream.turn()
  assert.deepEqual(failuresOf([...first, ...second]), [])
  const repository = repositoryOf(world)
  return { ...world, repository, git }
}

test('o processo morreu no meio do turno: o turno seguinte guarda os arquivos como uma versão marcada, antes de trabalhar, e segue sobre eles', async (t) => {
  const { hub, repository, git } = await twoTurns(t, ({ app }) => {
    // What a dead process leaves: a file no save took, and the seed's mark never taken off.
    writeFileSync(join(app, 'src/cut.ts'), 'meio\n')
    writeFileSync(join(app, '.git/conexus-turn-open'), '')
  })
  assert.equal(await repository.version(), 3, 'a, the cut turn kept, then b')
  function paths(revision: string) {
    return git('ls-tree', '-r', '--name-only', revision).split('\n')
  }
  assert.ok(paths('main~1').includes('src/cut.ts') && !paths('main~1').includes('src/b.ts'))
  assert.ok(paths('main').includes('src/cut.ts') && paths('main').includes('src/b.ts'))
  assert.equal(git('log', '-1', '--format=%s', 'main~1').trim(), 'Conexus Builder (turn cut)')
  assert.equal(git('log', '-1', '--format=%s', 'main').trim(), 'Conexus Builder')
  assert.ok(hub.lines.some((line) => line.message === 'CUT_TURN_KEPT'))
  assert.equal(
    existsSync(join(hub.builder.folder, 'app/.git/conexus-turn-open')),
    false,
    'the new turn ended, so the mark is off',
  )
})

test('o turno anterior terminou: o seguinte começa do main como sempre, sem guardar o que sobrou na máquina', async (t) => {
  const { hub, repository, git } = await twoTurns(t, ({ app }) => {
    writeFileSync(join(app, 'src/stray.ts'), 'sobra\n')
  })
  assert.equal(await repository.version(), 2)
  assert.equal(git('ls-tree', '-r', '--name-only', 'main').includes('src/stray.ts'), false)
  assert.equal(
    hub.lines.some((line) => line.message === 'CUT_TURN_KEPT'),
    false,
  )
})

test('o processo morreu e outra conversa do Projeto moveu o main enquanto a máquina descansava: o turno seguinte registra a perda e funciona', async (t) => {
  const { repository, git } = await twoTurns(t, ({ app, git }) => {
    writeFileSync(join(app, 'src/cut.ts'), 'meio\n')
    writeFileSync(join(app, '.git/conexus-turn-open'), '')
    // Another conversation saved a version: `main` is a commit the machine never received.
    const main = git('rev-parse', 'main').trim()
    const tree = git('rev-parse', 'main^{tree}').trim()
    const moved = git(
      ...['-c', 'user.name=Outra', '-c', 'user.email=outra@conexus.invalid'],
      ...['commit-tree', tree, '-p', main, '-m', 'outra conversa'],
    ).trim()
    git('update-ref', 'refs/heads/main', moved, main)
  })
  assert.equal(
    await repository.version(),
    3,
    'a, the other conversation, then b (the cut tree is lost, the turn works)',
  )
  assert.equal(git('ls-tree', '-r', '--name-only', 'main').includes('src/cut.ts'), false)
  assert.ok(git('ls-tree', '-r', '--name-only', 'main').includes('src/b.ts'))
})
