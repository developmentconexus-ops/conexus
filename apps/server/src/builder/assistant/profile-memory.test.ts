import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { BRUNO, CARLA, call, codeOf, memberOn, personOn } from '../../hub/identity/test-hub.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { stepped, tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const LEARNED = `# About the person
Diretora comercial; acompanha a linha de bebidas. (2026-11-11)
# Corrections they gave
Valores em reais, sem centavos. (2026-11-11)
# Work in progress
# Where to find things`

/** The person's memory route in the company of `company`'s path. */
function memoryOf(company: string) {
  return `${company}/assistant/profile-memory`
}

async function readMemory(hub: Hub, person: Person, company: string) {
  const read = await call(hub, person, 'GET', memoryOf(company))
  assert.equal(read.statusCode, 200, read.body)
  return Object(read.json()).text
}

/** The body a `PUT` sends; the other methods send none. */
function bodyFor(method: 'GET' | 'PUT' | 'DELETE', text: string) {
  return method === 'PUT' ? { text } : undefined
}

/** The block of Mastra's working memory a call to the model carried. */
function workingMemoryIn(asked: { systems: readonly { text: string }[] } | undefined) {
  return asked?.systems.find((each) => each.text.startsWith('WORKING_MEMORY_SYSTEM_INSTRUCTION'))
}

test('o que aprendeu vale na conversa seguinte', async (t) => {
  const on = await assisting(
    t,
    stepped([
      () => [tool('updateWorkingMemory', { memory: LEARNED })],
      () => [said('Anotado.')],
      () => [said('Olá, Ana.')],
    ]),
  )
  const first = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const told = 'Sou diretora comercial, acompanho bebidas; valores sem centavos.'
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, first)).say(told)), 'complete')
  const next = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, next)).say('Oi')), 'complete')

  const [before, , after] = on.calls
  assert.match(workingMemoryIn(before)?.text ?? '', /No working memory data available/)
  assert.ok(workingMemoryIn(after)?.text.includes(`<working_memory_data>\n${LEARNED}\n`))
  assert.equal(after?.systems[0]?.text, before?.systems[0]?.text, 'the fixed message, same bytes')
  assert.equal(after?.systems[0]?.cached, true)
  assert.equal(await readMemory(on.hub, on.ana, on.company), LEARNED)
})

test('a pessoa vê, corrige e apaga', async (t) => {
  const on = await assisting(t)
  const memory = memoryOf(on.company)
  assert.equal(await readMemory(on.hub, on.ana, on.company), null, 'no conversation yet')
  const early = await call(on.hub, on.ana, 'PUT', memory, { text: 'Cedo demais.' })
  assert.equal(early.statusCode, 404)
  assert.equal(codeOf(early), 'NOT_FOUND')

  await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(await readMemory(on.hub, on.ana, on.company), null, 'nothing kept yet')
  const corrected = 'Acompanha a linha de bebidas.'
  const put = await call(on.hub, on.ana, 'PUT', memory, { text: corrected })
  assert.equal(put.statusCode, 200, put.body)
  assert.deepEqual(put.json(), { text: corrected })
  assert.equal(await readMemory(on.hub, on.ana, on.company), corrected)
  const again = await call(on.hub, on.ana, 'PUT', memory, { text: corrected })
  assert.equal(again.statusCode, 200, 'the same text again answers the same')

  const long = await call(on.hub, on.ana, 'PUT', memory, { text: 'x'.repeat(4001) })
  assert.equal(long.statusCode, 400)
  assert.equal(codeOf(long), 'REQUEST_MALFORMED')
  assert.equal(await readMemory(on.hub, on.ana, on.company), corrected, 'a refusal changes nothing')

  for (const attempt of [1, 2]) {
    const erased = await call(on.hub, on.ana, 'DELETE', memory)
    assert.equal(erased.statusCode, 204, `erase ${attempt}`)
    assert.equal(await readMemory(on.hub, on.ana, on.company), null, `erased ${attempt}`)
  }
})

test('ninguém mais', async (t) => {
  const on = await assisting(t)
  const memory = memoryOf(on.company)
  await created(on.hub, on.ana, on.assistant, { connections: [] })
  const hers = 'Acompanha a linha de bebidas.'
  assert.equal((await call(on.hub, on.ana, 'PUT', memory, { text: hers })).statusCode, 200)

  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  assert.equal(await readMemory(on.hub, bruno, on.company), null, 'he reads his own, empty')
  for (const method of ['PUT', 'DELETE'] as const) {
    const refused = await call(on.hub, bruno, method, memory, bodyFor(method, 'Outra coisa.'))
    assert.equal(refused.statusCode, 404, method)
    assert.equal(codeOf(refused), 'NOT_FOUND')
  }
  await created(on.hub, bruno, on.assistant, { connections: [] })
  assert.equal((await call(on.hub, bruno, 'PUT', memory, { text: 'Dele.' })).statusCode, 200)
  assert.equal(await readMemory(on.hub, bruno, on.company), 'Dele.')

  const carla = await personOn(on.hub, CARLA)
  for (const method of ['GET', 'PUT', 'DELETE'] as const) {
    const outside = await call(on.hub, carla, method, memory, bodyFor(method, 'De fora.'))
    assert.equal(outside.statusCode, 404, method)
    assert.equal(codeOf(outside), 'NOT_FOUND')
  }
  assert.equal(await readMemory(on.hub, on.ana, on.company), hers, 'hers is untouched')
})

test('o modelo da memória', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')

  const block = workingMemoryIn(on.calls.at(0))?.text ?? ''
  const template = /<working_memory_template>\n([\s\S]*)\n<\/working_memory_template>/.exec(block)
  const sections = template?.[1]?.match(/^# .+$/gm)
  assert.deepEqual(sections, [
    '# About the person',
    '# Corrections they gave',
    '# Work in progress',
    '# Where to find things',
  ])
  assert.match(template?.[1] ?? '', /never keep what a read of the company's systems gives again/)
  assert.match(template?.[1] ?? '', /end each line you add with its date \(YYYY-MM-DD\)/)
  assert.match(template?.[1] ?? '', /under 4,000 characters/)
})
