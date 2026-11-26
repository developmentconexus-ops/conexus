import type { NetworkDomain, NetworkOpened } from '@conexus/hub-api'
import type { Kit, KitFactory } from './kit.ts'

export type NetworkControl = {
  openFails: number
  networkOpenTo?: readonly string[] | undefined
  /** Every change a machine took, in order; `'ALL'` is the whole internet. */
  networkApplied: { name: string; hosts: readonly string[] | 'ALL' }[]
}

export function listsDouble() {
  const listed: NetworkDomain[] = []
  return {
    listed,
    opened: async (): Promise<NetworkOpened> => ({ kind: 'LIST', hosts: [...listed] }),
  }
}

export function networkOf(
  control: NetworkControl,
  { id: name, allowOut }: Pick<Parameters<KitFactory>[0], 'id' | 'allowOut'>,
): Pick<Kit, 'openNetwork' | 'openAll'> {
  function answer() {
    if (control.openFails > 0) {
      control.openFails -= 1
      throw new Error('503 Service Unavailable')
    }
  }
  return {
    openNetwork: async (extra) => {
      answer()
      control.networkOpenTo = extra
      control.networkApplied.push({ name, hosts: [...allowOut, ...extra] })
    },
    openAll: async () => {
      answer()
      control.networkOpenTo = undefined
      control.networkApplied.push({ name, hosts: 'ALL' })
    },
  }
}
