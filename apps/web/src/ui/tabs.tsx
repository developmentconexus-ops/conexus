import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `tabs`, painted with brand tokens: the `line` list only, whose
// active tab takes the Ipê underline (design V5).
export function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('group/tabs flex flex-col gap-sm', className)}
      {...props}
    />
  )
}

export function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('inline-flex w-fit items-center gap-xs text-text-2', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex h-8 items-center justify-center gap-xs whitespace-nowrap rounded-control px-md text-label hover:text-text data-active:text-text disabled:pointer-events-none disabled:opacity-50 after:absolute after:inset-x-md after:-bottom-px after:h-0.5 after:bg-accent after:opacity-0 data-active:after:opacity-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('flex-1 text-body', className)}
      {...props}
    />
  )
}
