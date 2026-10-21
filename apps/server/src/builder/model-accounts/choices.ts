import type { Owner, PersonId, Provider } from '@conexus/hub-api'
import type { ReadTx } from '../../platform/database.ts'
import type { AccountRow, Context, Viewer } from './accounts.ts'
import { accountsOf, partOf } from './accounts.ts'
import { keyProviderOf } from './providers.ts'
import { servesModel } from './served.ts'

/**
 * What a picker offers (P5): the providers with an account in any state, paused or limited too,
 * each with the models those accounts serve. For `me`, the person's own accounts and the company's
 * given to them or to all; for `company`, the company's own.
 */
export function choicesOf(
  rows: AccountRow[],
  context: Context,
  owner: Owner,
  personId: PersonId,
): Provider[] {
  const own = rows.filter((row) =>
    owner === 'company' ? row.personId === null : partOf(row, context, personId) !== undefined,
  )
  return [...new Set(own.map((row) => row.provider))].sort().flatMap((id) => {
    const provider = keyProviderOf(id)
    const accounts = own.filter((row) => row.provider === id)
    const models = provider?.models.filter((model) =>
      accounts.some((row) => servesModel(row, model.id)),
    )
    return provider === undefined || models === undefined || models.length === 0
      ? []
      : [{ ...provider, models }]
  })
}

/** The same, read in the transaction. */
export async function choicesIn(tx: ReadTx, viewer: Viewer, owner: Owner): Promise<Provider[]> {
  const { rows, context } = await accountsOf(tx, viewer.companyId)
  return choicesOf(rows, context, owner, viewer.person.id)
}
