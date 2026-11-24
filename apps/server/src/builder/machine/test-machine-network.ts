import type { Kit } from './kit.ts'

export function networkOf(control: {
  networkClosed: number
  networkOpenTo?: readonly string[] | undefined
}): Pick<Kit, 'openNetwork' | 'closeNetwork'> {
  return {
    openNetwork: async (extra) => {
      control.networkOpenTo = extra
    },
    closeNetwork: async () => {
      control.networkClosed += 1
      control.networkOpenTo = undefined
    },
  }
}
