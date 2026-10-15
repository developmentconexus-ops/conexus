# Components: the pieces of the Hub's screens and their tokens

The `components` of the [DESIGN.md format](https://github.com/google-labs-code/design.md), kept
apart from the [design guide](../guides/design.md) so a step that adds a piece adds its entry in the
same change ([design V24](../guides/design.md)). Each value names a token of the guide's front matter
or a measure the piece's code holds. The guide owns the rules; this file only lists the pieces.

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
icon-button-round-hover:
  backgroundColor: "{colors.accent-soft}"
  textColor: "{colors.accent-text}"
  rounded: "{rounded.pill}"
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
project-card:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.card}"
composer:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.composer}"
  padding: "0.7rem 0.8rem 0.4rem"
frame-top-bar:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text-2}"
  height: "56px"
  padding: "0 {spacing.lg}"
  border: "bottom hairline, {colors.line}"
frame-rail:
  backgroundColor: "{colors.surface}"
  width: "14rem"
  padding: "{spacing.md}"
  border: "right hairline, {colors.line}"
frame-page:
  backgroundColor: "{colors.canvas}"
  padding: "{spacing.xl}"
frame-public-column:
  backgroundColor: "{colors.canvas}"
  width: "24rem, at most"
avatar:
  backgroundColor: "{colors.surface-3}"
  textColor: "{colors.text-2}"
  rounded: "{rounded.pill}"
  size: "28px"
  typography: "{typography.eyebrow}"
  border: "hairline, {colors.line}"
menu:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  rounded: "{rounded.object}"
  padding: "{spacing.xs}"
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
drawer:
  backgroundColor: "{colors.surface}"
  textColor: "{colors.text}"
  width: "75%, at most 20rem"
  padding: "{spacing.lg}"
  border: "right hairline, {colors.line}"
drawer-backdrop:
  backgroundColor: "{colors.canvas}, 80% opacity"
```

The rail's places are `nav-item`, with an 18px icon (design V34). The menu and the drawer take a
hairline, not a shadow, because the brand has no shadow token yet (design V3, V20).
