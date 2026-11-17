import { randomUUID } from 'node:crypto'
import type { CopySummary } from '@conexus/hub-api'
import { CompanyId, ConversationId, PersonId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { Failure } from '../../platform/failure.ts'
import { copyRunsTool } from '../company-tools/copy-runs.ts'
import type { Owner, RunScope } from '../controller-kit/public.ts'

function runOf(owner: Owner, kind: 'THREAD' | 'TRIAL'): RunScope {
  return {
    ...{ kind: 'assistant', owner, place: { kind: 'COMPANY' } },
    conversation: kind === 'THREAD' ? { kind, id: ConversationId.parse(randomUUID()) } : { kind },
    ...{ choice: { kind: 'ANY' }, ceiling: { kind: 'PERSON' }, attended: true },
  }
}

/** What the tool throws when the copy `list` named is gone by the time `runs` asks for it. */
export async function copyGoneBetween(
  listed: { companyId: CompanyId; personId: PersonId; copies: CopySummary[] },
  table: string,
): Promise<Error> {
  const { companyId, personId, copies } = listed
  const tables = copies.map((each) => each.name)
  const tool = copyRunsTool({ run: runOf({ companyId, personId }, 'THREAD'), tables }, () => ({
    list: async () => ({ copies }),
    runs: async () => {
      throw new Failure('COPY_NOT_FOUND')
    },
  }))
  if (tool.execute === undefined) throw new Error('copy_runs has no execute')
  try {
    await tool.execute({ table }, { requestContext: new RequestContext() })
  } catch (thrown) {
    if (thrown instanceof Error) return thrown
    throw thrown
  }
  throw new Error('copy_runs answered')
}

/** What the tool throws when its run has no conversation. */
export async function copyRunsWithoutConversation(): Promise<Failure> {
  const owner = {
    companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
    personId: PersonId.parse(randomUUID()),
  }
  const tool = copyRunsTool({ run: runOf(owner, 'TRIAL'), tables: ['sankhya_vendas'] }, () => {
    throw new Error('the copies are not reached outside a turn')
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
