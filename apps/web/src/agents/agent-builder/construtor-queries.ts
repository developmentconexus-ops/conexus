import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { listConstrutorConversations, setConstrutorModel } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

export function construtorConversationsQuery(scope: Scope) {
  return hubQuery(listConstrutorConversations, { params: scope })
}

export const sendConstrutorModel = hubMutation(setConstrutorModel)
