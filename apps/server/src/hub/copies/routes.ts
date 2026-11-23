import type { CompanyId, Person } from '@conexus/hub-api'
import {
  grantProjectCopy,
  listCopies,
  listCopyReaders,
  listCopyRuns,
  listProjectCopies,
  revokeProjectCopy,
  sampleCopy,
  setRoleCopies,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { CopyService } from './service.ts'

function inCompany(input: { person: Person; params: { companyId: CompanyId } }) {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/** Who reads each copy, and the copies a role reads. */
function registerReaderRoutes(app: FastifyInstance, copies: CopyService): void {
  serve(app, listCopyReaders, async (input) =>
    answer({ readers: await copies.readers.list(inCompany(input)) }),
  )
  serve(app, setRoleCopies, async (input) => {
    const copied = { role: input.params.role, copies: input.body.copies }
    return answer({ copies: await copies.readers.set({ ...inCompany(input), ...copied }) })
  })
}

/** The company's copies; the service admits the person on each (`readCopies`, `manageCopies`, `seeData` or `manageRoles`, S10). */
export function registerCopyRoutes(app: FastifyInstance, copies: CopyService): void {
  serve(app, listCopies, async (input) => {
    return answer(await copies.list(inCompany(input)))
  })
  registerReaderRoutes(app, copies)
  serve(app, listCopyRuns, async (input) =>
    answer(
      await copies.runs({
        ...{ ...inCompany(input), copyId: input.params.copyId },
        page: input.query.page,
      }),
    ),
  )
  serve(app, sampleCopy, async (input) =>
    answer({
      sample: await copies.sample({
        ...inCompany(input),
        copyId: input.params.copyId,
        signal: input.signal,
      }),
    }),
  )
  serve(app, listProjectCopies, async (input) =>
    answer({
      copies: await copies.ofProject({ ...inCompany(input), projectId: input.params.projectId }),
    }),
  )
  serve(app, grantProjectCopy, async (input) => {
    await copies.grant({ ...inCompany(input), ...input.params })
    return answer({ granted: true })
  })
  serve(app, revokeProjectCopy, async (input) => {
    await copies.revoke({ ...inCompany(input), ...input.params })
    return answer({ granted: false })
  })
}
