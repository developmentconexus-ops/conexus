import { AppVersion, createAppVersion, listAppVersions, setLiveVersion } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { COMPANY } from './fixtures.ts'
import { PEDIDOS } from './test-hub.tsx'

// The Hub's answers for Pedidos' app versions, parsed through the contract as test-hub.tsx does.
export const VERSIONS_PATH = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/versions`
export const LIVE_PATH = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/live-version`

/** A version of Pedidos' app as the Hub lists it: ready and kept, unless the test says otherwise. */
export function versionView(number: number, fields: Partial<AppVersion> = {}) {
  return AppVersion.parse({
    id: String(number).padStart(32, 'v'),
    number,
    state: 'ready',
    failure: null,
    sentBy: 'person-ana',
    createdAt: '2026-10-18T12:00:00.000Z',
    live: false,
    ...fields,
  })
}

/** The list read, answered from `view.versions` at each read; a test changes it between reads. */
export function versionsRead(view: { versions: AppVersion[] }) {
  return http.get(VERSIONS_PATH, () =>
    HttpResponse.json(listAppVersions.success.body.parse({ versions: view.versions })),
  )
}

/** The Hub's 201 for a send, and its 200 for putting a version back. */
export function sentVersion(version: AppVersion) {
  return HttpResponse.json(createAppVersion.success.body.parse({ version }), { status: 201 })
}
export function livedVersion(version: AppVersion) {
  return HttpResponse.json(setLiveVersion.success.body.parse({ version }))
}
