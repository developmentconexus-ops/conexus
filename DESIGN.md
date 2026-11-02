---
version: alpha
name: Conexus Hub, system Pauta
description: One ruled sheet. Graphite chrome a step off white, one white work sheet, every list on a 32px row, ipê gold only where you are.
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
and a rule is cited here by its identifier. Tokens and pieces below are the target of step 13.3;
`apps/web/src/brand/tokens.css` and `apps/web/src/ui/` reach them unit by unit, and a mark
**(target)** names a piece or value the code does not have yet.

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
focus, the text caret and the Conexus mark (V5). A state is a word, with at most a dot of its colour
beside it (V35).

- One 4px base unit: every height, line height, gap and inset is a multiple of 4 (V16).
- One axis (V59): the greeting, composer, Continuar and the Projetos | Ligações pair share one centre
  line and one width.
- One family, Hanken Grotesk, for display and UI; JetBrains Mono only for facts (V11, V23).
- Chrome against sheet is the only tonal split; cards are hairline rules, not floating tiles.

## Colors

A graphite ramp with one warm accent held in reserve. A token has a light and a dark value; the dark
one is written once, with the `dark-` prefix above. The names are the code's; the Pauta's roles map
to them:

| Role | Token | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| Chrome | `canvas` | #F5F6F7 | #121417 | rail, list, phone top bar, the drawers' backdrop |
| Sheet | `surface` | #FFFFFF | #181B1F | the work sheet, composer, popovers, dialogs |
| Raised | `surface-3` | #F0F2F4 | #1F2328 | hover of rows and tiles, the person's bubble, table header, the composer's soft buttons |
| Selected | `surface-4` | #E9ECEF | #262B30 | current row and rail tile, open trigger, the switch's off track |
| Hairline | `line` | #E3E6EA | #2A3036 | every rule, border and seam; a seam, not a boundary that carries meaning |
| Hairline strong | `line-strong` | #8A939C | #6E7780 | control boundaries that must be seen, the scrollbar thumb |
| Ink | `text`, `ink` | #121518 | #EEF0F2 | text; the primary button's fill |
| Ink 2 | `text-2` | #59616A | #A3ABB3 | secondary text |
| On ink | `on-ink` | #FFFFFF | #121518 | text on the primary button and the tooltip |
| Ipê | `accent` | #B07A0C | #F2B53A | the 2px current-place tick, focus outline and field edge, the caret, a busy composer's arc; 3.73:1 on the sheet, never text |
| Ipê text | `accent-text` | #8A6006 | #F2B53A | the only ipê that carries glyphs, such as the check of the chosen Projeto |
| Ipê soft | `accent-soft` | #FBF1D9 | #3A2E12 | text selection |
| Mark | `mark` | #C08A12 | #F2B53A | the Conexus mark on the rail and beside "Assistente"; nothing else |
| Memory | `memory` | #903BDB | #B979FF | the memory ring only |
| Status | `success`, `warning`, `danger` | #1A7F4B, #B54708, #C0283D | #6FD39A, #F5A25B, #F28B9A | always with a word (V35): "Publicado · v3", "Conectar de novo", errors |
| Outside the scheme | `on-accent`, `preview-paper`, `phone-frame`, `logo-plate`, `code-*` | | | on-accent text, the Prévia's page, the drawn phone (#1D2125 light, #3A4148 dark, V3), the light plate under a connector logo (V3), syntax highlighting |

Contrast references (V8): text on the sheet 18.3:1, secondary text 6.3:1, ipê text 5.6:1, status
words 5.0:1 or more.

## Typography

One grotesque for everything: one x-height and one rhythm from greeting to row label. Hanken Grotesk
is self-hosted in `apps/web/src/brand/fonts`, covers weights 400 to 700 in one variable file and has
the tabular figures the stamp and every count use. Bricolage Grotesque, the previous display face,
is retired (V23). Every line height sits on the 4px grid; there are seven sizes (28, 20, 16, 15, 14,
13, 12), and the 24px display replaces 28 below 640px (V13).

| Token | Size / line | Weight, tracking | Where |
| --- | --- | --- | --- |
| `display` | 28 / 36; 24 / 32 below 640px | 600, -0.02em | the Início greeting, one per page |
| `heading` | 20 / 28 | 600, -0.01em | a page title on a list or settings page |
| `title` | 16 / 24 | 600, -0.005em | header bar, dialog and drawer titles, the company name |
| `reading` | 15 / 24 | 400 | long message prose |
| `body` | 14 / 20 | 400 | UI text, the composer field, bubbles, tables |
| `label` | 13 / 20 | 500 (600 on block titles) | rows, buttons, menus, chips |
| `eyebrow` | 12 / 16 | 500, no case change | group labels ("Hoje", "Esta semana"), ages, stamps, menu section heads |
| `fact` | 12 / 16, mono | 400 | timestamps, e-mail, exact values to copy (V11) |

Every figure that can change (ages, counts, versions, percentages) is set with tabular figures. The
`eyebrow` labels a group or a fact; it never announces a title.

## Layout

**Frame, from 768px.** The rail is 56px (`sidebar-icon`) and the list 272px (`list`), together the
328px `sidebar`: fixed, chrome ground, each with its right hairline. Closed, only the rail stays.
The rest is the white sheet (W30).

- **Rail.** Mark tile 40, place tiles 40 with 20px icons, 4px apart; Início, Projetos, Integrações at
  the top, then Configurações and the account (avatar 32) at the foot. The current tile has the
  selected fill and a 2 × 20px ipê tick on the rail's left edge (V5).
- **List.** The company switcher, "Nova conversa" (36px, bordered), then "Conversas" in day groups
  (Hoje, Ontem, Esta semana, Antes) as 32px eyebrow rows and 32px conversation rows with the age at
  the end. The current row has the selected fill and a 2 × 16px tick.
- **Header bar.** 48px, title centred, bottom hairline, desktop only. **Phone top bar:** 52px plus the
  safe-area inset, chrome, bottom hairline: menu, mark, place title.
- **The axis (V59).** `axis` 720px up to 1599px; `axis-wide` 880px from 1600px. A secondary block is
  `half`: (axis − 16px gutter) / 2 = 352px, 432px at 880. In a conversation the transcript, notices
  and composer share the axis.
- **Padding.** Bounded pages 24 inline / 32 block from 768px, 16 / 24 below. The Início stack: 48
  between sections, 24 between greeting and composer. Full-height pages take no frame padding.
- **Spacing scale.** 4, 8, 12, 16, 24, 32, 48, 64, and `row` 32. Widths never reuse these names
  (V23).

| Width | What changes |
| --- | --- |
| below 320px | the composer row wraps: the left group takes its own line |
| below 416px | the composer row drops words, never controls (V60) |
| below 640px | display 28/36 becomes 24/32 |
| below 768px (390 reference) | the rail and the list move together into the left drawer (V56); no header bar; the "+" and Projeto menus become bottom drawers; Início blocks stack in one column; rows are 44 on touch |
| 768px and up | rail and list fixed; popovers; Projetos and Ligações side by side |
| 1600px and up | the axis widens to 880 |

## Elevation & Depth

Flat by default (V19). Two shadows, both for what floats over the sheet: `float` for popovers and
menus, `composer` for the composer card only. Overlays (sheet, dialog, drawer backdrop) dim with
chrome at 80%, not black.

**Motion.** Hover and state colour changes are instant or 150ms; sheets, drawers and the sidebar
width 200ms; collapsible panels 200ms of height. Ambient: a busy composer's ring turns in 2.8s,
working text shimmers in 1.8s, the mark's pieces part and fit back in 1.2s (`--ease-fit`), arrival
0.9s (`--ease-arrive`). Under `prefers-reduced-motion` every transition is none (V26).

## Shapes

Gently rounded, a small set (V22): `control` 8px (buttons, inputs, rows, rail tiles, tooltips),
`object` 12px (popovers, menus, dialogs, bubbles, drawers' top corners), `card` 12px, `composer`
16px, `pill` (chips, switches, soft buttons, send, badges), `phone` 36px (the Prévia's drawn phone
only). Regions (rail, list, sheet, header bar) take none.

**Borders.** 1px `line` for every seam. Ticks are 2px pills.

**Icons** (V34). lucide-react, line icons: 20px on the rail, 16px beside a label, 14px in toolbars
and small buttons, 12px for the "→" of a block's way out. A connector's logo sits on the
`logo-plate`: 24px plate and 16px logo in menus, 20 and 14 on rows and in the tools count. No glyph
or emoji icons.

## Components

Base: shadcn `base-nova` on Base UI (`@base-ui/react`), Tailwind 4, the tokens of
`apps/web/src/brand/tokens.css`. The pieces live in `apps/web/src/ui` and each file's header says
which shadcn file it was copied from; the front matter holds their values. Their rules:

- **Button, icon button.** 32px, label 13/500, radius 8. `icon-button` 32, `icon-button-small` 28
  (a row's own action), `icon-button-soft` 32 pill (the composer's "+" and microphone); on touch the
  target reaches 44 without being drawn larger (V32). Primary is ink on `on-ink`; default is the
  sheet with a hairline, hover raised; ghost is `text-2`. `button-danger` is neutral with danger
  text; `button-danger-confirm` is the danger fill, only at the final confirmation (V55).
- **Input.** 36px, `body`, 16px under `md` (V18). Focus is an ipê edge with a 3px halo at 22%, not an
  outline (V28). Menu search is 32px.
- **Composer.** One piece on the axis, sheet ground, hairline, radius 16, `composer` shadow (V60).
  Left: "+", the Projeto folder, the tools count. Right: model, memory, microphone, send. The field is
  80px tall on Início and 64 on a phone. A busy composer shows the turning ipê arc on its edge.
  **(target)**
- **"+" menu.** A popover 320px wide, 4px padding, `float`, opens up in a conversation and down on
  Início; below 768px a bottom drawer. Rows of 32: "Anexar arquivo", a head with "N de M
  ligadas", one switch row per tool (logo plate 24, "Conector · Nome"), search from 7 rows, the list
  at most 256px, "Conectar outra ferramenta". **(target)**
- **Tools count.** A 32px pill with up to three overlapping logo plates and "N ferramentas" or "Sem
  ferramentas"; below 416px one plate and the count. **(target)**
- **Projeto folder.** A 32px folder pill, with the name (128 at most) once chosen; in a conversation
  the fixed chip with the name, or the folder dimmed with no Projeto, so the tools never move. The
  menu is 288px, search from 7, "Sem Projeto", the chosen one with a check in `accent-text`.
  **(target)**
- **Model button, memory.** The model button is a soft pill with the provider's mark and a short
  label; below 768px it drops "Claude " and the effort. The memory ring with "Memória N%" exists only
  where a conversation does. **(target for the memory's word)**
- **Rail tile, list row, Nova conversa.** As in Layout: tile 40, row 32 (44 on touch), 8px padding,
  `label` in `text-2`, hover raised, current selected with its tick. The account menu opens to the
  right of its 40px tile. **(target)**
- **Block (Início).** A header row of 32 with the title in 600 and its way out ("Todos →"), then
  rows of 32 (44 on touch) with a bottom hairline, the title at the start, an age or a stamp at the
  end; five rows at most, then "Mais N ligações". Loading is a 96px skeleton; empty is a sentence
  row. **(target)**
- **Stamp.** The state in words, `eyebrow` with tabular figures and a 6px dot in the current colour:
  "Publicado · v3" in success, "Em construção · v2" and "Ainda sem app" in `text-2`, "Conectar de
  novo" in warning, "Funcionando" in success (V35). **(target)**
- **Badge.** 20px pill with a hairline and a dot by tone: neutral, success, warning, danger (V35).
- **Chip.** The button's default form as a pill, 32px; the examples under the Início composer.
- **Switch.** Base UI's, 36 × 20; ink when on and `surface-4` when off; it saves on each change and
  waits disabled for the answer.
- **Menus, select.** Surface radius 12, hairline, 4px padding; items 32px, highlighted raised. The
  select's trigger is 36px and its item keeps 2rem on the right for the check. The menu and the
  select have a hairline; only the "+" and Projeto menus carry `float`. **(target for the item height
  and the shadow)**
- **Popover, drawer, sheet.** Popover radius 12, hairline, 288px by default. The bottom drawer is at
  most 85dvh with a 40 × 4 handle and a `title` heading. The left drawer holds the rail and the list
  together (V56); the right panel (`drawer-right`) holds a form beside the page. The alert dialog is
  Base UI's, in the drawer's dress: a click outside does not close it, Escape and its buttons do.
- **Dialog.** Form 384px at most, page 1024, wide 768; radius 12; `title` heading; a footer with a
  hairline.
- **Tabs.** 32px triggers; the active one is ink with a 2px ipê underline, a current-place mark (V5).
- **Table.** Header 40 in `eyebrow`-sized `text-2`, cells 12 padding, row hairline, hover raised; its
  rows keep the table display at every width. A markdown table in a message has a raised header and a
  full hairline grid.
- **Chat messages.** The person's bubble: raised, radius 12, right, 80% at most, the time as a fact
  under it. The assistant's turn is plain text on the sheet, headed by the mark, "Assistente" and the
  model badge, on the axis.
- **Tool row.** A collapsed row with icon, sentence, duration in tabular figures and a chevron;
  it opens on what the tool received and returned (V39).
- **Empty, loading, error.** Empty is one sentence row or a centred column of 448 at most; loading is
  skeletons with a pulse (none under reduced motion) and `role="status"`; an error is danger text
  with `role="alert"` and an action.
- **Notice.** A `role="status"` line in the body colour.
- **Project card.** Card radius, hairline, sheet; the Início shows the Projetos as block rows
  instead. **Settings section:** title and a sentence on the left from `md`, controls on the right,
  parts apart by a hairline (V19).
- **Wordmark, mark.** The wordmark in `display`, "nexus" and the mark in `mark`; the Encaixe mark
  animates while work runs (V26).
- **Invitation e-mail.** React Email at send time with inline values and a dark media query, 520px
  at most, system fonts, no remote resource (V3).
- **Toast.** None exists; the Base UI Toast is the base when a card asks for one.

The current-place tick is the signature: a 2px ipê pill on the left edge of the rail (20 tall) and
of the list (16 tall), paired with the selected fill and `aria-current="page"`. It is the only
coloured element of the chrome.
