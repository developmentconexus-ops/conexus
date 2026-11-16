import type { CompanyPostgres } from '../../platform/company-postgres.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { Connectors } from '../connectors/public.ts'
import type { CopyService } from '../copies/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'

export type DataDeps = {
  database: Database
  identity: IdentityPorts
  log: FailureLog
  connectors: () => Pick<Connectors, 'catalogSystems' | 'catalogSources'>
  copies: () => CopyService['data']
  projects: ProjectPorts
  companyPostgres: CompanyPostgres
  neon: NeonProjects
}
