import type { CompanyId, Person } from '@conexus/hub-api'
import {
  changeCopyInterval,
  enableCopy,
  grantProjectCopy,
  listCopies,
  listCopyModels,
  listCopyRuns,
  listProjectCopies,
  pauseCopy,
  resumeCopy,
  revokeProjectCopy,
  runCopy,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { CopyService } from './service.ts'

function inCompany(input: { person: Person; params: { companyId: CompanyId } }) {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/** The company's copies; the service admits the person on each (`readCopies` or `manageCopies`, S10). */
export function registerCopyRoutes(app: FastifyInstance, copies: CopyService): void {
  serve(app, listCopies, async (input) => answer({ copies: await copies.list(inCompany(input)) }))
  serve(app, listCopyModels, async (input) =>
    answer({ models: await copies.models(inCompany(input)) }),
  )
  serve(app, enableCopy, async (input) => {
    const { connectionId, model, interval } = input.body
    const made = await copies.enable({
      ...inCompany(input),
      ...{ connectionId, interval, attemptKey: input.attemptKey },
      source: { kind: 'MODEL', model },
    })
    return answer({ copy: await copies.summaryOf({ ...inCompany(input), copyId: made }) })
  })
  serve(app, pauseCopy, async (input) =>
    answer({ copy: await copies.pause({ ...inCompany(input), copyId: input.params.copyId }) }),
  )
  serve(app, resumeCopy, async (input) =>
    answer({ copy: await copies.resume({ ...inCompany(input), copyId: input.params.copyId }) }),
  )
  serve(app, changeCopyInterval, async (input) =>
    answer({
      copy: await copies.changeInterval({
        ...{ ...inCompany(input), copyId: input.params.copyId },
        interval: input.body.interval,
      }),
    }),
  )
  serve(app, runCopy, async (input) => {
    await copies.runNow({ ...inCompany(input), copyId: input.params.copyId })
    return answer({})
  })
  serve(app, listCopyRuns, async (input) =>
    answer(
      await copies.runs({
        ...{ ...inCompany(input), copyId: input.params.copyId },
        page: input.query.page,
      }),
    ),
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
