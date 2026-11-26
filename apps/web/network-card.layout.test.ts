import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { ASSISTANT_PATH } from './sweep-assistant-states.ts'
import { parkedNetworkReplies } from './sweep-network-card.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

// A browser's URL parser writes a `*` in a host as `%2A`, where Node keeps it (#1476): only a real
// browser shows that a starred domain still reads as one.
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

test('os botões do cartão: a empresa primeiro no computador, a primária por cima no celular', async () => {
  for (const [viewport, expected] of [
    [DESKTOP, ['Liberar para a empresa', 'Liberar nesta conversa', 'Recusar']],
    [PHONE, ['Liberar nesta conversa', 'Liberar para a empresa', 'Recusar']],
  ] as const) {
    const page = await harness.open(ASSISTANT_PATH, {
      viewport,
      replies: parkedNetworkReplies(['loja.exemplo.com.br']),
    })
    const card = page.getByRole('region', { name: 'O Conexus quer acessar a internet' })
    await card.getByRole('button', { name: 'Liberar para a empresa' }).waitFor()
    const read = await card.getByRole('button').evaluateAll((buttons) =>
      buttons
        .map((button) => ({ box: button.getBoundingClientRect(), name: button.textContent }))
        .sort((a, b) => a.box.top - b.box.top || a.box.left - b.box.left)
        .map((each) => each.name),
    )
    assert.deepEqual(read, expected, `at ${viewport.width}px`)
    await page.close()
  }
})
