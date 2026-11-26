import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP } from './layout-harness.ts'
import { ASSISTANT_PATH } from './sweep-assistant-states.ts'
import { parkedNetworkReplies } from './sweep-network-card.ts'

// A browser's URL parser writes a `*` in a host as `%2A`, where Node keeps it (#1476): only a real
// browser shows that a starred domain still reads as one.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

test('o cartão da internet abre no navegador para um domínio com estrela', async () => {
  const page = await harness.open(ASSISTANT_PATH, {
    viewport: DESKTOP,
    replies: parkedNetworkReplies(['*.cdn.exemplo.com', '*.München.de']),
  })
  const card = page.getByRole('region', { name: 'O Conexus quer acessar a internet' })
  await card.getByRole('button', { name: 'Liberar nesta conversa' }).waitFor()
  const said = await card.innerText()
  for (const base of ['cdn.exemplo.com', 'xn--mnchen-3ya.de'])
    assert.ok(
      said.includes(`qualquer endereço que termina em .${base}, menos o próprio ${base}`),
      said,
    )
  await page.close()
})
