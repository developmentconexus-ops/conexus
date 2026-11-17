import { ACTIONS } from './showcase/actions.tsx'
import { CHAT } from './showcase/chat.tsx'
import { DATA } from './showcase/data.tsx'
import { FEEDBACK } from './showcase/feedback.tsx'
import { FIELDS } from './showcase/fields.tsx'
import { NAVIGATION } from './showcase/navigation.tsx'
import { OVERLAYS } from './showcase/overlays.tsx'
import type { ShowcaseEntry } from './showcase/types.ts'

/** Every piece of ui/, in the order the page shows them (C26: the one owner of the list). */
export const SHOWCASE: readonly ShowcaseEntry[] = [
  ...ACTIONS,
  ...FIELDS,
  ...NAVIGATION,
  ...DATA,
  ...FEEDBACK,
  ...OVERLAYS,
  ...CHAT,
]
