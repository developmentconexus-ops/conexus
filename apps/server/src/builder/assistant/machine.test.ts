import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  asked,
  conversing,
  endOf,
  holding,
  hubBeside,
  PARTIAL,
  sent,
  streamOf,
} from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { INSTALLATION, TEMPLATE } from '../machine/test-machine.ts'
import { assisting, COUNT, created, reading, said, talking } from './test-assistant.ts'

const WRITE = 'mastra_workspace_write_file'
const READ_FILE = 'mastra_workspace_read_file'

function write(path: string, content: string) {
  return tool(WRITE, { path, content })
}

function nameOf(url: string) {
  return `conexus-${INSTALLATION}-${url.slice(url.lastIndexOf('/') + 1)}`
}

test('a máquina da conversa: a primeira ferramenta de arquivo liga uma com o nome da conversa; o turno seguinte acha a mesma com os arquivos; outra conversa tem outra; sem app e sem Git; só o npm e o PyPI (17)', async (t) => {
  const on = await assisting(t, [
    [write('a.txt', 'um')],
    [said('Escrevi.')],
    [tool(READ_FILE, { path: 'a.txt' })],
    [said('Li.')],
    [write('b.txt', 'dois')],
  ])
  const { control, folder } = on.hub.assistantMachines
  const home = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const project = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [],
  })
  assert.deepEqual(control.names, [], 'creating a conversation asks the provider nothing')

  const first = await talking(t, on.hub, on.ana, home)
  assert.equal(endOf(await first.say('Escreva a.txt')), 'complete')
  assert.deepEqual(control.names, [nameOf(home)])
  control.discoverable.push(nameOf(home))

  assert.equal(endOf(await first.say('Leia a.txt')), 'complete')
  assert.deepEqual(control.names, [nameOf(home), nameOf(home)], 'the same machine, by its name')
  assert.deepEqual(control.attached, [nameOf(home)], 'the second turn found it, not made it')
  assert.equal(control.networkClosed, 1, 'a machine found again has its network narrowed again')
  assert.ok(
    on.calls.some((call) => call.texts.at(-1)?.includes('um')),
    'the file the first turn wrote is there',
  )

  const other = await talking(t, on.hub, on.ana, project)
  assert.equal(endOf(await other.say('Escreva b.txt')), 'complete')
  assert.equal(control.names.at(-1), nameOf(project))
  assert.notEqual(nameOf(home), nameOf(project))

  const work = join(folder, 'work')
  assert.equal(readFileSync(join(work, 'a.txt'), 'utf8'), 'um')
  assert.deepEqual(
    readdirSync(folder).sort(),
    ['work'],
    'no app folder, no seed: nothing but the conversation folder',
  )
  assert.equal(existsSync(join(work, '.git')), false)

  const hosts = ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org']
  assert.ok(control.allowOut.every((each) => JSON.stringify(each) === JSON.stringify(hosts)))
  const [homeMarks, projectMarks] = [control.marks[0], control.marks.at(-1)]
  assert.equal(homeMarks?.conexus_origin, INSTALLATION)
  assert.equal(homeMarks?.conexus_company, on.companyId)
  assert.equal(homeMarks?.conexus_conversation, home.slice(home.lastIndexOf('/') + 1))
  assert.equal(homeMarks?.conexus_template, TEMPLATE)
  assert.equal('conexus_project' in (homeMarks ?? {}), false, 'the Início has no Projeto mark')
  assert.equal(projectMarks?.conexus_project, on.projectId)
})

test('a leitura na máquina: grava a resposta inteira em reads/<turno>-<n>.json, responde o corte com o caminho, um código lê o arquivo; o segundo turno grava outro e o primeiro fica (18)', async (t) => {
  const on = await assisting(t, [
    [reading('Matriz', COUNT)],
    [tool(READ_FILE, { path: 'reads/placeholder' })],
    [said('Uma.')],
    [reading('Matriz', COUNT)],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quantas empresas?')), 'complete')
  const reads = join(on.hub.assistantMachines.folder, 'work', 'reads')
  const [turn] = on.reads
  assert.ok(turn !== undefined)
  const first = `${turn.turn.slice(0, 8)}-1.json`
  assert.deepEqual(readdirSync(reads), [first])
  const whole = JSON.parse(readFileSync(join(reads, first), 'utf8'))
  assert.ok(Array.isArray(whole.linhas) || typeof whole === 'object')
  const answered = on.calls[1]?.texts.findLast((text) => text.includes('"kind":"OK"'))
  assert.ok(answered?.includes(`reads/${first}`), answered)
  assert.ok(answered?.includes('"complete"'), answered)
  assert.equal(answered?.includes('"whole"'), false, 'the whole answer is not in the model’s copy')

  assert.equal(endOf(await say('E agora?')), 'complete')
  const second = readdirSync(reads).sort()
  assert.equal(second.length, 2)
  assert.ok(second.includes(first), 'the first turn’s file stays')
})

test('a leitura na máquina: a máquina que não liga deixa a leitura responder o corte com saved: false e a falha (18)', async (t) => {
  const on = await assisting(t, [[reading('Matriz', COUNT)], [said('Não salvei.')]])
  on.hub.assistantMachines.control.start = 'unreachable'
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Quantas empresas?')), 'complete')
  const answered = on.calls[1]?.texts.findLast((text) => text.includes('"kind":"OK"'))
  assert.match(String(answered), /"saved":false/)
  assert.match(String(answered), /MACHINE_UNAVAILABLE/)
})

test('o fim da máquina: o turno que acaba para a máquina, e o seguinte a acorda (21)', async (t) => {
  const on = await assisting(t, [
    [write('a.txt', 'um')],
    [said('Escrevi.')],
    [write('b.txt', 'dois')],
  ])
  const { control } = on.hub.assistantMachines
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Escreva a.txt')), 'complete')
  await new Promise((done) => setTimeout(done, 200))
  assert.equal(control.stops, 1, 'the machine sleeps when the turn ends')
  assert.equal(endOf(await say('Escreva b.txt')), 'complete')
  assert.equal(control.names.length, 2, 'the next question woke it')
})

const ASSISTANT_PROMPT = 'You are the Conexus assistant.'

test('as ferramentas da máquina: as mastra_workspace_* que o modelo do Assistente recebe são as da máquina do Builder, lidas do pedido ao modelo nos dois (17)', async (t) => {
  const on = await assisting(t, (asked) =>
    asked.stream ? { kind: 'text', text: 'Pronto.' } : { kind: 'text', text: 'Título' },
  )
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  const builder = await asked(t, { hub: on.hub, person: on.ana, conversations: on.conversations })
  assert.equal(endOf(builder.events), 'complete')
  function workspaceTools(own: boolean) {
    const call = on.calls.find((each) => each.system.startsWith(ASSISTANT_PROMPT) === own)
    return (call?.tools ?? []).filter((name) => name.startsWith('mastra_workspace_')).sort()
  }
  assert.equal(workspaceTools(false).length, 11)
  assert.deepEqual(workspaceTools(true), workspaceTools(false))
})

test('o fim do Hub: a máquina do turno em andamento para quando o Hub é parado (21)', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  let modelCalls = 0
  const { hub, ana, companyId } = await conversing(t, (call) => {
    if (!call.stream) return { kind: 'text', text: 'Título' }
    if (!call.system.startsWith(ASSISTANT_PROMPT)) return { kind: 'text', text: 'Pronto.' }
    modelCalls += 1
    return modelCalls === 1 ? { kind: 'blocks', blocks: [write('a.txt', 'um')] } : held.reply
  })
  const stopping = await hubBeside(t, hub)
  const assistant = `/api/companies/${companyId}/assistant/conversations`
  const url = await created(stopping, ana, assistant, { connections: [] })
  const stream = await streamOf(stopping, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(stopping, ana, url, 'Escreva')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  const { control } = stopping.assistantMachines
  assert.equal(control.names.length, 1, 'the turn started the machine')
  assert.equal(control.stops, 0, 'and it runs')
  const stopped = stopping.close(300)
  assert.equal(endOf(await stream.turn()), 'aborted')
  await stopped
  assert.equal(control.stops, 1, 'the Hub ending stopped it')
})
