import type { RunsContext } from './context.ts'
import { LIVE } from './store.ts'

const DAY_MS = 86_400_000
const IDLE_MS = 7 * DAY_MS

/**
 * Kills the marked machines no turn has used for seven days (card, the clocks), skipping any whose
 * Projeto has a run not over. The provider lists only the machines carrying this installation's
 * mark (security S36), so a machine of another installation is never seen.
 */
export async function sweep(context: RunsContext): Promise<number> {
  const { store, machines, log } = context
  let killed = 0
  for (const found of await machines.list()) {
    const { companyId, projectId } = found
    const row = await machines.rowOf(companyId, projectId)
    if (row === undefined || row.sandboxId !== found.id) continue
    if (Date.now() - row.usedAt.getTime() < IDLE_MS) continue
    const open = await store.inStates({
      companyId,
      projectId,
      states: [...LIVE],
    })
    if (open.length > 0) continue
    await machines.kill(found.id)
    await machines.forget(companyId, projectId)
    log.info({ companyId, projectId }, 'MACHINE_SWEPT')
    killed += 1
  }
  return killed
}

/** Runs `sweep` at most once a day, from the work that comes (no clock of its own). */
export function dailySweep(context: RunsContext) {
  let last = 0
  return () => {
    if (Date.now() - last < DAY_MS) return
    last = Date.now()
    sweep(context).catch((error: unknown) =>
      context.log.error({ error: String(error) }, 'MACHINE_SWEEP_FAILED'),
    )
  }
}
