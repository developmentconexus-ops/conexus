import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { assisting, created, reading, said, searching, talking } from './test-assistant.ts'

test('o fuso que o navegador manda no cabeçalho chega à leitura: a hora em que a leitura voltou vai no deslocamento de quem lê', async (t) => {
  const turn = [[searching()], [reading()], [said('Pronto.')]]
  const on = await assisting(t, [...turn, ...turn])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const conversation = await talking(t, on.hub, on.ana, url)
  async function readAt(zone: string | undefined) {
    assert.equal(endOf(await conversation.say('Quantas empresas?', [], zone)), 'complete')
    const read = on.calls.at(-1)?.texts.findLast((text) => text.includes('"kind":"OK"'))
    assert.ok(read, 'the model read the live answer')
    return String(JSON.parse(read).at)
  }
  const utc = await readAt(undefined)
  const local = await readAt('America/Sao_Paulo')
  assert.equal(on.reads.length, 2, 'each turn reached the door once')
  assert.match(utc, /Z$/)
  assert.match(local, /-03:00$/)
})
