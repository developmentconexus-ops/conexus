import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { AppRead, AppTablesRead, SqlStatement } from '../../hub/apps/public.ts'

/** What an agent asks of its Projeto's app (step 24.3, U3): the apps' door, which reads and never writes. */
export type AppDataPort = {
  hasApp(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
  }): Promise<boolean>
  /** The app's tables and their columns, which the Construtor reads as the Dados page does. */
  tables(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    signal: AbortSignal
  }): Promise<AppTablesRead>
  read(input: {
    scope: { companyId: CompanyId; personId: PersonId }
    projectId: ProjectId
    statement: SqlStatement
    signal: AbortSignal
  }): Promise<AppRead>
}
