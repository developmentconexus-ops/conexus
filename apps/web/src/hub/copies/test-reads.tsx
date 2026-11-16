import type { CopySample } from '@conexus/hub-api'
import { listCopyReaders, sampleCopy } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { COMPANY } from '../../platform/fixtures.ts'
import { SAMPLE } from './test-sources.ts'

/** Who reads which copy, as a test writes it. */
export type Readers = {
  copyId: string
  roles: { role: string; label: string; members: number }[]
}[]

/** Who reads each copy: what the test holds, or the owner and the administrator for each copy listed. */
export function readersHandler(copies: readonly { id: string }[], held: Readers | undefined) {
  const readers =
    held ??
    copies.map((one) => ({
      copyId: one.id,
      roles: [
        { role: 'owner', label: 'Dono', members: 1 },
        { role: 'admin', label: 'Administrador', members: 1 },
      ],
    }))
  return http.get(`*/api/companies/${COMPANY.id}/copy-readers`, () =>
    HttpResponse.json(listCopyReaders.success.body.parse({ readers })),
  )
}

/** The sample of a copy: its five rows, or what `answer` refuses with. */
export function sampleHandler(held: {
  sample?: CopySample
  answers?: { sample?: () => Response | undefined }
}) {
  return http.get(
    `*/api/companies/${COMPANY.id}/copies/:id/sample`,
    () =>
      held.answers?.sample?.() ??
      HttpResponse.json(sampleCopy.success.body.parse({ sample: held.sample ?? SAMPLE })),
  )
}
