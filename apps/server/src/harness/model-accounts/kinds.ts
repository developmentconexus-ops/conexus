import type { CompanyId, Person, SignInKind } from '@conexus/hub-api'
import { SignInKind as SignInKindSchema } from '@conexus/hub-api'
import { and, eq, notInArray } from 'drizzle-orm'
import type { IdentityPorts, OperatorProof } from '../../hub/identity/public.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { companyAccountKind } from './tables.ts'

type Deps = { database: Database; identity: IdentityPorts }
type OfClient = { person: Person; companyId: CompanyId }

/** The sign-in kinds the operators opened to the company; the API key is open to every company. */
export async function openKindsOf(tx: ReadTx, companyId: CompanyId): Promise<Set<SignInKind>> {
  const rows = await tx
    .select({ kind: companyAccountKind.kind })
    .from(companyAccountKind)
    .where(eq(companyAccountKind.companyId, companyId))
  return new Set(rows.map(({ kind }) => SignInKindSchema.parse(kind)))
}

function sorted(kinds: Iterable<SignInKind>): SignInKind[] {
  return SignInKindSchema.options.filter((kind) => new Set(kinds).has(kind))
}

/** The operator's own scope on the client's company, which identity admits (security S11). */
async function admitted(
  deps: Deps,
  tx: ReadTx,
  input: OfClient,
  action: 'operateClients' | 'setAccountKinds',
) {
  const proof: OperatorProof = await deps.identity.admitOperator({
    tx,
    personId: input.person.id,
    action,
  })
  const name = await deps.identity.companyNameOf(tx, {
    admitted: proof,
    companyId: input.companyId,
  })
  if (name === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'NO_COMPANY' } })
  return proof
}

function operatorScope(input: OfClient) {
  return { kind: 'OPERATOR', personId: input.person.id, companyId: input.companyId } as const
}

/** The kinds a client's company may link, for the operator. */
export function readKinds(deps: Deps, input: OfClient) {
  return deps.database.read(operatorScope(input), async (tx) => {
    await admitted(deps, tx, input, 'operateClients')
    return { kinds: sorted(await openKindsOf(tx, input.companyId)) }
  })
}

/**
 * Sets the final list of a company's sign-in kinds. Accounts of a kind taken out stay, shown
 * "desligada pela Conexus", and work again when it comes back (founder, C2).
 */
export function setKinds(deps: Deps, input: OfClient & { kinds: SignInKind[] }) {
  return deps.database.command(operatorScope(input), async (tx) => {
    await admitted(deps, tx, input, 'setAccountKinds')
    const kinds = sorted(input.kinds)
    const ofCompany = eq(companyAccountKind.companyId, input.companyId)
    await tx
      .delete(companyAccountKind)
      .where(
        kinds.length === 0 ? ofCompany : and(ofCompany, notInArray(companyAccountKind.kind, kinds)),
      )
    if (kinds.length > 0) {
      await tx
        .insert(companyAccountKind)
        .values(kinds.map((kind) => ({ companyId: input.companyId, kind })))
        .onConflictDoNothing()
    }
    return { kinds }
  })
}
