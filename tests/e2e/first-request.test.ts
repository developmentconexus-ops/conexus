import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  ANA,
  ANSWER,
  ask,
  chooseDefaultModel,
  KEYS,
  plantJourney,
  plantTwoCompanies,
  publicPage,
  transcriptOf,
} from './conversation-journey.ts'
import { hubWindow } from './hub-window.ts'
import { liveHub, waitForHome } from './live-hub.ts'
import { enter, linkKey } from './model-accounts-journey.ts'

// Step 13.1's use script in Chromium, on a real Hub and the provider's double: Ana writes her first
// request in Início's box, names the Projeto, and the conversation opens with her request sent once
// and the Builder's answer (testing T14).
const REQUEST = 'Um app de encomendas com cliente, data de entrega e valor'

test('o primeiro pedido pelo Início: a caixa, o nome, e a conversa abre com o pedido e a resposta', async (t) => {
  const journey = plantJourney(t, await publicPage(t))
  journey.state.reads = false
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const ids = await plantTwoCompanies(database)
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  try {
    const page = await hubWindow(closers, port, '198.51.100.10', problems)
    await enter(page, ANA.email, `/companies/${ids.companyA}/settings/model-accounts`)
    await linkKey(page, 'Time 1', KEYS.first)
    await page.getByText('Time 1', { exact: true }).first().waitFor()
    await chooseDefaultModel(page, ids.companyA)
    // Início asks the Builder only for a member: the owner's asks the Assistant.
    await database.asOwner(
      `update auth.member set role = 'member'
        where company_id = $1 and user_id = (select id from auth.user where email = $2)`,
      [ids.companyA, ANA.email],
    )
    await page.goto(`${TEST_ORIGIN}/companies/${ids.companyA}`)
    await waitForHome(page)
    await ask(page, REQUEST)
    await page.getByLabel('Nome do projeto').fill('Encomendas')
    await page.getByRole('button', { name: 'Criar e começar', exact: true }).click()
    await page.waitForURL((url) => url.pathname.includes('/conversations/'))
    const transcript = transcriptOf(page)
    await transcript.getByText(ANSWER).waitFor()
    assert.equal(await transcript.getByText(REQUEST, { exact: true }).count(), 1)
    // One turn: the request reached the model once.
    assert.equal(journey.anthropic.sent.filter((sent) => sent.stream).length, 1)
    assert.deepEqual(problems, [])
  } finally {
    for (const close of closers) await close()
  }
})
