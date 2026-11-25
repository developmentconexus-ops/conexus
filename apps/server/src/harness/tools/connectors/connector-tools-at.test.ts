import assert from 'node:assert/strict'
import { test } from 'node:test'
import { READER_ZONE, ReadCut } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { connectorTools } from '../public.ts'
import { accessOver, granted, runOn, SANKHYA } from './test-access.ts'

test('uma leitura OK leva a hora em que voltou, com e sem a resposta inteira guardada na máquina; uma recusa não leva', async () => {
  const read = { connection: 'Matriz', operation: 'sankhya.consultar', input: {} }
  const plain = { kind: 'OK', value: { linhas: [] }, complete: true, rows: 0, bytes: 14 } as const
  const files = { writeFile: async () => undefined }
  const cases = [
    { answer: plain, context: {}, extra: {} },
    {
      answer: { ...plain, whole: { linhas: [1] } },
      context: { workspace: { filesystem: files } },
      extra: { savedAt: () => 'reads/aaaa-1.json' },
    },
    {
      answer: { ...plain, whole: { linhas: [1] } },
      context: {},
      extra: {},
    },
  ]
  for (const { answer, context, extra } of cases) {
    const { access } = accessOver([granted('sankhya', SANKHYA)], {
      read: async () => answer,
      ...extra,
    })
    const set = connectorTools(access, { noteSave: false })
    const before = Date.now()
    const result = await runOn(set, 'connector_read', read, context)
    const after = Date.now()
    assert.equal(result.kind, 'OK')
    assert.equal(ReadCut.parse(result).at, result.at)
    assert.ok(Date.parse(result.at) >= before && Date.parse(result.at) <= after)
  }
  const native = { status: 403, code: null, message: null, body: null }
  const refusals = [
    { kind: 'NOT_GRANTED' },
    { kind: 'AUTH_REFUSED', native },
    { kind: 'REFUSED', native },
    { kind: 'UNREADABLE', native },
    { kind: 'BUSY', waitMs: null },
    { kind: 'DEADLINE' },
  ] as const
  for (const refusal of refusals) {
    const { access } = accessOver([granted('sankhya', SANKHYA)], { read: async () => refusal })
    const refused = await runOn(connectorTools(access, { noteSave: false }), 'connector_read', read)
    assert.equal('at' in refused, false, refusal.kind)
  }
})

test('a hora da leitura volta no fuso de quem lê, e as descrições das leituras dizem que vem com o deslocamento', async () => {
  const read = { connection: 'Matriz', operation: 'sankhya.consultar', input: {} }
  const answer = { kind: 'OK', value: { linhas: [] }, complete: true, rows: 0, bytes: 14 } as const
  const { access } = accessOver([granted('sankhya', SANKHYA)], { read: async () => answer })
  const set = connectorTools(access, { noteSave: false })
  const requestContext = new RequestContext()
  requestContext.set(READER_ZONE, 'America/Sao_Paulo')
  const local = await runOn(set, 'connector_read', read, { requestContext })
  assert.match(local.at, /-03:00$/)
  assert.match((await runOn(set, 'connector_read', read)).at, /Z$/)
  assert.match(Object(set).connector_read.description, /UTC offset/)
})
