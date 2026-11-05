import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import { companyOn, post } from '../../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../../platform/test-database.ts'
import { plantCodex } from '../../../platform/test-openai-codex.ts'

/** Empresa Teste with the ChatGPT subscription open, the vendor doubled, and the sign-in's routes. */
export async function opened(t: TestContext) {
  const codex = plantCodex(t)
  const { hub, ana, companyId } = await companyOn(t)
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [companyId],
  )
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  type Who = Parameters<typeof post>[1]
  async function start(who: Who = ana, owner = 'company') {
    const started = await post(hub, who, signIns, { owner, kind: 'openai_codex', label: 'ChatGPT' })
    assert.equal(started.statusCode, 201, started.body)
    return Object(started.json())
  }
  // The poll has no body, so it carries no content type: the way the web sends it.
  function poll(signInId: string, who: Who = ana, company: string = companyId) {
    return hub.app.inject({
      method: 'POST',
      url: `/api/companies/${company}/model-account-sign-ins/${signInId}/poll`,
      headers: { origin: TEST_ORIGIN, cookie: who.cookie, [ATTEMPT_KEY_HEADER]: randomUUID() },
    })
  }
  /** The vendor may be asked again now: the interval the Hub kept has passed. */
  function due() {
    return hub.test.asOwner(
      `update builder.model_account_sign_in set poll_at = statement_timestamp()`,
    )
  }
  function entries() {
    return hub.test.asOwner(`select id from builder.model_account_sign_in`)
  }
  function accounts() {
    return hub.test.asOwner(`select id from builder.model_account`)
  }
  function calls(endpoint: string) {
    return codex.calls.filter((made) => made.endpoint === endpoint).length
  }
  return { hub, ana, companyId, codex, signIns, start, poll, due, entries, accounts, calls }
}
