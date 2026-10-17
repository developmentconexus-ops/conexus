import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `dropdown-menu`, keeping the parts the account menu uses. The
// popup takes a hairline instead of shadcn's shadow, since the brand has no shadow token (V3).
export function DropdownMenu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

export function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

export function DropdownMenuContent({
  align = 'end',
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, 'align' | 'sideOffset'>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            'min-w-48 origin-(--transform-origin) rounded-object border border-line bg-surface p-sm text-text outline-none',
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

export function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

export function DropdownMenuLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn('flex flex-col gap-xs px-sm py-sm', className)}
      {...props}
    />
  )
}

const ITEM =
  'flex h-[34px] cursor-default items-center gap-sm rounded-control px-sm font-body text-label select-none data-highlighted:bg-surface-3 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0'

export function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item data-slot="dropdown-menu-item" className={cn(ITEM, className)} {...props} />
  )
}

/** An item that goes to an address, the same row as `DropdownMenuItem`. */
export function DropdownMenuLinkItem({ className, ...props }: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-item"
      className={cn(ITEM, className)}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-sm my-xs h-px bg-line', className)}
      {...props}
    />
  )
}
