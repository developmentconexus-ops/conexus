import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from './cn.ts'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group.tsx'

// Copied from shadcn's base-nova `combobox`, painted with brand tokens: the list, its items and
// the input with its trigger; the chips, the clear button and the separator are left out. The
// popup takes a hairline instead of a shadow (V3) and no enter/exit animation; the chosen item is
// ipê (V5), as the old picker's was.
export const Combobox = ComboboxPrimitive.Root
export const ComboboxCollection = ComboboxPrimitive.Collection

export function ComboboxValue(props: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

export function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger data-slot="combobox-trigger" className={className} {...props}>
      {children}
      <ChevronDownIcon aria-hidden="true" className="pointer-events-none size-4 text-text-2" />
    </ComboboxPrimitive.Trigger>
  )
}

/** `children` are the group's addons, such as a search icon before the field. */
export function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  ...props
}: ComboboxPrimitive.Input.Props & { showTrigger?: boolean }) {
  return (
    <InputGroup className={cn('w-auto', className)}>
      {children}
      <ComboboxPrimitive.Input render={<InputGroupInput disabled={disabled} />} {...props} />
      {showTrigger && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            render={<ComboboxTrigger />}
            data-slot="input-group-button"
            disabled={disabled}
          />
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'anchor'>) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            'group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-object border border-line bg-surface text-text',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

export function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'max-h-72 scroll-py-xs overflow-y-auto overscroll-contain p-xs data-empty:p-0',
        className,
      )}
      {...props}
    />
  )
}

export function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'relative flex w-full cursor-default items-center gap-sm rounded-control py-xs pr-2xl pl-sm text-body select-none data-highlighted:bg-surface-3 data-selected:bg-accent-soft data-selected:text-accent-text data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-sm flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon aria-hidden="true" className="size-4" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

export function ComboboxGroup(props: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" {...props} />
}

export function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn('px-sm pt-sm pb-xs text-eyebrow text-text-2 uppercase', className)}
      {...props}
    />
  )
}

export function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'hidden w-full justify-center py-sm text-center text-body text-text-2 group-data-empty/combobox-content:flex',
        className,
      )}
      {...props}
    />
  )
}
