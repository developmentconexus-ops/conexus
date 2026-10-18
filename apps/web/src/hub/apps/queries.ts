import { createAppHandoff } from '@conexus/hub-api'
import { hubMutation } from '../../platform/hub.ts'

// A pass changes nothing the screens read, so it keeps the cache (web W12).
export const openAppHandoff = {
  ...hubMutation(createAppHandoff),
  meta: { keepCache: true },
} as const
