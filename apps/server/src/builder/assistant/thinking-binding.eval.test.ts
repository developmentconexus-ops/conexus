import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import { endOf } from '../conversation/test-conversation.ts'
import { created, talking } from './test-assistant.ts'
import { API_KEY_FILE, subscribed } from './test-real-model.ts'

const MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * The real API key path: Anthropic binds each thinking block to the tools list of the request that
 * made it, and the Assistant adds its typed Sankhya reads mid-turn, so without `drop_block` the next
 * request is refused with 400 on a new API-key account and the history keeps it broken. Three turns
 * on Claude Opus 5.5 at max with a spreadsheet attached (`CONEXUS_EVAL_XLSX` names a small one,
 * outside the repository); every call must answer 200 and every turn complete.
 */
test('o modelo de verdade pela chave de API: o pensamento preso a outra lista de ferramentas não derruba o turno nem a conversa seguinte', {
  timeout: 900_000,
}, async (t) => {
  // biome-ignore lint/style/noProcessEnv: the switch of this one opt-in case, not the app's configuration
  const sheet = process.env.CONEXUS_EVAL_XLSX
  if (API_KEY_FILE === undefined || sheet === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_ANTHROPIC_API_KEY_FILE to a file that holds an Anthropic API key, and CONEXUS_EVAL_XLSX to a small spreadsheet of sales by seller',
    )
    return
  }
  const statuses: number[] = []
  const real = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const response = await real(input, init)
    const target = String(input instanceof Request ? input.url : input)
    if (target.startsWith(MESSAGES_URL)) statuses.push(response.status)
    return response
  }
  t.after(() => {
    globalThis.fetch = real
  })
  const on = await subscribed(t, tmpdir(), 'key')
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const talk = await talking(t, on.hub, on.ana, url)
  const data = `data:${XLSX_TYPE};base64,${readFileSync(sheet).toString('base64')}`
  const xlsx = { filename: 'vendas.xlsx', mediaType: XLSX_TYPE, data }
  const turns: [string, (typeof xlsx)[]][] = [
    [
      'Anexei a planilha de vendas por vendedor de setembro. Confira os números dela com o Sankhya da Matriz e me diga se batem.',
      [xlsx],
    ],
    ['Quanto a Filial vendeu em setembro por vendedor?', []],
    ['oi, resuma o que fizemos.', []],
  ]
  const ends: (string | undefined)[] = []
  for (const [text, files] of turns) ends.push(endOf(await talk.say(text, files)))
  assert.deepEqual(
    statuses.filter((status) => status !== 200),
    [],
    `calls ${statuses.length}`,
  )
  assert.deepEqual(ends, ['complete', 'complete', 'complete'])
})
