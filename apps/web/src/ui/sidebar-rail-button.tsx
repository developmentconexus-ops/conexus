import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip.tsx'

/**
 * A place in the rail (web W30): a 40px tile with the place's icon, its name a tooltip and the
 * accessible name. The current one has a lighter fill, its icon in ipê and `aria-current="page"`
 * (design V5); the Link's own active state says which, matching by prefix
 * unless `exact`. `alsoCurrent` marks a place the address of its Link does not cover (Início holds
 * the conversations born there). On touch it reaches 44px without drawing larger.
 */
export function SidebarRailButton(
  props: Pick<LinkProps, 'to' | 'params' | 'search' | 'activeOptions'> & {
    label: string
    icon: LucideIcon
    alsoCurrent?: boolean
  },
) {
  const { label, icon: Icon, alsoCurrent, ...link } = props
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            {...link}
            aria-label={label}
            aria-current={alsoCurrent ? 'page' : undefined}
            data-status={alsoCurrent ? 'active' : undefined}
            className="relative flex size-10 shrink-0 items-center justify-center rounded-control text-text-2 hover:bg-surface-3 hover:text-text data-[status=active]:frame-current data-[status=active]:text-accent-to pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-1/2 [&_svg]:size-5 [&_svg]:shrink-0"
          />
        }
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
