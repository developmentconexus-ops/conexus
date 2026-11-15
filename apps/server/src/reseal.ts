import { resealModelAccounts } from './builder/model-accounts/public.ts'
import { resealConnections } from './hub/connectors/public.ts'
import { readConfig } from './platform/config.ts'
import { assertMigrated, assertRuntimeLogin, openDatabase } from './platform/database.ts'
import { bootLog } from './platform/lifecycle.ts'

/** Each deploy's step after migrate: moves the credentials off keys that only open (security S32). */
export async function runReseal(): Promise<void> {
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
  try {
    await assertRuntimeLogin(database)
    await assertMigrated(database)
    const accounts = await resealModelAccounts({ database, sealKeys: config.sealKeys })
    const connections = await resealConnections({ database, sealKeys: config.sealKeys })
    const moved = accounts.moved + connections.moved
    log.info({ moved, refused: accounts.refused + connections.refused }, 'RESEALED')
  } finally {
    await database.close()
  }
}
