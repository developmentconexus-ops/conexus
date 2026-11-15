import { appendFileSync } from 'node:fs'
import { FAILURES } from '@conexus/hub-api'
import { firstPersonArguments } from './first-person-arguments.ts'
import { roleKit } from './hub/connectors/public.ts'
import { createIdentity, passwordLinkText } from './hub/identity/public.ts'
import { readConfig } from './platform/config.ts'
import { assertMigrated, assertRuntimeLogin, openDatabase } from './platform/database.ts'
import { Failure } from './platform/failure.ts'
import { bootLog } from './platform/lifecycle.ts'
import { createMail } from './platform/mail.ts'
import { migrate } from './platform/migrate.ts'

export async function runMigrate(): Promise<void> {
  const config = readConfig('migrate')
  await migrate({
    ownerUrl: config.migrationDatabaseUrl,
    runtimeUrl: config.databaseUrl,
    mastraUrl: config.mastraDatabaseUrl,
  })
  const log = bootLog(config.logLevel)
  log.info('MASTRA_LOGIN_READY')
  log.info('MIGRATED')
}

export async function runFirstPerson(args: string[]): Promise<void> {
  const input = firstPersonArguments(args)
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
  try {
    await assertRuntimeLogin(database)
    await assertMigrated(database)
    const sendMail = createMail({ config, log })
    const identity = createIdentity({ database, config, log, sendMail, kit: roleKit() })
    const { link } = await identity.firstPerson({ name: input.name, email: input.email })
    appendFileSync(input.summary, passwordLinkText(input.name, link))
    log.info({}, 'FIRST_PERSON_LINK_GIVEN')
  } catch (error) {
    if (error instanceof Failure && error.code === 'FIRST_PERSON_EXISTS') {
      appendFileSync(input.summary, `${FAILURES.FIRST_PERSON_EXISTS.phrase}\n`)
    }
    throw error
  } finally {
    await database.close()
  }
}
