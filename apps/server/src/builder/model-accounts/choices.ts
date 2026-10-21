import type { Owner, PersonId, Provider } from '@conexus/hub-api'
import { ModelId } from '@conexus/hub-api'
import type { ReadTx } from '../../platform/database.ts'
import type { AccountRow, Context, Viewer } from './accounts.ts'
import { accountsOf, partOf } from './accounts.ts'
import { keyProviderOf } from './providers.ts'
import { servesModel } from './served.ts'
import { effortsOf } from './thinking.ts'

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
    if (provider === undefined) return []
    // The registry's models first, then the names an account serves them by that it lacks.
    const named = accounts.flatMap((row) => row.served ?? []).map((name) => `${id}/${name}`)
    const models = [...new Set([...provider.models.map((model) => model.id), ...named])]
      .flatMap((model) => {
        const parsed = ModelId.safeParse(model)
        return parsed.success && accounts.some((row) => servesModel(row, parsed.data))
          ? [parsed.data]
          : []
      })
      .map((model) => ({ id: model, efforts: effortsOf(model) }))
    return models.length === 0 ? [] : [{ ...provider, models }]
  })
}

/** The same, read in the transaction. */
export async function choicesIn(tx: ReadTx, viewer: Viewer, owner: Owner): Promise<Provider[]> {
  const { rows, context } = await accountsOf(tx, viewer.companyId)
  return choicesOf(rows, context, owner, viewer.person.id)
}
