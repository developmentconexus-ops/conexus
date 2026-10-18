import type { CompanyId, Person } from '@conexus/hub-api'
import { CompanyNickname, isReservedNickname } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { AppsDomain } from '../../platform/config.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admit } from './admission.ts'
import { companyDetailOf } from './companies.ts'
import { lockCompany } from './invitations.ts'
import { company } from './tables.ts'

const TAKEN = 'company_nickname_key'

/** The company's nickname in its apps' addresses, or `null` before its owner chooses one. */
export async function companyNicknameOf(
  tx: ReadTx,
  companyId: CompanyId,
): Promise<CompanyNickname | null> {
  const [row] = await tx
    .select({ nickname: company.nickname })
    .from(company)
    .where(eq(company.id, companyId))
  return row?.nickname == null ? null : CompanyNickname.parse(row.nickname)
}

/**
 * The owner chooses the nickname once (founder, N2 A): the same one again answers as if chosen now,
 * another is refused. The company's lock orders two choices at once (code C65), and the unique key
 * refuses one another company holds, also when two companies choose it together.
 */
export function chooseNickname(
  database: Database,
  input: {
    person: Person
    companyId: CompanyId
    nickname: CompanyNickname
    appsDomain: AppsDomain
  },
) {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.person.id } as const
  return database.command(scope, async (tx) => {
    await lockCompany(tx, input.companyId)
    await admit({
      tx,
      personId: input.person.id,
      companyId: input.companyId,
      action: 'chooseNickname',
    })
    const chosen = await companyNicknameOf(tx, input.companyId)
    if (chosen === input.nickname)
      return { company: await companyDetailOf(tx, input), chosen: false }
    if (chosen !== null) throw new Failure('COMPANY_NICKNAME_SET')
    if (isReservedNickname(input.nickname)) throw new Failure('COMPANY_NICKNAME_RESERVED')
    try {
      await tx
        .update(company)
        .set({ nickname: input.nickname })
        .where(eq(company.id, input.companyId))
    } catch (error) {
      if (violatedConstraint(error) === TAKEN) {
        throw new Failure('COMPANY_NICKNAME_TAKEN', { cause: error })
      }
      throw error
    }
    return { company: await companyDetailOf(tx, input), chosen: true }
  })
}
