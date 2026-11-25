import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { listConstrutorConversations } from '@conexus/hub-api'
import { hubQuery } from '../../platform/hub.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

export function construtorConversationsQuery(scope: Scope) {
  return hubQuery(listConstrutorConversations, { params: scope })
}
