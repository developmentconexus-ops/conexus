import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { BRUNO, CARLA, call, codeOf, memberOn, personOn } from '../../hub/identity/test-hub.ts'
import {
  automating,
  created as automation,
  ended,
  ranNow,
  salesSummary,
} from '../automations/test-automations.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { stepped, tool } from '../conversation/test-questions.ts'
import {
  assisting,
  created,
  LEGACY_PROFILE_TEMPLATE,
  PROFILE_TEMPLATE,
  said,
  talking,
} from './test-assistant.ts'

const LEARNED = `# Sobre você
Diretora comercial; acompanha a linha de bebidas. (2026-11-11)
# Correções que você deu
Valores em reais, sem centavos. (2026-11-11)
# No que você está trabalhando
# Onde achar as coisas`

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
  assert.deepEqual(template?.[1]?.match(/^# .+$/gm), [
    '# Sobre você',
    '# Correções que você deu',
    '# No que você está trabalhando',
    '# Onde achar as coisas',
  ])
  assert.doesNotMatch(template?.[1] ?? '', /<!--|never keep|YYYY|4,000/, 'no rule inside the note')
})

test('a rodada de automação lê o perfil e não o grava: o modelo não recebe a ferramenta de escrita da memória, a rodada termina e o perfil da pessoa fica como estava', async (t) => {
  const on = await automating(t, [
    [tool('updateWorkingMemory', { memory: '# Sobre você\nESCRITO-PELA-RODADA' })],
  ])
  const before = await readMemory(on.hub, on.ana, on.company)
  const made = await automation(on.hub, on.ana, on.automations, salesSummary([on.matriz]))
  const url = `${on.automations}/${made.id}`
  const run = await ended(on.hub, on.ana, url, await ranNow(on.hub, on.ana, url))
  assert.equal(run.state.kind, 'DONE')
  const asked = on.calls.filter((each) => each.tools.includes('recall'))
  assert.ok(asked.length > 0, 'the run reads the profile and recalls')
  for (const each of asked) assert.equal(each.tools.includes('updateWorkingMemory'), false)
  assert.equal(await readMemory(on.hub, on.ana, on.company), before)
})

test('uma nota guardada com o modelo antigo continua legível, e o modelo antigo sem nada escrito conta como vazio', async (t) => {
  const on = await assisting(t)
  const memory = memoryOf(on.company)
  await created(on.hub, on.ana, on.assistant, { connections: [] })
  const old = `${LEGACY_PROFILE_TEMPLATE.split('\n').slice(0, 2).join('\n')}\nDiretora comercial. (2026-11-01)`
  assert.equal((await call(on.hub, on.ana, 'PUT', memory, { text: old })).statusCode, 200)
  assert.equal(await readMemory(on.hub, on.ana, on.company), old)
  assert.equal(
    (await call(on.hub, on.ana, 'PUT', memory, { text: LEGACY_PROFILE_TEMPLATE })).statusCode,
    200,
  )
  assert.equal(await readMemory(on.hub, on.ana, on.company), null)
})

test('as regras da nota pessoal moram nas instruções, e a nota levada à empresa passa pelo cartão', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Oi')), 'complete')
  const fixed = on.calls.at(0)?.systems.at(0)?.text ?? ''
  assert.match(fixed, /never keep what a read of the company's systems gives again/i)
  assert.match(fixed, /end each line you add with its date \(YYYY-MM-DD\)/i)
  assert.match(fixed, /under 4,000 characters, shortening the oldest lines first/)
  assert.match(fixed, /the person reads and edits it on their own screen/)
  assert.match(
    fixed,
    /holds for the whole company, offer it on the card of propose_company_memory and never save it for the company yourself/,
  )
})

test('o modelo vazio com espaços sobrando ainda conta como nada guardado', async (t) => {
  const on = await assisting(t)
  await created(on.hub, on.ana, on.assistant, { connections: [] })
  const memory = memoryOf(on.company)
  for (const text of [`${PROFILE_TEMPLATE}\n\n`, `  ${LEGACY_PROFILE_TEMPLATE}\n`]) {
    assert.equal((await call(on.hub, on.ana, 'PUT', memory, { text })).statusCode, 200)
    assert.equal(await readMemory(on.hub, on.ana, on.company), null)
  }
})
