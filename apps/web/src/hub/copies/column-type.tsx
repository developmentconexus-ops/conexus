import type { LucideIcon } from 'lucide-react'
import {
  BracesIcon,
  CalendarClockIcon,
  CalendarIcon,
  DecimalsArrowRightIcon,
  HashIcon,
  ToggleLeftIcon,
  TypeIcon,
} from 'lucide-react'
import { typeText } from './text.ts'

const TYPE_ICON: Readonly<Record<string, LucideIcon>> = {
  bigint: HashIcon,
  numeric: DecimalsArrowRightIcon,
  text: TypeIcon,
  date: CalendarIcon,
  timestamp: CalendarClockIcon,
  boolean: ToggleLeftIcon,
  json: BracesIcon,
}

/** The icon of a column's type, named by the type in words; a column outside the definition, or a type with no icon, has none. */
export function ColumnTypeIcon({ type }: { type: string | undefined }) {
  if (type === undefined) return null
  const Icon = TYPE_ICON[type]
  if (Icon === undefined) return null
  return <Icon role="img" aria-label={typeText(type)} className="size-4 shrink-0 text-text-2" />
}
