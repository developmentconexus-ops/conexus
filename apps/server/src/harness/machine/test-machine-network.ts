import type { Kit } from './kit.ts'

export type NetworkControl = {
  networkClosed: number
  /** How many of the next closes of the network fail, as E2B's update does. */
  closeFails: number
  networkOpenTo?: readonly string[] | undefined
}

export function networkOf(control: NetworkControl): Pick<Kit, 'openNetwork' | 'closeNetwork'> {
  return {
    openNetwork: async (extra) => {
      control.networkOpenTo = extra
    },
    closeNetwork: async () => {
      if (control.closeFails > 0) {
        control.closeFails -= 1
        throw new Error('503 Service Unavailable')
      }
      control.networkClosed += 1
      control.networkOpenTo = undefined
    },
  }
}
