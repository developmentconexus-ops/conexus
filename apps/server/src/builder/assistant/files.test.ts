import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { z } from 'zod'
import { nativeRecording } from '../../platform/test-recordings.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import type { Upload } from './test-assistant.ts'
import {
  COMMAND,
  conversation,
  documentsIn,
  file,
  kindOf,
  LONG,
  notesOf,
  PDF,
  PDF_TYPE,
  pdf,
  placed,
  png,
  sentFilesOf,
} from './test-files.ts'

test('o PDF vai para a máquina: nenhum passo recebe os bytes', async (t) => {
  const on = await conversation(t)
  assert.equal(endOf(await on.say('Quais as regras de desconto?', [pdf])), 'complete')
  assert.ok(on.calls.length > 0)
  for (const call of on.calls) {
    assert.deepEqual(documentsIn(call), [], 'no call carries the PDF')
    const [note, ...more] = notesOf(call)
    assert.ok(note, 'each call carries the note')
    assert.deepEqual(more, [])
    assert.match(note.path ?? '', /\/uploads\/[^/\n]+\/[0-9a-f]{64}\.pdf$/)
    assert.deepEqual(
      [note.name, note.type, note.size],
      ['politica.pdf', PDF_TYPE, `${PDF.length} bytes`],
    )
  }
})

test('o arquivo na máquina: o mesmo caminho para os mesmos bytes', async (t) => {
  const on = await conversation(t)
  assert.equal(endOf(await on.say('Quais as regras?', [pdf])), 'complete')
  const sha = createHash('sha256').update(PDF).digest('hex')
  const [path] = placed(on.work)
  assert.ok(path?.endsWith(`${sha}.pdf`), 'the path is the bytes hash')
  assert.ok(path)
  assert.deepEqual(readFileSync(join(on.work, 'uploads', path)), PDF)
  const [first] = on.calls
  assert.ok(first)
  const told = notesOf(first)[0]?.path
  assert.equal(told, join(on.work, 'uploads', path), 'the note says where the file is')
  assert.equal(endOf(await on.say('Veja de novo.', [pdf])), 'complete')
  assert.deepEqual(placed(on.work), [path], 'the same bytes are not written a second time')
})

test('o observador vê o marcador, não o arquivo', async (t) => {
  const on = await conversation(t, (_, index) => ({ kind: 'text', text: index < 2 ? LONG : 'Li.' }))
  assert.equal(endOf(await on.say('Quais as regras?', [pdf, png])), 'complete')
  assert.equal(endOf(await on.say('E os prazos?')), 'complete')
  assert.equal(endOf(await on.say('E as multas?')), 'complete')
  assert.ok(on.observers.length > 0, 'the third turn, past the threshold, was observed')
  for (const observer of on.observers) {
    assert.deepEqual(documentsIn(observer), [], 'the observer does not receive the PDF')
    assert.ok(observer.texts.some((text) => text.includes('[File #1: politica.pdf]')))
    assert.ok(
      observer.media.some((media) => media.type === 'image' && media.mediaType === 'image/png'),
      'the PNG still reaches it',
    )
  }
})

test('a imagem fica com o modelo', async (t) => {
  const on = await conversation(t)
  assert.equal(endOf(await on.say('Veja o logo.', [png])), 'complete')
  for (const call of on.calls) {
    assert.deepEqual(
      call.media.filter((media) => media.type === 'image').map((media) => media.mediaType),
      ['image/png'],
    )
    assert.deepEqual(notesOf(call), [], 'no note for an image')
  }
  assert.deepEqual(placed(on.work), [])
})

test('o arquivo achado depois da observação', async (t) => {
  const on = await conversation(t, (_, index) => {
    if (index < 2) return { kind: 'text', text: LONG }
    if (index === 3) return { kind: 'blocks', blocks: [tool(COMMAND, { command: 'ls uploads/*' })] }
    return { kind: 'text', text: 'Achei.' }
  })
  assert.equal(endOf(await on.say('Quais as regras?', [pdf])), 'complete')
  assert.equal(endOf(await on.say('E os prazos?')), 'complete')
  assert.equal(endOf(await on.say('E as multas?')), 'complete')
  assert.ok(on.observers.length > 0)
  assert.equal(endOf(await on.say('Onde está o PDF?')), 'complete')
  const asking = on.calls[3]
  const found = on.calls[4]
  assert.ok(asking && found)
  assert.ok(
    asking.systems.some((block) => block.text.includes('<observations>')),
    'the call after the observation carries the observation',
  )
  assert.deepEqual(notesOf(asking), [], 'the note went with the observed message')
  assert.match(found.toolResults.at(-1)?.text ?? '', /[0-9a-f]{64}\.pdf/)
})

/** The turn on which the observer first ran, for a conversation of Assistant answers as long as `LONG`. */
async function observedAt(t: TestContext, files: Upload[]) {
  const on = await conversation(t, (_, index) => ({ kind: 'text', text: index < 2 ? LONG : 'Li.' }))
  const big = files.map(() => file('grande.pdf', PDF_TYPE, Buffer.alloc(200_000, 'x')))
  let turn = 0
  for (const question of [
    'Quais as regras?',
    'E os prazos?',
    'E as multas?',
    'E os descontos?',
    'E as taxas?',
  ]) {
    await on.say(question, turn === 0 ? big : [])
    turn += 1
    if (on.observers.length > 0) return turn
  }
  return undefined
}

test('o arquivo conta como a nota', async (t) => {
  const without = await observedAt(t, [])
  const withFile = await observedAt(t, [pdf])
  assert.ok(without !== undefined)
  assert.equal(withFile, without, 'a 200 KB PDF does not bring the observation forward')
})

test('as partes guardadas pelo Mastra: o nome, o tipo e o tamanho de cada arquivo enviado, uma vez', () => {
  const stored = nativeRecording('files')
    .rows.filter((row) => row.table === 'message')
    .map((row) =>
      z
        .object({
          role: z.string().optional(),
          type: z.string().optional(),
          content: z.object({ parts: z.array(z.unknown()) }),
        })
        .parse(row.row),
    )
    .map((row) => ({ role: row.role ?? row.type ?? 'user', content: row.content }))
  const files = sentFilesOf(stored)
  assert.deepEqual(
    files.map((each) => [each.name, each.mediaType, kindOf(each)]),
    [
      ['precos.pdf', 'application/pdf', 'PDF'],
      ['logo.png', 'image/png', 'imagem'],
    ],
  )
  assert.ok(files.every((each) => each.bytes > 0))
})
