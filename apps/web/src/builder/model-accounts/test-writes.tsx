import {
  getAccountKinds,
  ModelDefault,
  ModelFallback,
  ProviderId,
  startModelAccountSignIn,
} from '@conexus/hub-api'
import type { HttpHandler } from 'msw'
import { HttpResponse, http } from 'msw'
import type { Answers, Sent, View } from './test-view.ts'
import { accountOf, BASE, noter, replace } from './test-view.ts'

function accountsWrites(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  const note = noter(sent)
  return [
    http.post(`${BASE}/model-accounts`, async ({ request }) => {
      const body = await note(request)
      const replaced = answers.connect?.()
      if (replaced) return replaced
      const key = String(body.key)
      const owner = body.owner === 'me' ? 'mine' : 'company'
      const account = accountOf({
        label: String(body.label),
        owner: body.owner === 'me' ? 'me' : 'company',
        provider: ProviderId.parse(body.provider),
        hint: key.slice(-4),
        position: view[owner].length,
      })
      view[owner].push(account)
      return HttpResponse.json({ account }, { status: 201 })
    }),
    http.patch(`${BASE}/model-accounts/:accountId`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = answers.change?.()
      if (replaced) return replaced
      replace(view, String(params.accountId), (one) => ({
        ...one,
        ...body,
        revision: one.revision + 1,
      }))
      return HttpResponse.json({
        account: [...view.company, ...view.mine].find((one) => one.id === params.accountId),
      })
    }),
    http.delete(`${BASE}/model-accounts/:accountId`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.remove?.()
      if (replaced) return replaced
      view.company = view.company.filter((one) => one.id !== params.accountId)
      view.mine = view.mine.filter((one) => one.id !== params.accountId)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

function settingsWrites(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  const note = noter(sent)
  return [
    http.put(`${BASE}/model-accounts/:accountId/assignees`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = answers.assign?.()
      if (replaced) return replaced
      const personIds = Array.isArray(body.personIds) ? body.personIds : []
      replace(view, String(params.accountId), (one) => ({ ...one, assignees: personIds }))
      return HttpResponse.json({ account: view.company.find((one) => one.id === params.accountId) })
    }),
    http.put(`${BASE}/model-fallback`, async ({ request }) => {
      const body = ModelFallback.parse(await note(request))
      const replaced = answers.fallback?.()
      if (replaced) return replaced
      view.fallback = { ...body, revision: body.revision + 1 }
      return HttpResponse.json(view.fallback)
    }),
    http.put(`${BASE}/model-account-orders/:owner/:provider`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = answers.order?.()
      if (replaced) return replaced
      const ids = Array.isArray(body.ids) ? body.ids : []
      const key = params.owner === 'me' ? 'mine' : 'company'
      view[key] = view[key].map((one) =>
        ids.includes(one.id) ? { ...one, position: ids.indexOf(one.id) } : one,
      )
      return HttpResponse.json({ accounts: view[key] })
    }),
    http.put('*/api/clients/:companyId/account-kinds', async ({ request }) => {
      const body = await note(request)
      const replaced = answers.kinds?.()
      if (replaced) return replaced
      view.kinds = getAccountKinds.success.body.parse(body).kinds
      return HttpResponse.json({ kinds: view.kinds })
    }),
  ]
}

function signIns(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  const started = { kind: 'claude_subscription', owner: 'company', label: '' }
  return [
    http.post(`${BASE}/model-account-sign-ins`, async ({ request }) => {
      const body = startModelAccountSignIn.input.body.parse(await request.json())
      sent.push({ method: 'POST', path: new URL(request.url).pathname, body, attemptKey: null })
      const replaced = answers.start?.()
      if (replaced) return replaced
      Object.assign(started, body)
      return HttpResponse.json(
        {
          signInId: '00000000-0000-4000-8000-0000000000aa',
          url: 'https://claude.example.test/oauth/authorize?state=abc',
          expiresAt: '2026-10-19T12:10:00.000Z',
        },
        { status: 201 },
      )
    }),
    http.post(`${BASE}/model-account-sign-ins/:signInId`, async ({ request }) => {
      sent.push({
        method: 'POST',
        path: new URL(request.url).pathname,
        body: await request.json(),
        attemptKey: null,
      })
      const replaced = answers.complete?.()
      if (replaced) return replaced
      const owner = started.owner === 'me' ? 'mine' : 'company'
      const account = accountOf({
        label: started.label,
        owner: started.owner === 'me' ? 'me' : 'company',
        kind: started.kind === 'google_cliproxy' ? 'google_cliproxy' : 'claude_subscription',
        hint: null,
        position: view[owner].length,
      })
      view[owner].push(account)
      return HttpResponse.json({ account }, { status: 201 })
    }),
  ]
}

/** The account a start would name: the first of the company, else of the person. */
function firstLabel(view: View): string {
  return view.company[0]?.label ?? view.mine[0]?.label ?? 'Conta'
}

/** The Hub's writes on the defaults: the company's, the person's own and clearing it. */
function defaultWrites(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  const note = noter(sent)
  return [
    http.put(`${BASE}/default-model`, async ({ request }) => {
      const body = await note(request)
      const replaced = answers.default?.()
      if (replaced) return replaced
      const company = ModelDefault.parse(body)
      view.defaults = {
        company,
        mine: view.defaults?.mine ?? null,
        start: view.defaults?.start ?? null,
        companyStart: { ...company, from: 'company', account: firstLabel(view) },
      }
      return HttpResponse.json({ defaultModel: company })
    }),
    http.put(`${BASE}/my-model-default`, async ({ request }) => {
      const body = await note(request)
      const replaced = answers.mine?.()
      if (replaced) return replaced
      const mine = ModelDefault.parse(body)
      view.defaults = {
        company: view.defaults?.company ?? null,
        mine,
        start: { ...mine, from: 'mine', account: firstLabel(view) },
        companyStart: view.defaults?.companyStart ?? null,
      }
      return HttpResponse.json({ mine })
    }),
    http.delete(`${BASE}/my-model-default`, async ({ request }) => {
      await note(request)
      const replaced = answers.clear?.()
      if (replaced) return replaced
      const company = view.defaults?.company ?? null
      view.defaults = {
        company,
        mine: null,
        start: company === null ? null : { ...company, from: 'company', account: firstLabel(view) },
        companyStart: view.defaults?.companyStart ?? null,
      }
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

/** The Hub's writes on the company's model accounts, as they change `view` and are noted in `sent`. */
export function writes(view: View, sent: Sent[], answers: Answers) {
  return [
    ...accountsWrites(view, sent, answers),
    ...settingsWrites(view, sent, answers),
    ...defaultWrites(view, sent, answers),
    ...signIns(view, sent, answers),
  ]
}
