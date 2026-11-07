import type { CompanyId } from '@conexus/hub-api'
import { Role } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { Statements } from './roles.ts'
import { organizationRole } from './tables.ts'

/** Whether two statement sets hold the same actions, whatever their order. */
function sameStatements(left: Statements, right: Statements): boolean {
  const resources = new Set([...Object.keys(left), ...Object.keys(right)])
  return [...resources].every((resource) => {
    const a = new Set(left[resource])
    const b = new Set(right[resource])
    return a.size === b.size && [...a].every((action) => b.has(action))
  })
}

/**
 * The role a creation attempt already made, if any: the same key with another name or another set
 * of statements is a conflict, not a replay (code C37).
 */
export async function replayOf(
  tx: CommandTx,
  input: { companyId: CompanyId; attemptKey: string; label: string; wanted: Statements },
): Promise<Role | undefined> {
  const [found] = await tx
    .select({
      role: organizationRole.role,
      label: organizationRole.label,
      permission: organizationRole.permission,
    })
    .from(organizationRole)
    .where(
      and(
        eq(organizationRole.organizationId, input.companyId),
        eq(organizationRole.attemptKey, input.attemptKey),
      ),
    )
  if (found === undefined) return undefined
  const held = Statements.parse(JSON.parse(found.permission))
  if (found.label !== input.label || !sameStatements(held, input.wanted)) {
    throw new Failure('IDEMPOTENCY_CONFLICT')
  }
  return Role.parse(found.role)
}
