import type { CopyQueue, CopyTasks, LakeStacks, LakeTables } from '../../platform/aws.ts'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CopySource } from '../connectors/public.ts'
import { companiesWithConnections } from '../connectors/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { CopyClock } from './lake-copy.ts'
import { createLakeCopies } from './lake-routes.ts'
import type { StartClock } from './lake-run.ts'
import { createLakeRuns } from './lake-run.ts'

/**
 * The lake copies of the Hub (step "A primeira cópia chega ao lago"): the rounds, with the queue's
 * consumer, over the copy's AWS ports and the connections' reach, and the routes that write and
 * run a copy over those rounds and the connection's clock.
 */
export function lakeCopiesOf(deps: {
  database: Database
  identity: IdentityPorts
  log: FailureLog
  config: Pick<Config, 'aws'>
  copyTasks: CopyTasks
  copyQueue: CopyQueue
  lakeTables: LakeTables
  lakeStacks: LakeStacks
  source: CopySource
  clock: CopyClock
  tuning?: { now?: (() => Date) | undefined }
  /** A test's clock for a leave's wait on its task's stop. */
  copyStopWait?: StartClock
}) {
  const { database, log, source } = deps
  const lakeRuns = createLakeRuns({
    ...{ database, log, source, tasks: deps.copyTasks, copy: deps.config.aws.copy },
    tables: deps.lakeTables,
    ...{ queue: deps.copyQueue, companies: () => companiesWithConnections(database) },
  })
  const lakeCopies = createLakeCopies({
    ...{ database, log, source, identity: deps.identity, runs: lakeRuns, clock: deps.clock },
    ...{ tasks: deps.copyTasks, tables: deps.lakeTables, stacks: deps.lakeStacks },
    ...{ now: deps.tuning?.now, stopWait: deps.copyStopWait },
  })
  return { lakeRuns, lakeCopies }
}
