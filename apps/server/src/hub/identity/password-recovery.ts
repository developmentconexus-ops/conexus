import type { Email, PersonId } from '@conexus/hub-api'
import { Person } from '@conexus/hub-api'
import { and, eq, gt } from 'drizzle-orm'
import type { PublicOrigin } from '../../platform/config.ts'
import type { CommandTx, Database } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import type { SendMail } from '../../platform/mail.ts'
import type { Auth } from './auth.ts'
import {
  forgetLinks,
  hasPassword,
  inLibrary,
  libraryInstallationOn,
  linkTokenOf,
  storedAddress,
} from './auth.ts'
import { SET_PASSWORD_PAGE } from './first-person.ts'
import { recoveryMail } from './messages.ts'
import { verification } from './tables.ts'

const LINK_PACE_MS = 60_000

/** A recovery e-mail to send once the answer is out: the link never leaves the command before. */
export type RecoveryMail = { to: Email; name: string; link: string }

/**
 * The library stamps a link with the application's clock, so the pace reads it with that clock,
 * not the database's.
 */
async function givenWithinPace(tx: CommandTx, personId: PersonId): Promise<boolean> {
  const [recent] = await tx
    .select({ id: verification.id })
    .from(verification)
    .where(
      and(
        eq(verification.value, personId),
        gt(verification.createdAt, new Date(Date.now() - LINK_PACE_MS)),
      ),
    )
    .limit(1)
  return recent !== undefined
}

export function createPasswordRecovery(deps: {
  auth: Auth
  database: Database
  publicOrigin: PublicOrigin
  sendMail: SendMail
}) {
  const libraryInstallation = libraryInstallationOn(deps.auth, deps.database)
  return {
    /**
     * A person with a password gets one new link a minute; anyone else gets nothing, and the
     * caller answers the same (T3A). The address lock makes two asks at once one link.
     */
    request: (email: Email): Promise<RecoveryMail | undefined> =>
      libraryInstallation(async (tx) => {
        await transactionLock(tx, `conexus.person:${storedAddress(email)}`)
        const { internalAdapter } = await deps.auth.$context
        const found = await inLibrary(() => internalAdapter.findUserByEmail(email))
        if (found === null) return undefined
        const person = Person.parse(found.user)
        if (!(await hasPassword(deps.auth, person.id))) return undefined
        if (await givenWithinPace(tx, person.id)) return undefined
        await forgetLinks(tx, person.id)
        const token = await linkTokenOf(() =>
          inLibrary(() => deps.auth.api.requestPasswordReset({ body: { email } })),
        )
        const link = `${deps.publicOrigin}${SET_PASSWORD_PAGE}#token=${token}&kind=recovery`
        return { to: person.email, name: person.name, link }
      }),
    /**
     * Whether a password link is found and unexpired, read and never spent: the native order of
     * `/reset-password` (api/routes/password.mjs:155-160), so a made-up token costs no outside call.
     */
    linkIsLive: (token: string): Promise<boolean> =>
      libraryInstallation(async () => {
        const { internalAdapter } = await deps.auth.$context
        const found = await inLibrary(() =>
          internalAdapter.findVerificationValue(`reset-password:${token}`),
        )
        return found !== null && found.expiresAt >= new Date()
      }),
    send: async (mail: RecoveryMail): Promise<void> => {
      await deps.sendMail(await recoveryMail(mail))
    },
  }
}
