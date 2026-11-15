import { MastraCompositeStore } from '@mastra/core/storage'
import { ObservabilityStoragePostgresVNext, PostgresStore } from '@mastra/pg'
import type { MastraPool } from '../../platform/database.ts'

const MAX_AGE = '14d'

/**
 * Mastra's tables in Mastra's database, schema `mastra`, on the pool `main.ts` owns (decision 0010,
 * data D27). Mastra creates them at start with `CREATE TABLE IF NOT EXISTS`; Conexus code never
 * writes them (data D1). The traces, logs and metrics are Mastra's v-next observability domain on
 * the same pool, in day tables that `prune()` drops past `MAX_AGE` (decision 0068), routed by the
 * composite store as Mastra's observability guide does; `PostgresStoreVNext` would do the same but
 * prints a raw warning on a shared pool (`@mastra/pg` 1.35.0 `dist/index.js:27620-27669`).
 */
export function createMastraStorage(pool: MastraPool): MastraCompositeStore {
  return new MastraCompositeStore({
    id: 'conexus-mastra',
    default: new PostgresStore({ id: 'conexus-mastra-default', pool, schemaName: 'mastra' }),
    domains: {
      observability: new ObservabilityStoragePostgresVNext({ pool, schemaName: 'mastra' }),
    },
    retention: {
      observability: {
        spans: { maxAge: MAX_AGE },
        metrics: { maxAge: MAX_AGE },
        logs: { maxAge: MAX_AGE },
      },
    },
  })
}
