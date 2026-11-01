import type { TestContext } from 'node:test'
import { createIdentity } from '../../hub/identity/public.ts'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { createStatus } from '../../hub/status/public.ts'
import { createHub, subjectsOf } from '../../main.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { shutDown } from '../../platform/lifecycle.ts'
import { heldCompanyPostgres, testAppPorts } from '../../platform/test-app-ports.ts'
import { fakeCloudflare } from '../../platform/test-cloudflare.ts'
import { silent, testWebRoot } from '../../platform/test-database.ts'
import { fakeNeon } from '../../platform/test-neon.ts'

/**
 * A second Hub on the same databases, as after a restart or beside a process that stopped: its
 * own Builder and sessions, nothing shared in memory, its lines in `log`.
 */
export async function hubBeside(t: TestContext, hub: Hub, log: FailureLog = silent) {
  const { test, config } = hub
  const { sendMail } = hub
  const identity = createIdentity({ database: test.database, config, log: silent, sendMail })
  const postgres = heldCompanyPostgres(config)
  const ports = testAppPorts(
    config,
    { neon: fakeNeon(), cloudflare: fakeCloudflare(), postgres },
    hub.builder.folder,
  )
  const subjects = subjectsOf({
    ...{ mastraPool: test.mastraPool, database: test.database, config, identity, sendMail },
    ...{ ...ports, log },
  })
  const status = createStatus({ version: config.version, database: test.database })
  const app = await createHub(config, { status, identity, ...subjects, webRoot: testWebRoot(t) })
  await subjects.conversations.start()
  let closed: Promise<void> | undefined
  /**
   * Shuts the Hub down as an unexpected error does, or, given `settleMs`, as a stop signal does,
   * waiting up to `settleMs` for the answers in flight.
   */
  function close(settleMs?: number) {
    const { settle, close: drain } = subjects.conversations
    closed ??= shutDown([app], { settle, drain, release: async () => undefined }, settleMs)
    return closed
  }
  t.after(() => close())
  const builder = {
    ...hub.builder,
    bucket: ports.bucket,
    control: ports.control,
    knobs: ports.knobs,
  }
  const { assistantMachines } = ports
  return {
    ...hub,
    app,
    runs: subjects.runs,
    mastra: subjects.conversations.mastra,
    builder,
    assistantMachines,
    close,
  }
}
