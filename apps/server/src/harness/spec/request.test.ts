import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { turnDate } from './public.ts'
import { requestOf } from './test-request.ts'

test('um id, uma marca: o mesmo uuid dá a mesma marca onde aparecer, num corpo e no outro', () => {
  const id = randomUUID()
  const body = { metadata: { thread: id }, messages: [{ id: `toolu_${id}`, text: `fio ${id}` }] }
  const kept = requestOf(body)
  assert.deepEqual(kept, {
    metadata: { thread: '<id-1>' },
    messages: [{ id: 'toolu_<id-1>', text: 'fio <id-1>' }],
  })
  assert.deepEqual(requestOf(structuredClone(body)), kept)
})

test('dois ids, duas marcas, na ordem em que aparecem; o id de chamada do dublê de Chat Completions também', () => {
  const [first, second] = [randomUUID(), randomUUID()]
  assert.deepEqual(requestOf([`toolu_${first}`, second, first, 'call_0a1b2c3d', 'call_tool']), [
    'toolu_<id-1>',
    '<id-2>',
    '<id-1>',
    'call_<id-3>',
    'call_tool',
  ])
})

test('um id de 32 hexadecimais, como o Hub faz, também vira marca; um hex mais longo, como um resumo, fica', () => {
  const id = randomUUID()
  const compact = id.replaceAll('-', '')
  const hub = randomBytes(16).toString('hex')
  const digest = '0'.repeat(64)
  assert.deepEqual(
    requestOf([`/tmp/conexus_test_${compact}/${id}`, `{"projectId":"${hub}"}`, digest]),
    ['/tmp/conexus_test_<id-1>/<id-2>', '{"projectId":"<id-3>"}', digest],
  )
})

test('a data de hoje vira a marca, com o dia da semana; outra data fica', () => {
  const today = turnDate()
  const weekday = new Date(`${today}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  })
  assert.deepEqual(requestOf({ system: `Today: ${today} (${weekday}). Date: ${today}.` }), {
    system: 'Today: <today> (<weekday>). Date: <today>.',
  })
  assert.deepEqual(requestOf('Desde 2020-01-31.'), 'Desde 2020-01-31.')
})

test('um texto com quebra vira as suas linhas, e um texto sem quebra fica inteiro', () => {
  assert.deepEqual(requestOf({ text: '# Título\n\nUma linha.\n' }), {
    text: ['# Título', '', 'Uma linha.', ''],
  })
  assert.deepEqual(requestOf({ text: 'Uma linha.' }), { text: 'Uma linha.' })
})

test('o juiz: só a duração da mensagem do Mastra vira marca; outra duração fica', () => {
  const judged = ['#### Completion Check Results', '', 'Overall: ❌ NOT COMPLETE', 'Duration: 33ms']
  assert.deepEqual(requestOf({ text: [...judged, 'Score: 0 ❌'].join('\n') }), {
    text: [
      '#### Completion Check Results',
      '',
      'Overall: ❌ NOT COMPLETE',
      'Duration: <duration>ms',
      'Score: 0 ❌',
    ],
  })
  assert.deepEqual(requestOf({ content: 'Exit code: 0\nDuration: 36ms' }), {
    content: ['Exit code: 0', 'Duration: 36ms'],
  })
  assert.deepEqual(requestOf('Duration: 33ms'), 'Duration: 33ms')
})

test('a leitura: o instante dela, sem o fuso, e a vez no nome do arquivo viram marca; outro fuso, outra hora e outro arquivo ficam', () => {
  const read =
    '{"at":"2020-01-31T01:00:48.166-03:00","bytes":36,"file":"reads/3e52ed77-2.json","kind":"OK"}'
  assert.equal(
    requestOf(read),
    '{"at":"<read-at>-03:00","bytes":36,"file":"reads/<turn>-2.json","kind":"OK"}',
  )
  assert.equal(requestOf('{"at":"2020-01-31T01:00:48.166Z"}'), '{"at":"<read-at>Z"}')
  const other = '{"createdAt":"2020-01-31T01:00:48.166Z","file":"notes/3e52ed77-2.json"}'
  assert.equal(requestOf(other), other)
})

test('o agente salvo: o updatedAt dele vira marca; outro instante fica', () => {
  const saved = '{"agent":{"name":"Vendas","updatedAt":"2020-01-31T01:05:14.819Z"}}'
  assert.equal(requestOf(saved), '{"agent":{"name":"Vendas","updatedAt":"<updated-at>"}}')
  const other = '{"createdAt":"2020-01-31T01:05:14.819Z"}'
  assert.equal(requestOf(other), other)
})

test('um valor que muda fica vermelho: o que não é uuid, data de hoje nem id do dublê fica no retrato', () => {
  function at(iso: string) {
    return requestOf({ system: `Rodada de ${iso}`, max_tokens: 64_000 })
  }
  assert.notDeepEqual(at('2020-01-31T10:00:00.000Z'), at('2020-01-31T10:00:01.000Z'))
  assert.notDeepEqual(requestOf({ max_tokens: 1 }), requestOf({ max_tokens: 2 }))
})
