import { CompanyId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { logFailure } from '../../platform/failure.ts'
import { dropDefinitions, versionDefinitionIds } from './definitions.ts'
import { parseMastraWorkflowId } from './ids.ts'
import { workflowVersion } from './tables.ts'

// A row of `builder.companies_with_workflows()`.
const WithWorkflows = z.object({ company_id: CompanyId })

/** The versions the Hub holds, company by company: the companies come from the one function the Hub's login runs before any company is known (D11). */
async function heldVersions(deps: { database: Database; log: FailureLog }) {
  const { database, log } = deps
  const companies = await database.installationRead((tx) =>
    tx.execute(sql`select company_id from builder.companies_with_workflows()`),
  )
  const held = new Set<string>()
  let complete = true
  for (const found of companies.rows) {
    const { company_id: companyId } = WithWorkflows.parse(found)
    try {
      const rows = await database.read({ kind: 'COMPANY', companyId, personId: null }, (tx) =>
        tx
          .select({ id: workflowVersion.workflowId, number: workflowVersion.number })
          .from(workflowVersion),
      )
      for (const row of rows) held.add(`${row.id}/${row.number}`)
    } catch (error) {
      complete = false
      logFailure(log, databaseFailure(error), { companyId }, 'WORKFLOW_BOOT_COMPANY_FAILED')
    }
  }
  return { held, complete }
}

/**
 * The pass at start, after the Hub answers: Mastra loads every published version at its own start
 * (`startWorkers`), and what it holds without a version in the Hub (a publish that crashed
 * between the registration and the commit, a delete that stopped halfway) is dropped. A company
 * that fails is logged and its definitions wait for the next start, so none is dropped on a
 * guess.
 */
export async function dropOrphans(deps: {
  database: Database
  mastra: Mastra
  log: FailureLog
}): Promise<void> {
  const { held, complete } = await heldVersions(deps)
  if (!complete) return
  const orphans = (await versionDefinitionIds(deps.mastra)).filter((id) => {
    const parsed = parseMastraWorkflowId(id)
    return parsed?.kind === 'VERSION' && !held.has(`${parsed.workflowId}/${parsed.version}`)
  })
  await dropDefinitions(deps.mastra, orphans)
  if (orphans.length > 0) deps.log.info({ count: orphans.length }, 'WORKFLOW_ORPHANS_DROPPED')
}
