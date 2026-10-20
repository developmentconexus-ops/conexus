# Components: the pieces of the Hub's screens and their tokens

The `components` of the [DESIGN.md format](https://github.com/google-labs-code/design.md), kept
apart from the [design guide](../guides/design.md) as a reference for shared pieces
([design V23](../guides/design.md)). Each value names a token of the guide's front matter
or a measure the piece's code in `apps/web/src/ui` and `apps/web/src/brand` holds. The guide owns
the rules; this file only lists the pieces.

Its ceiling is in [delivery L24](../guides/delivery.md): none, because it grows by one short entry
for each piece a screen uses.

## Built

```yaml
button-primary:
  backgroundColor: "{colors.ink}"
  textColor: "{colors.on-ink}"
  rounded: "{rounded.control}"
  padding: "0 0.9rem"
  height: "34px"
  typography: "{typography.label}"
button-default:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.control}"
  padding: "0 0.9rem"
  height: "34px"
  typography: "{typography.label}"
button-default-hover:
  backgroundColor: "{colors.surface-3}"
button-ghost:
  backgroundColor: "transparent"
  textColor: "{colors.text-2}"
  rounded: "{rounded.control}"
  padding: "0 0.9rem"
  height: "34px"
icon-button:
  backgroundColor: "transparent"
  textColor: "{colors.text-2}"
  rounded: "{rounded.control}"
  size: "32px"
nav-item:
  backgroundColor: "transparent"
  textColor: "{colors.text-2}"
  rounded: "{rounded.control}"
  height: "34px"
  padding: "0 0.6rem"
nav-item-hover:
  backgroundColor: "{colors.accent-soft}"
  textColor: "{colors.text}"
nav-item-active:
  backgroundColor: "{colors.surface-3}"
  textColor: "{colors.text}"
input:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.control}"
  padding: "0 0.75rem"
  height: "36px"
label:
  textColor: "{colors.text}"
  typography: "{typography.label}"
field-error:
  textColor: "{colors.danger}"
  typography: "{typography.label}"
notice:
  textColor: "{colors.text}"
  typography: "{typography.body}"
  contract: "children → native polite status paragraph"
initial-action:
  component: "button-default link"
  destination: "root route loading supplies Entrar or Voltar ao início"
invitation-email:
  backgroundColor: "{colors.canvas}"
  contentColor: "{colors.surface}"
  textColor: "{colors.text}"
  secondaryTextColor: "{colors.text-2}"
  borderColor: "{colors.line}"
  rounded: "{rounded.card}"
  button: "button-primary"
  width: "520px, at most"
  padding: "{spacing.xl}"
  fonts: "system fallbacks, no remote resources"
  rendering: "React Email at send time; inline values and dark media query"
frame-phone-top:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text-2}"
  height: "56px"
  padding: "0 {spacing.lg}"
  border: "bottom hairline, {colors.line}"
  shown: "below 768px only"
frame-sidebar:
  backgroundColor: "{colors.surface}"
  width: "16rem, the token --container-sidebar in apps/web/src/brand/tokens.css"
  padding: "{spacing.sm}"
  border: "right hairline, {colors.line}"
frame-sidebar-collapsed:
  width: "3.25rem, the token --container-sidebar-icon"
frame-sidebar-group-label:
  textColor: "{colors.text-2}"
  typography: "{typography.eyebrow}"
  height: "32px, at least; a long company name wraps"
frame-page:
  backgroundColor: "{colors.canvas}"
  padding: "{spacing.xl}"
  width: "64rem at most, the token --container-page"
tooltip:
  backgroundColor: "{colors.ink}"
  textColor: "{colors.on-ink}"
  rounded: "{rounded.control}"
  padding: "{spacing.xs} {spacing.sm}"
welcome-progress:
  backgroundColor: "{colors.line}"
  doneColor: "{colors.ink}"
  rounded: "{rounded.pill}"
  height: "4px"
project-card:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.card}"
  padding: "{spacing.lg}"
  border: "hairline, {colors.line}"
frame-public-column:
  backgroundColor: "{colors.canvas}"
  width: "{containers.column}, at most"
message-column:
  backgroundColor: "{colors.canvas}"
  width: "{containers.message}, at most"
wordmark:
  textColor: "{colors.text}"
  fontFamily: "{typography.display.fontFamily}"
  fontSize: "32px"
  markColor: "{colors.mark}"
avatar:
  backgroundColor: "{colors.surface-3}"
  textColor: "{colors.text-2}"
  rounded: "{rounded.pill}"
  size: "28px"
  typography: "{typography.eyebrow}"
  border: "hairline, {colors.line}"
account-trigger:
  backgroundColor: "transparent"
  rounded: "{rounded.control}"
  height: "48px"
  holds: "avatar, name and e-mail, in the sidebar's foot"
account-trigger-hover:
  backgroundColor: "{colors.accent-soft}"
menu:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.object}"
  padding: "{spacing.sm}"
  width: "12rem, at least"
  border: "hairline, {colors.line}"
menu-item:
  backgroundColor: "transparent"
  textColor: "{colors.text}"
  rounded: "{rounded.control}"
  padding: "0 {spacing.sm}"
  height: "34px"
  typography: "{typography.label}"
menu-item-highlighted:
  backgroundColor: "{colors.surface-3}"
select-trigger:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.control}"
  padding: "0 0.75rem"
  height: "36px"
select-menu:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.object}"
  padding: "{spacing.sm}"
  border: "hairline, {colors.line}"
select-item:
  backgroundColor: "transparent"
  textColor: "{colors.text}"
  rounded: "{rounded.control}"
  padding: "0 2rem 0 {spacing.sm}"
  height: "34px"
  typography: "{typography.label}"
select-item-highlighted:
  backgroundColor: "{colors.surface-3}"
drawer:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  width: "75%, at most {containers.drawer}"
  padding: "{spacing.lg}"
  border: "right hairline, {colors.line}"
drawer-backdrop:
  backgroundColor: "{colors.canvas}, 80% opacity"
button-danger:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.danger}"
  rounded: "{rounded.control}"
  padding: "0 0.9rem"
  height: "34px"
  typography: "{typography.label}"
button-danger-confirm:
  backgroundColor: "{colors.danger}"
  textColor: "{colors.on-ink}"
  rounded: "{rounded.control}"
  padding: "0 0.9rem"
  height: "34px"
  typography: "{typography.label}"
alert-dialog:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.card}"
  width: "{containers.column}, at most the screen less 2rem"
  padding: "{spacing.lg}"
  border: "hairline, {colors.line}"
alert-dialog-backdrop:
  backgroundColor: "{colors.canvas}, 80% opacity"
```

These are the pieces with values of their own; a heading or an alert line is text in its tokens.
The rail's places are `nav-item`, with an 18px icon (design V34). A `select-item` keeps 2rem on the right for its check mark, as shadcn's does. The select is shadcn's base-nova item with these departures: it drops `SelectGroup`, `SelectLabel` and `SelectSeparator`, since a role list has no groups; the trigger is 36px and the item 34px, the brand's control heights, not shadcn's 36px and padded rows; and the popup has a hairline and the brand's `sm` padding, with no shadow. The menu, the select and the drawer take a
hairline, not a shadow, because the brand has no shadow token yet (design V3, V19). A `notice` is a
`role="status"` line in the body color, so it is not mistaken for the grey subtitle under it. The wordmark's "nexus" and the mark take `mark`. A menu item that goes to an address, Base UI's
`Menu.LinkItem`, is the same `menu-item`, and closes the menu as an item does; Base UI leaves it
open by default (`closeOnClick`). The `alert-dialog` is Base UI's `AlertDialog` in the drawer's
dress: a click outside does not close it, Escape and its buttons do, and its first field takes the
focus. It holds the one `button-danger-confirm`; `button-danger` opens it (design V55).

## Brought from the old design, with no code yet

```yaml
icon-button-round-hover:
  backgroundColor: "{colors.accent-soft}"
  textColor: "{colors.accent-text}"
  rounded: "{rounded.pill}"
  size: "32px"
chip:
  backgroundColor: "{colors.surface-3}"
  textColor: "{colors.text-2}"
  rounded: "{rounded.pill}"
  padding: "0 0.55rem"
  height: "1.5rem"
panel:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.object}"
  padding: "1.5rem"
composer:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.composer}"
  padding: "0.7rem 0.8rem 0.4rem"
```
