---
version: alpha
name: Conexus Hub, system Pauta
description: One ruled sheet. Graphite chrome a step off white, one white work sheet, every list on a 32px row, ipê gold only where you are, and on what you chose.
colors:
  canvas: "#F5F6F7"
  surface: "#FFFFFF"
  surface-3: "#F0F2F4"
  surface-4: "#E9ECEF"
  line: "#E3E6EA"
  line-strong: "#8A939C"
  text: "#121518"
  text-2: "#59616A"
  ink: "#121518"
  on-ink: "#FFFFFF"
  accent: "#B07A0C"
  accent-text: "#8A6006"
  accent-soft: "#FBF1D9"
  mark: "#C08A12"
  memory: "#903BDB"
  success: "#1A7F4B"
  warning: "#B54708"
  danger: "#C0283D"
  on-accent: "#FFFFFF"
  preview-paper: "#FFFFFF"
  phone-frame: "#1D2125"
  logo-plate: "#FFFFFF"
  code-keyword: "#CF222E"
  code-string: "#0A3069"
  code-comment: "#6E7781"
  code-function: "#8250DF"
  code-constant: "#0550AE"
  code-parameter: "#953800"
  code-expression: "#116329"
  dark-canvas: "#121417"
  dark-surface: "#181B1F"
  dark-surface-3: "#1F2328"
  dark-surface-4: "#262B30"
  dark-line: "#2A3036"
  dark-line-strong: "#6E7780"
  dark-text: "#EEF0F2"
  dark-text-2: "#A3ABB3"
  dark-ink: "#EEF0F2"
  dark-on-ink: "#121518"
  dark-accent: "#F2B53A"
  dark-accent-text: "#F2B53A"
  dark-accent-soft: "#3A2E12"
  dark-mark: "#F2B53A"
  dark-memory: "#B979FF"
  dark-success: "#6FD39A"
  dark-warning: "#F5A25B"
  dark-danger: "#F28B9A"
  dark-on-accent: "#FFFFFF"
  dark-preview-paper: "#FFFFFF"
  dark-phone-frame: "#3A4148"
  dark-logo-plate: "#FFFFFF"
  dark-code-keyword: "#FF7B72"
  dark-code-string: "#A5D6FF"
  dark-code-comment: "#8B949E"
  dark-code-function: "#D2A8FF"
  dark-code-constant: "#79C0FF"
  dark-code-parameter: "#FFA657"
  dark-code-expression: "#7EE787"
typography:
  display:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.02em"
  display-narrow:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    letterSpacing: "-0.005em"
  reading:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  eyebrow:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  fact:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
    fontFeature: "\"tnum\" 1"
rounded:
  control: "8px"
  object: "12px"
  card: "12px"
  composer: "16px"
  pill: "999px"
  phone: "36px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  4xl: "64px"
  control: "32px"
  control-sm: "28px"
  row: "32px"
containers:
  drawer: "20.5rem"
  column: "24rem"
  message: "28rem"
  page: "64rem"
  wide: "48rem"
  sidebar-icon: "3.5rem"
  list: "17rem"
  sidebar: "20.5rem"
  axis: "45rem"
  axis-wide: "55rem"
  half: "22rem"
  phone: "390px"
shadows:
  float: "0 1px 2px rgb(18 21 24 / 0.04), 0 8px 24px -8px rgb(18 21 24 / 0.14)"
  composer: "0 1px 2px rgb(18 21 24 / 0.04), 0 6px 20px -10px rgb(18 21 24 / 0.12)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-default-hover:
    backgroundColor: "{colors.surface-3}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-danger-confirm:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.control}"
    size: "32px"
  icon-button-small:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.control}"
    size: "28px"
  icon-button-soft:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.pill}"
    size: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
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
  composer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.composer}"
    width: "{containers.axis}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "32px"
  badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "20px"
  switch:
    backgroundColor: "{colors.surface-4}"
    rounded: "{rounded.pill}"
    width: "36px"
    height: "20px"
  switch-on:
    backgroundColor: "{colors.ink}"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  rail-tile:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.control}"
    size: "40px"
  rail-tile-current:
    backgroundColor: "{colors.surface-4}"
    textColor: "{colors.text}"
  list-row:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "{spacing.row}"
  list-row-hover:
    backgroundColor: "{colors.surface-3}"
  list-row-current:
    backgroundColor: "{colors.surface-4}"
    textColor: "{colors.text}"
  new-conversation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "36px"
  block-row:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    padding: "0 8px"
    height: "{spacing.row}"
  menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.object}"
    padding: "4px"
    width: "12rem, at least; the composer's menus 320px"
  menu-item:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "{spacing.row}"
  menu-item-highlighted:
    backgroundColor: "{colors.surface-3}"
  select-trigger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  bubble-person:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.object}"
    padding: "8px 12px"
  frame-sidebar:
    backgroundColor: "{colors.canvas}"
    width: "{containers.sidebar}"
  frame-phone-top:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text-2}"
    height: "52px"
    padding: "0 {spacing.lg}"
  frame-page:
    backgroundColor: "{colors.surface}"
    padding: "{spacing.xl}"
    width: "{containers.page}"
  drawer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.object}"
    padding: "{spacing.lg}"
    width: "75%, at most {containers.drawer}"
  drawer-right:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    padding: "{spacing.lg}"
    width: "the screen, at most {containers.message}"
  table-row:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    padding: "{spacing.md} {spacing.sm}"
  table-row-header:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
  settings-section:
    padding: "{spacing.xl} 0 0"
    width: "16rem title column from md, 20rem from lg, then the controls"
  alert-dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.object}"
    padding: "{spacing.lg}"
    width: "{containers.column}, at most the screen less 2rem"
  project-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "{spacing.md} {spacing.lg}"
  avatar:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-2}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
    size: "32px"
  welcome-progress:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.pill}"
    height: "4px"
  wordmark:
    textColor: "{colors.text}"
    typography: "{typography.display}"
  invitation-email:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "{spacing.xl}"
    width: "520px, at most"
---

# Design system: Conexus Hub, "Pauta"

This file owns the values and the pieces; the [design guide](docs/guides/design.md) owns the rules,
and a rule is cited here by its identifier. Every value of the front matter is the target of step
13.3; `apps/web/src/brand/tokens.css` and `apps/web/src/ui/` reach them unit by unit, and a mark
**(target)** names a piece, or a part of one, that the code does not have yet.

## Overview

**The ruled sheet** (the *talão de pedidos*, a counter order pad). The Hub is an Operate surface: a
company owner or administrator comes to ask about the company's data, pick up a conversation and see
what is built and what broke. Its ruled lines become the pauta (V58): one row pitch, 32px on a
pointer screen and 44px on touch, for every list. Lists side by side share the pitch, so their
hairlines line up. Its numbered carbon copy becomes the version stamp ("Publicado · v3") in tabular
figures.

Two materials only. Chrome (rail, list, phone top bar) is graphite a step off white; the work sheet
is pure white and the only white region (V19). Depth is a hairline, never a fill change between
neighbours of the same kind. Colour is withheld: ipê gold marks the current place, the keyboard
focus, the text caret (its selection included) and the Conexus mark, then the mark of an item the
person chose and the busy composer's arc (V28), the two exceptions of V5. A state is a word, with at
most a dot of its colour beside it (V35).

- One 4px base unit: every height, line height, gap and inset is a multiple of 4 (V16).
- One axis (V59): the greeting, composer, Continuar and the Projetos | Ligações pair share one centre
  line and one width.
- One family, Hanken Grotesk, for display and UI; JetBrains Mono only for facts (V11, V23).
- Chrome against sheet is the only tonal split; cards are hairline rules, not floating tiles.

## Colors

A graphite ramp with one warm accent held in reserve. A token has a light and a dark value; the dark
one is written once, with the `dark-` prefix above. The names are the code's; the Pauta's roles map
to them:

| Role | Token | Use |
| --- | --- | --- |
| Chrome | `canvas` | rail, list, phone top bar, the drawers' backdrop |
| Sheet | `surface` | the work sheet, composer, popovers, dialogs |
| Raised | `surface-3` | hover of rows and tiles, the person's bubble, table header, the composer's soft buttons |
| Selected | `surface-4` | current row and rail tile, open trigger, the switch's off track |
| Hairline | `line` | every rule, border and seam; a seam, not a boundary that carries meaning |
| Hairline strong | `line-strong` | control boundaries that must be seen, the scrollbar thumb |
| Ink | `text`, `ink` | text; the primary button's fill |
| Ink 2 | `text-2` | secondary text |
| On ink | `on-ink` | text on the primary button and the tooltip |
| Ipê | `accent` | the 2px current-place tick, focus outline and field edge, the caret, a busy composer's arc (V28); never text |
| Ipê text | `accent-text` | the only ipê that carries glyphs: the mark of the item the person chose, such as a toggle's icon and the check of the chosen Projeto (V57) |
| Ipê soft | `accent-soft` | text selection, with the caret (V5) |
| Mark | `mark` | the Conexus mark on the rail and beside "Assistente"; nothing else |
| Memory | `memory` | the memory ring only |
| Status | `success`, `warning`, `danger` | always with a word (V35): "Publicado · v3", errors |
| Outside the scheme | `on-accent`, `preview-paper`, `phone-frame`, `logo-plate`, `code-*` | on-accent text, the Prévia's page, the drawn phone (V3), the light plate under a connector logo (V3), syntax highlighting |

Contrast references (V8): text on the sheet 18.3:1, secondary text 6.3:1, ipê text 5.6:1, status
words 5.0:1 or more.

## Typography

One grotesque for everything: one x-height and one rhythm from greeting to row label. Hanken Grotesk
is self-hosted in `apps/web/src/brand/fonts`, covers weights 400 to 700 in one variable file and has
the tabular figures the stamp and every count use. Bricolage Grotesque, the previous display face,
is retired (V23). Every line height sits on the 4px grid. There are nine text tokens: seven Hanken
sizes, `display-narrow` as the form of `display` below 640px (V13), and the mono `fact`.

| Token | Where |
| --- | --- |
| `display`, `display-narrow` | the Início greeting, one per page |
| `heading` | a page title on a list or settings page |
| `title` | header bar, dialog and drawer titles, the company name |
| `reading` | long message prose |
| `body` | UI text, the composer field, bubbles, tables |
| `label` | rows, buttons, menus, chips; 600 on block titles |
| `eyebrow` | group labels ("Hoje", "Esta semana"), ages, stamps, menu section heads |
| `fact` | mono: timestamps, e-mail, exact values to copy (V11) |

Every figure that can change (ages, counts, versions, percentages) is set with tabular figures
(V23). The `eyebrow` labels a group or a fact; it never announces a title (V61).

## Layout

**Frame, from 768px.** The rail (`sidebar-icon`) and the list (`list`) are together the `sidebar`:
fixed, chrome ground, each with its right hairline. Closed, only the rail stays. The rest is the
white sheet (W30).

- **Rail.** The mark tile and the place tiles are `rail-tile` with the rail icon size (V34), `xs`
  apart; Início, Projetos, Integrações at the top, then Automações right after Integrações (only for
  an owner or an administrator; founder, 2026-11-02, "Opção 1"); Configurações, the bell just above
  the account, and the account (`avatar`) at the foot. The current tile has the selected fill and a
  2px-wide ipê tick on the rail's left edge (V5).
- **List.** The company switcher, "Nova conversa" (bordered), then "Conversas" in day groups (Hoje,
  Ontem, Esta semana, Antes) as `eyebrow` rows and conversation rows of `spacing.row` with the age
  at the end. The current row has the selected fill and a shorter tick.
- **Header bar.** Title centred, bottom hairline, desktop only. **Phone top bar:** chrome, bottom
  hairline, the safe-area inset: menu, mark, place title. While a notification is unread the menu
  button carries a small `danger` dot, the colour of the bell's count (ipê marks no attention, it
  is held for the current place and focus), and its name adds the count (founder, 2026-11-02,
  "2B", emergência).
- **The axis (V59).** `axis`, and `axis-wide` from 1600px wide. A secondary block is `half`: the
  axis less the gutter, divided by two. In a conversation the transcript, notices and composer share
  the axis.
- **Padding.** Bounded pages take `xl` inline and `2xl` block from 768px, `lg` and `xl` below. The
  Início stack: `3xl` between sections, `xl` between greeting and composer. Full-height pages take
  no frame padding.
- **Spacing scale.** The `spacing` tokens, with `row` as the list pitch (V58). Widths never reuse
  these names (V23).

| Width | What changes |
| --- | --- |
| a box below 320px | the composer row wraps: the left group takes its own line |
| a box below 416px | the composer row drops words, never controls; measured on the box, so the Builder's narrow box too (V60) |
| below 640px | `display` becomes `display-narrow` |
| below 768px (390 reference) | the rail and the list move together into the left drawer (V56); no header bar; the "+" and Projeto menus become bottom drawers; Início blocks stack in one column; rows are 44 on touch |
| 768px and up | rail and list fixed; popovers; Projetos and Ligações side by side |
| 1600px and up | the axis widens to `axis-wide` |

## Elevation & Depth

Flat by default (V19). Two shadows, both for what floats over the sheet: `float` for popovers and
menus, `composer` for the composer card only. Overlays (sheet, dialog, drawer backdrop) dim with
chrome at 80%, not black.

**Motion.** Hover and state colour changes are instant or 150ms; sheets, drawers and the sidebar
width 200ms; collapsible panels 200ms of height. Ambient: a busy composer's ring turns in 2.8s,
working text shimmers in 1.8s, the mark's pieces part and fit back in 1.2s (`--ease-fit`), arrival
0.9s (`--ease-arrive`). Under `prefers-reduced-motion` every transition is none (V26).

## Shapes

Gently rounded, a small set (V22): `control` (buttons, inputs, rows, rail tiles, tooltips),
`object` (popovers, menus, dialogs, bubbles, drawers' top corners), `card`, `composer`, `pill`
(chips, switches, soft buttons, send, badges), `phone` (the Prévia's drawn phone only). Regions
(rail, list, sheet, header bar) take none.

**Borders.** 1px `line` for every seam. Ticks are 2px pills.

**Icons** (V34). lucide-react, line icons, sized by the neighbour: the rail, a label, a toolbar or
small button, and a smaller one for the "→" of a block's way out. A connector's logo sits on the
`logo-plate`: 24px plate and 16px logo in menus, 20 and 14 on rows and in the tools count. No glyph
or emoji icons.

## Components

Base: shadcn `base-nova` on Base UI (`@base-ui/react`), Tailwind 4, the tokens of
`apps/web/src/brand/tokens.css`. The pieces live in `apps/web/src/ui` and each file's header says
which shadcn file it was copied from; the front matter holds their values. Their rules:

- **Button, icon button.** `spacing.control` tall, in `label`, `rounded.control`. `icon-button`,
  `icon-button-small` (a row's own action), `icon-button-soft` (the composer's "+" and microphone);
  on touch the target reaches 44 without being drawn larger (V32). Primary is ink on `on-ink`;
  default is the sheet with a hairline, hover raised; ghost is `text-2`. `button-danger` is neutral
  with danger text; `button-danger-confirm` is the danger fill, only at the final confirmation
  (V55).
- **Input.** `input.height`, `body`, 16px under `md` (V18). Focus is an ipê edge with a 3px halo at
  22%, not an outline (V28). Menu search is `spacing.control` tall.
- **Composer.** One piece on the axis, sheet ground, hairline, `rounded.composer`, `composer` shadow
  (V60). Left: "+", the Projeto folder, the tools count. Right: model, memory, microphone, send. The
  field is 80px tall on Início and 64 on a phone. A busy composer shows the turning ipê arc on its
  edge (V28). **(target)**
- **"+" menu.** A popover of the composer's `menu` width and padding, `float`, opens up in a
  conversation and down on Início; below 768px a bottom drawer. `menu-item` rows: "Anexar arquivo",
  a head with "N de M ligadas", one switch row per tool (logo plate 24, "Conector · Nome"), search
  from 7 rows, the list at most 256px, "Conectar outra ferramenta". **(target)**
- **Tools count.** A `spacing.control` pill with up to three overlapping logo plates and "N
  ferramentas" or "Sem ferramentas"; in a box below 416px one plate and the count, while "Sem
  ferramentas" stays whole and the model truncates instead (V60). **(target)**
- **Projeto folder.** A `spacing.control` folder pill, with the name (128 at most) once chosen; in
  a conversation the fixed chip with the name, or the folder dimmed with no Projeto, so the tools
  never move. The menu is 288px, search from 7, "Sem Projeto", the chosen one with a check in
  `accent-text` (V57). **(target)**
- **Model button, memory.** The model button is a soft pill with the provider's mark and a short
  label; below 768px it drops "Claude " and the effort. The memory ring with "Memória N%" exists only
  where a conversation does. **(target for the memory's word)**
- **Rail tile, list row, Nova conversa.** As in Layout: `rail-tile`, `list-row` (44 on touch) with
  its padding, `label` in `text-2`, hover raised, current selected with its tick. The account menu
  opens to the right of its `rail-tile`. **(target)**
- **Block (Início).** A header row of `spacing.row` with the title in 600 and, on Projetos and
  Ligações, its way out ("Todos →"); Continuar has none, since the list beside it already holds
  every conversation. Then `block-row` rows (44 on touch) with a bottom hairline, the title at the
  start, an age or a stamp at the end; five rows at most, then "Mais N ligações". Loading is a 96px
  skeleton; empty is a sentence row. **(target)**
- **Stamp.** The state in words, `eyebrow` with tabular figures and a 6px dot in the current colour:
  "Publicado · v3" in success, "Em construção · v2" and "Ainda sem app" in `text-2`. A connection
  takes the word and tone of `stateBadge`, and none when it was never tested.
  **(target)**
- **Badge.** A `badge` pill with a hairline and a dot by tone: neutral, success, warning, danger
  (V35).
- **Chip.** The button's default form as a pill, `chip`; the examples under the Início composer.
- **Switch.** Base UI's, at the `switch` size; ink when on and `surface-4` when off; it saves on
  each change and waits disabled for the answer.
- **Menus, select.** `menu`: surface, `rounded.object`, hairline, its padding; `menu-item` items,
  highlighted raised. A menu item that goes to an address, Base UI's `Menu.LinkItem`, is the same
  `menu-item` and closes the menu as an item does; Base UI leaves it open by default
  (`closeOnClick`). The select is
  shadcn's base-nova item with departures: no `SelectGroup`, `SelectLabel` or `SelectSeparator`,
  since a role list has no groups; its trigger is `select-trigger` and its item keeps 2rem on the
  right for the check. The menu and the select have a hairline; only the "+" and Projeto menus
  carry `float`. **(target for the item height and the shadow)**
- **Popover, drawer, sheet.** Popover `rounded.object`, hairline, 288px by default. The bottom
  drawer is at most 85dvh with a 40 × 4 handle and a `title` heading. The left drawer holds the
  rail and the list together (V56); the right panel (`drawer-right`) holds a form beside the page.
  The alert dialog is Base UI's, in the drawer's dress: a click outside does not close it, Escape
  and its buttons do, and its first field takes the focus.
- **Dialog.** Four sizes, as `ui/dialog.tsx` names them: `form` (`containers.column`), `page`
  (`containers.page`), `fields` (`containers.wide`) and `ask` (a card under `sm`, `fields` above);
  `object` radius; `title` heading; a footer with a hairline.
- **Tabs.** 32px triggers; the active one is ink with a 2px ipê underline, a current-place mark (V5).
- **Table.** Header 40 in `label`, `text-2`, cells with the `table-row` padding, row hairline,
  hover raised; its rows keep the table display at every width. A markdown table in a message has
  a raised header and a full hairline grid.
- **Chat messages.** The person's bubble: raised, `rounded.object`, right, 80% at most, the time as
  a fact under it. The assistant's turn is plain text on the sheet, headed by the mark,
  "Assistente" and the model badge, on the axis.
- **Tool row.** A collapsed row with icon, sentence, duration in tabular figures and a chevron;
  it opens on what the tool received and returned (V39).
- **Empty, loading, error.** Empty is one sentence row or a centred column of 448 at most; loading is
  skeletons with a pulse (none under reduced motion) and `role="status"`; an error is danger text
  with `role="alert"` and an action.
- **Notice.** A `role="status"` line in the body colour.
- **Project card.** Card radius, hairline, sheet; the Início shows the Projetos as block rows
  instead. **Settings section:** title and a sentence on the left from `md`, controls on the right,
  parts apart by a hairline (V19).
- **Public column, message column.** The screens outside the frame (sign-in, invitation) sit in a
  `canvas` column of `containers.column` at most; a short message screen in `containers.message`. The
  `initial-action` of the root route's loading state is a default button link, "Entrar" or "Voltar
  ao início". The Project card's preview is a `surface-3` tile of 112px from `sm` (a 64px square at
  the card's start on a phone) holding the name's first letter in `display` until a Projeto has a
  picture of its app.
- **Wordmark, mark.** The wordmark in `display`, "nexus" and the mark in `mark`; the Encaixe mark
  animates while work runs (V26).
- **Invitation e-mail.** React Email at send time with inline values and a dark media query, the
  `invitation-email` width, system fonts, no remote resource (V3).
- **Toast.** None exists; the Base UI Toast is the base when a card asks for one.

The current-place tick is the signature: a 2px ipê pill on the left edge of the rail (20 tall) and
of the list (16 tall), paired with the selected fill and `aria-current="page"`. It is the only
coloured element of the chrome.
