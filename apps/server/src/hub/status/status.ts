import type { HubStatus, Version } from '@conexus/hub-api'

export function createStatus(deps: { version: Version }) {
  const status: HubStatus = { version: deps.version }
  return Object.freeze({ read: (): HubStatus => status })
}
