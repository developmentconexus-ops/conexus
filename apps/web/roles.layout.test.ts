import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createHarness, DESKTOP, PHONE } from './layout-harness.ts'
import { AGENT_PATH, agentReplies, COMPANY_ID, rolesReplies } from './sweep-roles.ts'

// Papéis, Pessoas e o agente (Papéis da empresa, U3), in a real browser at 1366 and 390 px, in both
// themes: no sideways scroll, and the control each screen is for within reach.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

const SETTINGS = `/companies/${COMPANY_ID}/settings`
const SCREENS = [
  { name: 'a lista de papéis', path: `${SETTINGS}/roles`, wait: 'Novo papel', agent: false },
  {
    name: 'um papel aberto',
    path: `${SETTINGS}/roles?role=atendente`,
    wait: 'Salvar',
    agent: false,
  },
  { name: 'o papel novo', path: `${SETTINGS}/roles?novo=true`, wait: 'Criar papel', agent: false },
  {
    name: 'o agente com a ligação selecionada',
    path: AGENT_PATH,
    wait: 'Marcar todas as leituras de Matriz',
    agent: true,
  },
]

for (const viewport of [DESKTOP, PHONE])
  for (const scheme of ['light', 'dark'] as const)
    for (const screen of SCREENS)
      test(`${screen.name} cabe na tela de ${viewport.width}px, no tema ${scheme}`, async () => {
        const page = await harness.open(screen.path, {
          viewport,
          scheme,
          replies: screen.agent ? agentReplies(true) : rolesReplies(),
        })
        await page
          .getByRole('button', { name: screen.wait })
          .or(page.getByRole('link', { name: screen.wait }))
          .first()
          .waitFor()
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth),
          viewport.width,
          'a página rola para o lado',
        )
        assert.deepEqual(page.problems, [])
        await page.close()
      })
