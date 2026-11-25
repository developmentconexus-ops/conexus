import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { DATA_TOOL } from '@conexus/hub-api'
import { endOf, messagesOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { CONNECTORS } from '../../hub/connectors/public.ts'
import type { Anthropic, Sent } from '../../platform/test-anthropic.ts'
import { assisting, COUNT, created, SEARCH, talking } from './test-assistant.ts'

type Described = { systems: { name: string; connector: string; reads: { operation: string }[] }[] }

/** Inputs the Sankhya double answers for the reads whose probe needs an earlier answer. */
const ANSWERED: Record<string, Record<string, unknown>> = {
  sankhya_notaFiscal: { codigoNota: 201 },
  sankhya_precosDoProduto: { codigoProduto: 11, pagina: 1 },
  sankhya_precosDaTabela: { codigoTabela: 1, pagina: 1 },
}

type Schema = { properties?: Record<string, { type?: string }>; required?: string[] }

/** An input the double answers: the read's own probe, else one of its rows, else its required fields. */
function inputOf(name: string, schema: Schema): Record<string, unknown> {
  const operation = CONNECTORS.flatMap((connector) =>
    [...connector.operations, ...Object.values(connector.readDoor ?? {})].map((each) => ({
      name: `${connector.id}_${each.id}`,
      each,
    })),
  ).find((read) => read.name === name)?.each
  const probed = operation?.probe(new Map()) ?? ANSWERED[name]
  if (probed !== undefined && probed !== null) return { connection: 'Matriz', ...Object(probed) }
  const properties = schema.properties ?? {}
  return Object.fromEntries(
    (schema.required ?? []).map((field) => {
      if (field === 'connection') return [field, 'Matriz']
      if (field === 'sql') return [field, COUNT]
      const type = properties[field]?.type
      return [field, type === 'integer' || type === 'number' ? 1 : '1']
    }),
  )
}

/**
 * A model that asks `data_describe`, then loads and calls every read it lists, each once: the
 * names it read are in `asked`, the catalog in `seen`.
 */
function everyRead(seen: { described?: Described; called: string[] }): Anthropic['answer'] {
  return (sent: Sent) => {
    if (!sent.stream) return { kind: 'text', text: 'Título' }
    if (seen.described === undefined) {
      if (sent.texts.some((text) => text.includes('"systems"'))) {
        seen.described = JSON.parse(
          String(sent.texts.findLast((text) => text.includes('"systems"'))),
        )
      } else {
        return { kind: 'blocks', blocks: [tool(DATA_TOOL.describe, {})] }
      }
    }
    const names = (seen.described?.systems ?? []).flatMap((system) =>
      system.reads.map((read) => `${system.connector}_${read.operation}`),
    )
    const next = names.find((name) => !seen.called.includes(name))
    if (next === undefined) return { kind: 'text', text: 'Pronto.' }
    if (!sent.tools.includes(next)) {
      return { kind: 'blocks', blocks: [tool(SEARCH, { query: next.replace('_', ' ') })] }
    }
    seen.called.push(next)
    return { kind: 'blocks', blocks: [tool(next, inputOf(next, Object(sent.schemas[next])))] }
  }
}

async function lawB(t: TestContext, body: (on: Awaited<ReturnType<typeof assisting>>) => object) {
  const seen: { described?: Described; called: string[] } = { called: [] }
  const on = await assisting(t, everyRead(seen))
  const url = await created(on.hub, on.ana, on.assistant, body(on))
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('O que você lê dos sistemas?')), 'complete')
  const answered = (await messagesOf(on.hub, on.ana, url))
    .flatMap((message) => message.parts)
    .flatMap((part) =>
      part.type === 'tool-invocation' && seen.called.includes(part.toolInvocation.toolName)
        ? [[part.toolInvocation.toolName, Object(part.toolInvocation.result).kind]]
        : [],
    )
  return { seen, answered }
}

test('lei (b) na empresa: toda leitura da data_describe é uma leitura tipada oferecida que responde OK; a Filial não escolhida não aparece', async (t) => {
  const { seen, answered } = await lawB(t, (on) => ({ connections: [on.matriz] }))
  assert.deepEqual(
    seen.described?.systems.map((system) => system.name),
    ['Matriz'],
  )
  assert.ok(seen.called.length > 0, 'the catalog lists reads')
  assert.deepEqual(
    answered,
    seen.called.map((name) => [name, 'OK']),
  )
})

test('lei (b) no Projeto: a conversa que escolhe as duas lê só a recebida, e toda leitura listada responde OK', async (t) => {
  const { seen, answered } = await lawB(t, (on) => ({
    projectId: on.projectId,
    connections: [on.matriz, on.filial],
  }))
  assert.deepEqual(
    seen.described?.systems.map((system) => system.name),
    ['Matriz'],
  )
  assert.ok(seen.called.length > 0, 'the catalog lists reads')
  assert.deepEqual(
    answered,
    seen.called.map((name) => [name, 'OK']),
  )
})
