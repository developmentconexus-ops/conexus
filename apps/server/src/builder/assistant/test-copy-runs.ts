import type { CompanyId, CopySummary, PersonId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { Failure } from '../../platform/failure.ts'
import { copyRunsTool } from './copy-runs.ts'

/** What the tool throws when the copy `list` named is gone by the time `runs` asks for it. */
export async function copyGoneBetween(
  listed: { companyId: CompanyId; personId: PersonId; copies: CopySummary[] },
  table: string,
): Promise<Error> {
  const { companyId, personId, copies } = listed
  const tool = copyRunsTool({
    scopeOf: async () => ({ companyId, personId }),
    copies: () => ({
      list: async () => ({ copies }),
      runs: async () => {
        throw new Failure('COPY_NOT_FOUND')
      },
    }),
  })
  if (tool.execute === undefined) throw new Error('copy_runs has no execute')
  try {
    await tool.execute({ table }, { requestContext: new RequestContext() })
  } catch (thrown) {
    if (thrown instanceof Error) return thrown
    throw thrown
  }
  throw new Error('copy_runs answered')
}

/** What the tool throws when it is called outside a conversation, where no scope is found. */
export async function copyRunsWithoutConversation(): Promise<Failure> {
  const tool = copyRunsTool({
    scopeOf: async () => undefined,
    copies: () => {
      throw new Error('the copies are not reached without a scope')
    },
  })
  if (tool.execute === undefined) throw new Error('copy_runs has no execute')
  try {
    await tool.execute({ table: 'sankhya_vendas' }, { requestContext: new RequestContext() })
  } catch (thrown) {
    if (thrown instanceof Failure) return thrown
    throw thrown
  }
  throw new Error('copy_runs answered')
}
