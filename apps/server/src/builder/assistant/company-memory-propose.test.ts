import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { BRUNO, CARLA, call, codeOf, memberOn, post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { stepped, tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'
import { memoryAt, memoryOf, NOTE, OPERATION_1100 } from './test-company-memory.ts'

const PROPOSE = ASSISTANT_TOOL.proposeCompanyMemory
const RULE = { name: 'Valores', text: 'Valores em reais com duas casas.' }

function lastRead(asked: Sent) {
  return Object(JSON.parse(asked.toolResults.at(-1)?.text ?? '{}'))
}

test('quem escreve: o modelo de quem tem a permissão, como o de um membro, não tem ferramenta de gravação do Knowledge, e nenhum bloco do pedido manda usar uma ferramenta que ele não tem (knowledge_pin, knowledge_page, knowledge_note), e os dois têm a proposta', async (t) => {
  const on = await assisting(t, [[said('Oi.')], [said('Oi, Bruno.')]])
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  for (const person of [on.ana, bruno]) {
    const url = await created(on.hub, person, on.assistant, { connections: [] })
    assert.equal(endOf(await (await talking(t, on.hub, person, url)).say('Oi')), 'complete')
  }
  assert.equal(on.calls.length, 2)
  for (const asked of on.calls) {
    const knowledge = asked.tools.filter((name) => name.startsWith('knowledge_')).sort()
    assert.deepEqual(knowledge, ['knowledge_list', 'knowledge_read', 'knowledge_search'])
    assert.ok(asked.tools.includes(PROPOSE))
    // The pinned-context block is the library's own text, which has no option (a debt of the card).
    const systems = asked.systems
      .map((each) => each.text)
      .filter((text) => !text.startsWith('Pinned knowledge may appear'))
      .join('\n')
    assert.doesNotMatch(
      systems,
      /When you write to Knowledge|knowledge_pin|knowledge_page|knowledge_note/,
    )
  }
})

test('quem escreve: a proposta vira o cartão com o texto, de uma página nova ou de uma nota numa página lida, e sem o toque nada é gravado', async (t) => {
  const on = await assisting(
    t,
    stepped([
      () => [tool(PROPOSE, RULE)],
      () => [tool('knowledge_read', {})],
      (asked) => [tool('knowledge_read', { page: String(lastRead(asked).scopes.at(0).address) })],
      (asked) => {
        const { children } = lastRead(asked)
        const page = children.find((each: { name: string }) => each.name === OPERATION_1100.name)
        return [tool(PROPOSE, { page: page.id, text: NOTE })]
      },
      () => [said('O cartão está aí.')],
    ]),
  )
  const made = await post(on.hub, on.ana, `${memoryAt(on.companyId)}/pages`, OPERATION_1100)
  assert.equal(made.statusCode, 201, made.body)
  const { pageId } = Object(made.json()).page
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Guarde')), 'complete')
  const results = on.calls.at(-1)?.toolResults ?? []
  assert.deepEqual(
    results.map((each) => each.error),
    [false, false, false, false],
  )
  assert.deepEqual(JSON.parse(results.at(0)?.text ?? ''), {
    kind: 'PAGE',
    name: RULE.name,
    body: RULE.text,
  })
  assert.deepEqual(JSON.parse(results.at(3)?.text ?? ''), {
    kind: 'NOTE',
    pageId,
    pageName: OPERATION_1100.name,
    body: NOTE,
  })
  const memory = await memoryOf(on.hub, on.ana, on.companyId)
  assert.deepEqual(
    memory.pages.map((each: { pageId: string }) => each.pageId),
    [pageId],
  )
  const shown = await call(on.hub, on.ana, 'GET', `${memoryAt(on.companyId)}/pages/${pageId}`)
  assert.deepEqual(Object(shown.json()).page.notes, [])
})

test('quem escreve: o toque grava pela rota, com a pessoa como autora; tocar de novo não grava outra vez; sem a permissão, NOT_IN_ROLE', async (t) => {
  const on = await assisting(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const pages = `${memoryAt(on.companyId)}/pages`
  const key = randomUUID()
  const first = await post(on.hub, carla, pages, OPERATION_1100, key)
  const again = await post(on.hub, carla, pages, OPERATION_1100, key)
  assert.deepEqual([first.statusCode, again.statusCode], [201, 201], again.body)
  const { page } = Object(first.json())
  assert.equal(Object(again.json()).page.pageId, page.pageId)
  assert.deepEqual(
    [page.name, page.body, page.author],
    [...Object.values(OPERATION_1100), CARLA.name],
  )
  const notes = `${pages}/${page.pageId}/notes`
  const noteKey = randomUUID()
  const noted = await post(on.hub, carla, notes, { body: NOTE }, noteKey)
  const renoted = await post(on.hub, carla, notes, { body: NOTE }, noteKey)
  assert.equal(renoted.statusCode, 201, renoted.body)
  const { note } = Object(noted.json())
  assert.deepEqual([note.body, note.author], [NOTE, CARLA.name])
  assert.equal(Object(renoted.json()).note.id, note.id)
  for (const [url, body] of [
    [pages, OPERATION_1100],
    [notes, { body: 'Do Bruno.' }],
  ] as const) {
    const refused = await post(on.hub, bruno, url, body)
    assert.equal(refused.statusCode, 409, refused.body)
    assert.equal(codeOf(refused), 'NOT_IN_ROLE')
  }
  const memory = await memoryOf(on.hub, on.ana, on.companyId)
  assert.equal(memory.pages.length, 1)
  const shown = await call(on.hub, on.ana, 'GET', `${pages}/${page.pageId}`)
  assert.deepEqual(
    Object(shown.json()).page.notes.map((each: { id: string }) => each.id),
    [note.id],
  )
})
