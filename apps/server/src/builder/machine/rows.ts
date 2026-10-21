import type { CompanyId } from '@conexus/hub-api'
import { ProjectId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { Database } from '../../platform/database.ts'
import { SandboxId } from './kit.ts'
import { machine } from './tables.ts'

function inCompany(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

/** The one owner of the `builder.machine` rows: what the Projeto's machine is and when a turn last used it. */
export class MachineRows {
  readonly #database: Database

  constructor(database: Database) {
    this.#database = database
  }

  async of(companyId: CompanyId, projectId: ProjectId) {
    const [row] = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select({ sandboxId: machine.sandboxId, usedAt: machine.usedAt })
        .from(machine)
        .where(eq(machine.projectId, projectId)),
    )
    return row === undefined
      ? undefined
      : { sandboxId: SandboxId.parse(row.sandboxId), usedAt: row.usedAt }
  }

  async remember(input: { companyId: CompanyId; projectId: ProjectId; sandboxId: SandboxId }) {
    const { companyId, projectId, sandboxId } = input
    const usedAt = new Date()
    await this.#database.command(inCompany(companyId), (tx) =>
      tx
        .insert(machine)
        .values({ projectId, companyId, sandboxId, usedAt })
        .onConflictDoUpdate({ target: machine.projectId, set: { sandboxId, usedAt } }),
    )
  }

  async forget(companyId: CompanyId, projectId: ProjectId) {
    await this.#database.command(inCompany(companyId), (tx) =>
      tx.delete(machine).where(eq(machine.projectId, projectId)),
    )
  }

  async projectsOf(companyId: CompanyId) {
    const rows = await this.#database.read(inCompany(companyId), (tx) =>
      tx.select({ id: machine.projectId }).from(machine),
    )
    return rows.map((row) => ProjectId.parse(row.id))
  }
}
