import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { moveMain, pausedByE2b } from '../../../harness/machine/test-machine.ts'
import {
  conversing,
  sent,
  started,
  streamOf,
  title,
} from '../../../harness/routes/test-conversation.ts'
import { failuresOf } from '../../../harness/routes/test-parts.ts'
import type { Sent } from '../../../platform/test-anthropic.ts'

type Tool = { name: string; input: Record<string, string> }

function writing(path: string, content: string): Tool {
  return { name: 'mastra_workspace_write_file', input: { path, content } }
}

function command(description: string, line: string): Tool {
  return { name: 'mastra_workspace_execute_command', input: { description, command: line } }
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
  failures: string[] = [],
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
  const dir = join(hub.config.gitRoot, world.companyId, `${world.projectId}.git`)
  function git(...args: string[]) {
    return execFileSync('git', ['--git-dir', dir, ...args]).toString()
  }
  between({ app: join(hub.builder.folder, 'app'), dir, git })
  seen.length = 0
  pausedByE2b(hub.builder.control)
  assert.equal((await sent(hub, ana, url, 'Segunda')).statusCode, 200)
  const second = await stream.turn()
  assert.deepEqual(failuresOf([...first, ...second]), failures)
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

test('a conversa guardou um arquivo e outra conversa o apagou: o turno seguinte da primeira não o traz de volta, nem o guarda de novo', async (t) => {
  const { repository, git, hub } = await twoTurns(t, ({ dir }) => {
    moveMain(dir, 'src/a.ts', null)
  })
  assert.equal(await repository.version(), 3, 'a, the deletion by the other conversation, then b')
  assert.ok(!paths(git, 'main').includes('src/a.ts'), 'the other conversation deleted it')
  assert.ok(paths(git, 'main').includes('src/b.ts'))
  assert.equal(
    hub.lines.some((line) => line.message === 'MACHINE_CONFLICTS'),
    false,
  )
})

test('a conversa guardou uma linha e outra conversa a mudou depois: o turno seguinte da primeira não recebe conflito, e o main guarda a linha da outra', async (t) => {
  const reading = { name: 'mastra_workspace_read_file', input: { path: 'src/s.ts' } }
  const { repository, git, seen, hub } = await twoTurns(
    t,
    ({ dir }) => moveMain(dir, 'src/s.ts', 'outra\n'),
    { first: [writing('src/s.ts', 'um\n')], second: [reading] },
  )
  const after = seen.at(-1)
  assert.ok(after)
  assert.doesNotMatch(after.system, /conflict markers; resolve them/)
  assert.ok(after.texts.some((text) => text.includes('outra')))
  assert.ok(!after.texts.some((text) => text.includes('<<<<<<<')))
  assert.equal(git('show', 'main:src/s.ts'), 'outra\n')
  assert.equal(await repository.version(), 2, 'one, then the other conversation: nothing unsaved')
  assert.equal(
    hub.lines.some((line) => line.message === 'MACHINE_CONFLICTS'),
    false,
  )
})

test('o guardar falhou numa máquina viva: o turno seguinte ainda tem o trabalho, e a versão dele o leva', async (t) => {
  function command(line: string): Tool {
    return {
      name: 'mastra_workspace_execute_command',
      input: { description: 'Rodando um teste', command: line },
    }
  }
  const { repository, git } = await twoTurns(
    t,
    () => undefined,
    {
      // A directory where the save's index lock goes: the collect fails with the machine up and the files in place.
      first: [writing('src/a.ts', 'um\n'), command('mkdir .git/conexus-index.lock')],
      second: [command('rmdir .git/conexus-index.lock'), writing('src/b.ts', 'dois\n')],
    },
    ['SAVE_REFUSED'],
  )
  assert.equal(
    await repository.version(),
    1,
    'nothing at the first turn, one version at the second',
  )
  assert.ok(paths(git, 'main').includes('src/a.ts') && paths(git, 'main').includes('src/b.ts'))
})

test('outra conversa salvou com a máquina desta ligada: o turno que só leu fecha sem versão e sem falha; o que mudou é recusado como velho, e a volta da máquina junta e salva', async (t) => {
  const echo = {
    name: 'mastra_workspace_execute_command',
    input: { description: 'Lendo', command: 'echo oi' },
  }
  const turns = [echo, echo, writing('src/b.ts', 'b\n'), echo]
  let step = 0
  const world = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    const tool = step % 2 === 1 ? turns[(step - 1) / 2] : undefined
    if (tool === undefined) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', ...tool }] }
  })
  const { hub, ana, conversations } = world
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  async function turn(content: string) {
    assert.equal((await sent(hub, ana, url, content)).statusCode, 200)
    return failuresOf(await stream.turn())
  }
  assert.deepEqual(await turn('Leia o app'), [])
  const repository = repositoryOf(world)
  moveMain(join(hub.config.gitRoot, world.companyId, `${world.projectId}.git`), 'src/a.ts', 'a\n')
  const theirs = await repository.main()
  assert.deepEqual(await turn('Só leia, não mude nada'), [], 'a turn that changed nothing')
  assert.equal(await repository.main(), theirs, 'and saved nothing')
  assert.deepEqual(await turn('Crie b'), ['SAVE_REFUSED'])
  assert.ok(
    hub.lines.some((line) => line.message === 'SAVE_REFUSED' && line.fields.reason === 'stale'),
    'refused because main moved past what the machine started from',
  )
  assert.equal(await repository.main(), theirs)
  pausedByE2b(hub.builder.control)
  assert.deepEqual(await turn('De novo'), [])
  const paths = ((await repository.tree(await repository.main())) ?? []).map((file) => file.path)
  assert.ok(paths.includes('src/a.ts') && paths.includes('src/b.ts'), 'saved on the other version')
})

test('a máquina ligada não ouviu que o turno foi salvo: o turno seguinte que só leu fecha sem versão e sem falha', async (t) => {
  // A lock on the base ref makes the machine's `saved` fail, as a git it cannot run would.
  const lock = command(
    'Travando',
    'mkdir -p .git/refs/conexus && touch .git/refs/conexus/base.lock',
  )
  const script: (Tool | 'end')[] = [
    writing('src/a.ts', 'a\n'),
    lock,
    'end',
    command('Lendo', 'echo oi'),
    'end',
  ]
  const world = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    const next = script.shift()
    if (next === undefined || next === 'end') return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', ...next }] }
  })
  const { hub, ana, conversations } = world
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  async function turn(content: string) {
    assert.equal((await sent(hub, ana, url, content)).statusCode, 200)
    return failuresOf(await stream.turn())
  }
  assert.deepEqual(await turn('Crie a'), [])
  assert.ok(hub.lines.some((line) => line.message === 'MACHINE_BASE_NOT_MOVED'))
  const repository = repositoryOf(world)
  assert.equal(await repository.version(), 1)
  rmSync(join(hub.builder.folder, 'app', '.git/refs/conexus/base.lock'))
  assert.deepEqual(await turn('Só leia'), [], 'the saved turn is not taken for unsaved work')
  assert.equal(await repository.version(), 1, 'and nothing is saved again')
  assert.equal(
    hub.lines.filter((line) => line.message === 'VERSION_SAVED').length,
    1,
    'not even the same commit, collected again within the same second',
  )
})
