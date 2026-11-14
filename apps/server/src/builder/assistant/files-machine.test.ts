import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { setImmediate, setTimeout as sleep } from 'node:timers/promises'
import { post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import {
  endOf,
  hubBeside,
  messagesOf,
  sessionUrl,
  stopped,
} from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { tool } from '../conversation/test-questions.ts'
import type { Control } from '../machine/test-machine.ts'
import { assisting, created, talking } from './test-assistant.ts'
import {
  conversation,
  documentsIn,
  file,
  notesOf,
  PDF_TYPE,
  PNG,
  pdf,
  placed,
  READ_FILE,
  Typed,
} from './test-files.ts'

test('o teto é o da rota', async (t) => {
  // The stream's reader is not used: it parses the turn's events, which carry the whole file.
  const calls: Sent[] = []
  const on = await assisting(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    calls.push(asked)
    return { kind: 'text', text: 'Li.' }
  })
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const bytes = Buffer.concat([Buffer.from('%PDF-1.4\n'), randomBytes(11_000_000)])
  const sent = await post(on.hub, on.ana, `${sessionUrl(url)}/messages`, {
    message: 'Leia.',
    files: [file('grande.pdf', PDF_TYPE, bytes)],
  })
  assert.equal(sent.statusCode, 200, sent.body)
  let answered = false
  for (let wait = 0; wait < 100 && !answered; wait++) {
    answered = (await messagesOf(on.hub, on.ana, url)).some((each) => each.role === 'builder')
    if (!answered) await sleep(200)
  }
  assert.ok(answered, 'the turn ends with an answer')
  const [call] = calls
  assert.ok(call)
  assert.deepEqual(documentsIn(call), [])
  assert.equal(notesOf(call)[0]?.size, `${bytes.length} bytes`)
  const [path] = placed(join(on.hub.assistantMachines.folder, 'work'))
  assert.ok(path)
  assert.deepEqual(
    readFileSync(join(on.hub.assistantMachines.folder, 'work', 'uploads', path)),
    bytes,
  )
})

test('read_file: o PDF só por metadados', async (t) => {
  const held: { control?: Control } = {}
  const on = await conversation(t, (asked, index) => {
    if (index === 0) {
      Object.defineProperty(held.control?.sandbox, 'filesystem', {
        value: new Typed({ basePath: '/', contained: false }),
      })
      return {
        kind: 'blocks',
        blocks: [tool(READ_FILE, { path: notesOf(asked)[0]?.path ?? 'faltou-a-nota' })],
      }
    }
    return index === 1
      ? { kind: 'blocks', blocks: [tool(READ_FILE, { path: 'logo.png' })] }
      : { kind: 'text', text: 'Li.' }
  })
  held.control = on.hub.assistantMachines.control
  mkdirSync(on.work, { recursive: true })
  writeFileSync(join(on.work, 'logo.png'), PNG)
  assert.equal(endOf(await on.say('Leia o PDF.', [pdf])), 'complete')
  const [, afterPdf, afterPng] = on.calls
  assert.ok(afterPdf && afterPng)
  assert.deepEqual(documentsIn(afterPdf), [], 'the PDF is not handed back as media')
  assert.match(
    afterPdf.toolResults.at(-1)?.text ?? '',
    /\(\d+ bytes, application\/pdf\) — binary file/,
  )
  assert.equal(afterPng.toolUses.length, 2, 'both reads reached the model')
  assert.equal(
    afterPng.toolResults.length,
    1,
    'the PNG read came back as a media block, which the double does not list as text',
  )
})

test('a máquina fora: o turno falha e o arquivo não vaza', async (t) => {
  const on = await conversation(t)
  on.hub.assistantMachines.control.start = 'unreachable'
  const events = await on.say('Quais as regras?', [pdf])
  assert.deepEqual(failuresOf(events), ['MACHINE_UNAVAILABLE'])
  assert.deepEqual(on.calls.flatMap(documentsIn), [])
  assert.ok(on.hub.lines.some((line) => line.message === 'MACHINE_UNAVAILABLE'))
})

test('a máquina fora com o arquivo só do histórico: o turno segue com a nota', async (t) => {
  const on = await conversation(t)
  assert.equal(endOf(await on.say('Quais as regras?', [pdf])), 'complete')
  const [first] = on.calls
  assert.ok(first)
  const restarted = await hubBeside(t, on.hub)
  restarted.assistantMachines.control.start = 'unreachable'
  const next = await talking(t, restarted, on.ana, on.url)
  assert.equal(endOf(await next.say('E os prazos?')), 'complete')
  assert.equal(on.calls.length, 2, 'the second question reached the model')
  assert.ok(
    on.calls[1]?.texts.some((text) => text.startsWith('[File not uploaded]')),
    'the native note',
  )
})

test('o turno seguinte reusa a máquina que o anterior deixou ligada', async (t) => {
  const on = await conversation(t)
  const { control } = on.hub.assistantMachines
  assert.equal(endOf(await on.say('Quais as regras?', [pdf])), 'complete')
  assert.equal(endOf(await on.say('Oi')), 'complete')
  assert.equal(endOf(await on.say('Obrigado')), 'complete')
  assert.equal(control.names.length, 1, 'one start for the three turns')
  assert.equal(control.stops, 0, 'no turn ended by stopping the machine')
  assert.equal(placed(on.work).length, 1, 'the file was written once')
})

test('a gravação recusada: o turno falha e o arquivo não vaza', async (t) => {
  const on = await conversation(t)
  mkdirSync(join(on.work, 'uploads'), { recursive: true })
  chmodSync(join(on.work, 'uploads'), 0o500)
  t.after(() => existsSync(join(on.work, 'uploads')) && chmodSync(join(on.work, 'uploads'), 0o700))
  const events = await on.say('Quais as regras?', [pdf])
  assert.deepEqual(failuresOf(events), ['MACHINE_UNAVAILABLE'])
  assert.deepEqual(on.calls.flatMap(documentsIn), [])
  const line = on.hub.lines.find((each) => each.fields.reason === 'UPLOAD')
  assert.equal(line?.message, 'MACHINE_UNAVAILABLE')
  assert.equal(line?.fields.code, 'UPLOAD_FAILED')
  assert.doesNotMatch(JSON.stringify(on.hub.lines), /politica/)
})

type Machine = {
  executeCommand: (
    command: string,
    args: string[],
    options: { abortSignal: AbortSignal },
  ) => Promise<unknown>
}

test('parar no meio da gravação não é a máquina fora', async (t) => {
  const on = await conversation(t)
  const writing = Promise.withResolvers<void>()
  const cut = Promise.withResolvers<void>()
  let box: unknown
  Object.defineProperty(on.hub.assistantMachines.control, 'sandbox', {
    configurable: true,
    get: () => box,
    set(next: Machine) {
      box = next
      const run = next.executeCommand.bind(next)
      next.executeCommand = (command, args, options) => {
        if (!args[1]?.startsWith("printf '%s'")) return run(command, args, options)
        writing.resolve()
        return new Promise((_, reject) =>
          options.abortSignal.addEventListener(
            'abort',
            () => {
              reject(new Error('write cut'))
              cut.resolve()
            },
            { once: true },
          ),
        )
      }
    },
  })
  const turn = on.say('Quais as regras?', [pdf])
  await writing.promise
  assert.equal((await stopped(on.hub, on.ana, on.url)).statusCode, 200)
  const events = await turn
  assert.equal(endOf(events), 'aborted')
  assert.deepEqual(failuresOf(events), [])
  // The native writer reads the cut write after the turn has ended; its follow-up is the processor's
  // `abort`, which would log the machine as out if the guard did not tell a stop from a failure.
  await cut.promise
  for (let turns = 0; turns < 20; turns += 1) await setImmediate()
  assert.equal(
    on.hub.lines.some((line) => line.message === 'MACHINE_UNAVAILABLE'),
    false,
  )
  assert.deepEqual(on.calls.flatMap(documentsIn), [])
  assert.equal(
    placed(on.work).some((path) => path.endsWith('.pdf')),
    false,
    'no partial file at the final path',
  )
})
