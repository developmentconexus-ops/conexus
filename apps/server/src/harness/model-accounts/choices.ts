import type { Owner, PersonId, Provider } from '@conexus/hub-api'
import { ModelId } from '@conexus/hub-api'
import type { ReadTx } from '../../platform/database.ts'
import type { AccountRow, Context, Viewer } from './accounts.ts'
import { accountsOf, partOf } from './accounts.ts'
import { keyProviderOf } from './providers.ts'
import { servesModel } from './served.ts'
import { effortsOf, proxiedBase } from './thinking.ts'

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
    const served = [...new Set([...provider.models.map((model) => model.id), ...named])].flatMap(
      (model) => {
        const parsed = ModelId.safeParse(model)
        return parsed.success && accounts.some((row) => servesModel(row, parsed.data))
          ? [parsed.data]
          : []
      },
    )
    // CLIProxy serves one Gemini model under a name per level; the person sees it once, by its
    // `-high` name when it has one.
    const shown = new Map<string, ModelId>()
    for (const model of served) {
      const base = proxiedBase(model)
      if (model.endsWith('-high') || !shown.has(base)) shown.set(base, model)
    }
    const models = served
      .filter((model) => shown.get(proxiedBase(model)) === model)
      .map((model) => ({ id: model, efforts: effortsOf(model) }))
    return models.length === 0 ? [] : [{ ...provider, models }]
  })
}

/** The same, read in the transaction. */
export async function choicesIn(tx: ReadTx, viewer: Viewer, owner: Owner): Promise<Provider[]> {
  const { rows, context } = await accountsOf(tx, viewer.companyId)
  return choicesOf(rows, context, owner, viewer.person.id)
}
