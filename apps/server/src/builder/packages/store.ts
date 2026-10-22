import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { PackageName } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { packageGrant } from './tables.ts'

/** A library and the exact version the person allowed. */
export const Grant = z.object({ name: PackageName, version: z.string().min(1) })
export type Grant = z.infer<typeof Grant>

function inCompany(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

/** The libraries the Projetos' owners allowed: the one owner of `builder.package_grant`. */
export class PackageGrants {
  readonly #database: Database
  readonly #log: FailureLog

  constructor(deps: { database: Database; log: FailureLog }) {
    this.#database = deps.database
    this.#log = deps.log
  }

  /** Records the owner's **Permitir**; a package granted before is updated to the new version. */
  async grant(input: {
    companyId: CompanyId
    projectId: ProjectId
    personId: PersonId
    library: Grant
  }): Promise<void> {
    const { companyId, projectId, personId, library } = input
    const grantedAt = new Date()
    await this.#database.command(inCompany(companyId), (tx) =>
      tx
        .insert(packageGrant)
        .values({ companyId, projectId, grantedBy: personId, grantedAt, ...library })
        .onConflictDoUpdate({
          target: [packageGrant.projectId, packageGrant.name],
          set: { version: library.version, grantedBy: personId, grantedAt },
        }),
    )
    this.#log.info({ companyId, projectId, name: library.name }, 'PACKAGE_GRANTED')
  }

  /** What the Projeto may import besides the pre-approved libraries, for every check. */
  async of(companyId: CompanyId, projectId: ProjectId): Promise<Grant[]> {
    const rows = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select({ name: packageGrant.name, version: packageGrant.version })
        .from(packageGrant)
        .where(eq(packageGrant.projectId, projectId)),
    )
    return rows.map((row) => Grant.parse(row))
  }
}
