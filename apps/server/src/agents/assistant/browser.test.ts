import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { MACHINE_TOOL } from '@conexus/hub-api'
import { z } from 'zod'
import { realBrowser } from '../../harness/machine/test-confer.ts'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { requestOf } from '../../harness/spec/test-request.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const PAGE = '<!doctype html><title>Padaria de teste</title><h1>Pão francês: R$ 0,80</h1>'
const SHOT = 'shots/padaria.png'

async function testSite(t: TestContext) {
  const site = createServer((_, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    response.end(PAGE)
  })
  await new Promise<void>((up) => site.listen(0, '127.0.0.1', up))
  t.after(() => site.close())
  return `http://127.0.0.1:${z.object({ port: z.number() }).parse(site.address()).port}/`
}

const ToolBlocks = z.object({
  messages: z.array(
    z.object({
      content: z.union([z.string(), z.array(z.looseObject({ type: z.string() }))]),
    }),
  ),
})

function toolBlocksOf(body: unknown) {
  return ToolBlocks.parse(body).messages.flatMap(({ content }) =>
    typeof content === 'string' ? [] : content.filter((each) => each.type.startsWith('tool_')),
  )
}

test('o navegador: o agente abre um site de teste servido na máquina com agent-browser, tira a captura, a lê como imagem por read_file e a mostra por show_file (19)', async (t) => {
  const url = await testSite(t)
  // The hooks run in the order they were added: the daemon closes before its program is removed.
  // It was started by the machine, with no `XDG_RUNTIME_DIR`, so its socket is found without one.
  let browser = ''
  t.after(() => execFileSync(browser, ['close'], { env: {} }))
  browser = realBrowser(t)
  const command = [
    `'${browser}' open '${url}'`,
    `'${browser}' wait --load networkidle`,
    'mkdir -p shots',
    `'${browser}' screenshot "$PWD/${SHOT}"`,
  ].join(' && ')
  const on = await assisting(t, [
    [tool('mastra_workspace_execute_command', { command })],
    [tool('mastra_workspace_read_file', { path: SHOT })],
    [tool(MACHINE_TOOL.showFile, { path: SHOT })],
    [said('Mostrei a captura.')],
  ])
  const conversation = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, conversation)
  const events = await say('Abra a página da padaria e me mostre')
  assert.equal(endOf(events), 'complete')

  const png = readFileSync(`${on.hub.conversationMachines.folder}/work/${SHOT}`)
  assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG')
  const [, read, shown] = toolBlocksOf(on.calls.at(-1)?.body).filter(
    (block) => block.type === 'tool_result',
  )
  const image = z
    .object({
      content: z.array(z.looseObject({ type: z.string(), source: z.unknown().optional() })),
    })
    .parse(read)
    .content.find((block) => block.type === 'image')
  assert.deepEqual(image?.source, {
    type: 'base64',
    media_type: 'image/png',
    data: png.toString('base64'),
  })
  assert.match(JSON.stringify(shown), /shots\/padaria\.png/)
  // The command's own output stays out: the browser's words change with its version and the day.
  const [ran, , ...rest] = toolBlocksOf(on.calls.at(-1)?.body)
  const conversationRead = JSON.stringify([ran, ...rest])
    .replaceAll(browser, 'agent-browser')
    .replaceAll(new URL(url).host, '<site>')
    .replaceAll(on.hub.conversationMachines.folder, '<folder>')
    .replaceAll(png.toString('base64'), '<png>')
    .replaceAll(`${png.length} bytes`, '<bytes>')
  t.assert.fileSnapshot(
    requestOf(JSON.parse(conversationRead)),
    fileURLToPath(new URL('./requests/navegador.snapshot', import.meta.url)),
  )
  const shownResult = events.flatMap((event) => (event.type === 'tool_end' ? [event] : [])).at(-1)
  assert.deepEqual(
    z.object({ kind: z.string(), name: z.string(), media: z.string() }).parse(shownResult?.result),
    { kind: 'FILE', name: 'padaria.png', media: 'image/png' },
  )
})
