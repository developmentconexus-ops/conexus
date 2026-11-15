import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { sankhya as sankhyaWithWrites } from '../sankhya/definition.ts'
import { lancarPedido } from '../sankhya/operations/vendas.ts'
import {
  assertFixedExist,
  assertMarkReachesRequest,
  assertRefusalsRead,
  assertWriteNeedsProofToRefuse,
} from './conformance-declared.ts'
import { defineConnector } from './definition.ts'
import type { ProviderAnswer } from './operation.ts'
import { defineOperation } from './operation.ts'

/** The Sankhya connector with its one write replaced by a changed copy. */
function withWrite(changes: Record<string, unknown>) {
  return defineConnector({ ...sankhyaWithWrites, writes: [{ ...lancarPedido, ...changes }] })
}

test('as recusas gravadas: o conector as lê com o tipo gravado e todo texto do corpo na mensagem', () => {
  assertRefusalsRead(sankhyaWithWrites)
  // The reader before this step dropped the cause the gateway keeps in `error.details`.
  const withoutCause = withWrite({
    answer: (answer: ProviderAnswer) => {
      const read = lancarPedido.answer(answer)
      return read.kind === 'REFUSED'
        ? { ...read, native: { ...read.native, message: 'Ocorreu algum erro inesperado!' } }
        : read
    },
  })
  assert.throws(() => assertRefusalsRead(withoutCause), /O produto \[999\] enviado não existe/)
  const wrongKind = withWrite({
    answer: (answer: ProviderAnswer) => {
      const read = lancarPedido.answer(answer)
      return read.kind === 'REFUSED' ? { ...read, kind: 'UNREADABLE' } : read
    },
  })
  assert.throws(() => assertRefusalsRead(wrongKind), /reads its recorded refusal/)
})

test('a marca chega ao pedido: a de cada escrita passa no input e aparece no que o request manda', () => {
  assertMarkReachesRequest(sankhyaWithWrites)
  const lost = withWrite({
    mark: (input: object) => ({ ...input, nota: 'Conexus 0123456789abcdef' }),
  })
  assert.throws(() => assertMarkReachesRequest(lost), /the mark is in the request/)
  const unreadable = withWrite({ mark: () => ({ notaModelo: 'x' }) })
  assert.throws(() => assertMarkReachesRequest(unreadable), /the marked input reads/)
})

test('uma escrita só recusa com prova: um 200 sem o id e sem recusa do sistema é ilegível', () => {
  assertWriteNeedsProofToRefuse(sankhyaWithWrites)
  // The reader before this change took a 2xx without `retorno` for the vendor's refusal, so nothing held the next send.
  const refusesWithoutProof = withWrite({
    answer: (answer: ProviderAnswer) => {
      const read = lancarPedido.answer(answer)
      return read.kind === 'UNREADABLE' ? { ...read, kind: 'REFUSED' } : read
    },
  })
  assert.throws(
    () => assertWriteNeedsProofToRefuse(refusesWithoutProof),
    /is unreadable, not refused/,
  )
})

const base = {
  id: 'ping',
  subject: 'ping',
  idempotent: true,
  summary: 'Ping.',
  label: 'Ping',
  input: z.object({}),
  output: z.object({}),
  probe: () => ({}),
  request: () => ({ method: 'GET' as const, path: '/ping' as const, query: {}, body: undefined }),
  answer: () => ({
    kind: 'UNREADABLE' as const,
    native: { status: 0, code: null, message: null, body: null },
  }),
}

test('uma escrita declara o incerto, a marca e o id; sem eles não compila', () => {
  // @ts-expect-error a write without uncertain, mark and idOf does not compile
  defineOperation({ ...base, class: 'write' })
  // @ts-expect-error a write that lacks idOf does not compile
  defineOperation({
    ...base,
    class: 'write',
    uncertain: () => false,
    mark: (input: unknown) => input,
  })
  assert.equal(defineOperation({ ...base, class: 'read' }).class, 'read')
})

test('os campos fixos existem no input da operação', () => {
  assertFixedExist(sankhyaWithWrites)
  assert.throws(
    () => assertFixedExist(withWrite({ fixed: ['notaModel'] })),
    /"notaModel" is a field of its input/,
  )
})
