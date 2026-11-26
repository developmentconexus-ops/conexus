import type { Kit, KitFactory } from './kit.ts'

export type NetworkControl = {
  networkClosed: number
  /** How many of the next closes of the network fail, as E2B's update does. */
  closeFails: number
  openFails: number
  networkOpenTo?: readonly string[] | undefined
  networkApplied: { name: string; hosts: readonly string[] }[]
}

export function networkOf(
  control: NetworkControl,
  { id: name, allowOut }: Pick<Parameters<KitFactory>[0], 'id' | 'allowOut'>,
): Pick<Kit, 'openNetwork' | 'closeNetwork'> {
  return {
    openNetwork: async (extra) => {
      if (control.openFails > 0) {
        control.openFails -= 1
        throw new Error('503 Service Unavailable')
      }
      control.networkOpenTo = extra
      control.networkApplied.push({ name, hosts: [...allowOut, ...extra] })
    },
    closeNetwork: async () => {
      if (control.closeFails > 0) {
        control.closeFails -= 1
        throw new Error('503 Service Unavailable')
      }
      control.networkClosed += 1
      control.networkOpenTo = undefined
      control.networkApplied.push({ name, hosts: allowOut })
    },
  }
}
