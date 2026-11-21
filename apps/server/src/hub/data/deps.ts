import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { Access } from '../access/public.ts'
import type { CopyService } from '../copies/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'

export type DataDeps = {
  database: Database
  identity: IdentityPorts
  log: FailureLog
  access: Access
  copies: () => CopyService['data']
  projects: ProjectPorts
}
