import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { Connectors } from '../connectors/public.ts'
import type { CopyService } from '../copies/public.ts'
import type { IdentityPorts } from '../identity/public.ts'

export type DataDeps = {
  database: Database
  identity: IdentityPorts
  log: FailureLog
  connectors: () => Pick<Connectors, 'catalogSystems'>
  copies: () => CopyService['data']
}
