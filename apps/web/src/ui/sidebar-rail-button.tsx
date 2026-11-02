import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip.tsx'

/**
 * A place in the rail (web W30): a 40px tile with the place's icon, its name a tooltip and the
 * accessible name. The current one has the selected fill, `aria-current="page"` and the 2px tick on
 * the rail's left edge (design V5); on touch it reaches 44px without drawing larger.
 */
export function SidebarRailButton(
  props: Pick<LinkProps, 'to' | 'params' | 'search'> & {
    label: string
    icon: LucideIcon
    current: boolean
  },
) {
  const { label, icon: Icon, current, ...link } = props
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            {...link}
            aria-label={label}
            aria-current={current ? 'page' : undefined}
            data-status={current ? 'active' : undefined}
            className="relative flex size-10 shrink-0 items-center justify-center rounded-control text-text-2 hover:bg-surface-3 hover:text-text data-[status=active]:bg-surface-4 data-[status=active]:text-text data-[status=active]:before:absolute data-[status=active]:before:top-1/2 data-[status=active]:before:-left-sm data-[status=active]:before:h-5 data-[status=active]:before:w-[2px] data-[status=active]:before:-translate-y-1/2 data-[status=active]:before:rounded-pill data-[status=active]:before:bg-accent pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-1/2 [&_svg]:size-5 [&_svg]:shrink-0"
          />
        }
      >
        <Icon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
