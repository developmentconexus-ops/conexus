import {
  AppVersion,
  listAppVersions,
  PublishRequest,
  publishAppVersion,
  RequestId,
  requestPublish,
} from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { COMPANY } from './fixtures.ts'
import { PEDIDOS } from './test-hub.tsx'

// The Hub's answers for Pedidos' app versions, parsed through the contract as test-hub.tsx does.
const VERSIONS_PATH = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/versions`
export const PUBLISHED_PATH = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/published-version`

/** A version of Pedidos' app as the Hub lists it: ready and kept, unless the test says otherwise. */
export function versionView(number: number, fields: Partial<AppVersion> = {}) {
  return AppVersion.parse({
    id: String(number).padStart(32, 'v'),
    number,
    state: 'ready',
    failure: null,
    sentBy: 'person-ana',
    sentByName: 'Ana Lima',
    createdAt: '2026-10-18T12:00:00.000Z',
    live: false,
    published: false,
    ...fields,
  })
}

/** The list read, answered from `view.versions` at each read; a test changes it between reads. */
export function versionsRead(view: { versions: AppVersion[] }) {
  return http.get(VERSIONS_PATH, () =>
    HttpResponse.json(listAppVersions.success.body.parse({ versions: view.versions })),
  )
}

/** The Hub's 200 for publishing a version. */
export function publishedVersion(version: AppVersion) {
  return HttpResponse.json(publishAppVersion.success.body.parse({ version }))
}

export const PUBLISH_REQUEST_PATH = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/publish-request`
const REQUEST_ID = RequestId.parse('00000000-0000-4000-8000-000000000001')
export const decisionPath = `*/api/companies/${COMPANY.id}/requests/${REQUEST_ID}/decision`
export const cancelPath = `*/api/companies/${COMPANY.id}/requests/${REQUEST_ID}/cancel`

/** Pedidos' open request for version 5, asked two minutes ago by Bruno; the viewer decides or cancels it only when the test says so. */
export function requestView(fields: Partial<PublishRequest> = {}) {
  return PublishRequest.parse({
    id: REQUEST_ID,
    number: 5,
    message: 'pronta para a loja',
    requestedBy: { name: 'Bruno Reis' },
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    mayDecide: false,
    mayCancel: false,
    ...fields,
  })
}

/** The Hub's 201 for asking to publish. */
export function requested(request: PublishRequest) {
  return HttpResponse.json(requestPublish.success.body.parse({ request }), { status: 201 })
}
