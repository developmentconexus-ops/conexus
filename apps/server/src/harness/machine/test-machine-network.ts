import type { NetworkDomain } from '@conexus/hub-api'
import type { Kit, KitFactory } from './kit.ts'

export type NetworkControl = {
  openFails: number
  networkOpenTo?: readonly string[] | undefined
  networkApplied: { name: string; hosts: readonly string[] }[]
}

export function listsDouble() {
  const listed: NetworkDomain[] = []
  return { listed, opened: async () => [...listed] }
}

export function networkOf(
  control: NetworkControl,
  { id: name, allowOut }: Pick<Parameters<KitFactory>[0], 'id' | 'allowOut'>,
): Pick<Kit, 'openNetwork'> {
  return {
    openNetwork: async (extra) => {
      if (control.openFails > 0) {
        control.openFails -= 1
        throw new Error('503 Service Unavailable')
      }
      control.networkOpenTo = extra
      control.networkApplied.push({ name, hosts: [...allowOut, ...extra] })
    },
  }
}
