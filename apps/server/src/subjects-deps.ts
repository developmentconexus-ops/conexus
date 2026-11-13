import type { GitCopy } from './builder/git/public.ts'
import type {
  ConversationMachine,
  MachinesOf,
  MachineTuning,
  RepositoryOf,
} from './builder/runs/public.ts'
import type { ConnectorTuning } from './hub/connectors/public.ts'
import type { Identity } from './hub/identity/public.ts'
import type { InventoryTuning } from './hub/ontology/public.ts'
import type { CloudflareApps } from './platform/cloudflare.ts'
import type { CompanyPostgres } from './platform/company-postgres.ts'
import type { Config } from './platform/config.ts'
import type { Database, MastraPool } from './platform/database.ts'
import type { FailureLog } from './platform/failure.ts'
import type { SendMail } from './platform/mail.ts'
import type { NeonProjects } from './platform/neon.ts'

/** What `subjectsOf` (`main.ts`) is given: the platform's ports, and the tests' ceilings and deadlines. */
export type SubjectsDeps = {
  database: Database
  config: Config
  identity: Identity
  sendMail: SendMail
  neon: NeonProjects
  companyPostgres: CompanyPostgres
  cloudflare: CloudflareApps
  /** The saved tools' namespace (step 24.4); the Hub calls their host through `createEdgeTools`. */
  cloudflareTools: CloudflareApps
  mastraPool: MastraPool
  machinesOf: MachinesOf
  conversationMachine: ConversationMachine
  /** The tests' folder and start deadline for the conversations' machines (`test-runs.ts`). */
  machineTuning?: MachineTuning
  repository: RepositoryOf
  copy: GitCopy
  log: FailureLog
  tuning?: ConnectorTuning
  /** The tests' ceilings for one inventory run, or `'off'` (`ontology-of.ts`). */
  inventory?: InventoryTuning | 'off'
  /** The tests' budget for a send's prune (`test-hub.ts`); production's by default. */
  pruneBudgetMs?: number
  /** The tests' deadline for one look at an app's database (`test-hub.ts`); the apps' call limit by default. */
  appDataDeadlineMs?: number
}
