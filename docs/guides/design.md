---
version: alpha
name: Conexus
description: Governed enterprise workbench where an AI agent builds and evolves business applications under explicit authority.
colors:
  canvas: "#F6F7F8"
  surface: "#FFFFFF"
  surface-3: "#EFF1F3"
  surface-4: "#E6E9EC"
  line: "#DDE1E5"
  line-strong: "#8A939C"
  text: "#121518"
  text-2: "#59616A"
  ink: "#121518"
  on-ink: "#FFFFFF"
  accent: "#B07A0C"
  accent-text: "#9A6A08"
  accent-soft: "#FBF1D9"
  mark: "#C08A12"
  memory: "#903BDB"
  success: "#1A7F4B"
  warning: "#B54708"
  danger: "#C0283D"
  on-accent: "#FFFFFF"
  preview-paper: "#FFFFFF"
  dark-canvas: "#0E1012"
  dark-surface: "#16191C"
  dark-surface-3: "#1D2125"
  dark-surface-4: "#262B30"
  dark-line: "#2C3237"
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
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1
  eyebrow:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
  fact:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  control: "6px"
  object: "10px"
  card: "14px"
  composer: "16px"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  2xl: "2.5rem"
containers:
  drawer: "20rem"
  column: "24rem"
  message: "28rem"
---

# Design guide

How Conexus looks, moves and speaks. It follows the
[DESIGN.md format](https://github.com/google-labs-code/design.md). The front matter records the
current visual reference; the web's brand tokens and shared pieces own implementation values, not
an obligatory second hand-maintained table here. The format's `components` live in
[the components list](../reference/components.md).

Rules read as the opening of the [delivery guide](delivery.md) says. [Web](web.md) owns
organization and styles. [Delivery L23](delivery.md) owns visible language.

The design was accepted from the old product before a new study; the founder can reopen a screen's
choices. This method change does not redesign the product.

## Overview

**Grafite e Ipê.** Graphite neutrals, flat and separated by hairlines, keep the person's app the
most colorful thing on screen. Ipê is the warm gold accent; prose is sans and facts are mono.

## Colors

- **V3.** Every color is a token; only the brand folder holds a raw value, shadows and overlays
  included. Outbound e-mail HTML is an exception: e-mail clients require inline color values [0017].
  Tokens let both themes change in one file. [rule to write]
- **V5.** Ipê **should** distinguish current activity and choice: focus, caret, selection, active
  lens and working agent, not every resting action or heading. The send hover keeps its current
  accent. Failure: making everything gold hides the difference between focus and decoration. The
  one other hue is violet, `memory`: it colors only the Memória budget beside Ipê's Mensagens.
  [review]
- **V8.** Text **should** remain readable in both themes, with 4.5:1 as its contrast reference.
  Failure: a pale subtitle disappears on the light background. Syntax lint does not measure
  rendered contrast. [review]
- **V9.** Theme behavior **should** respect the person's choice: light remains the default, dark
  follows the system unless chosen explicitly. Failure: reload loses the preference and returns
  to light. [review]

## Typography

- **V11.** Mono **should** mark exact facts to copy or compare, not the main prose of a message.
  Failure: an internal error code becomes the only explanation, leaving no understandable next
  step. [review]
- **V13.** Text **should** stay legible on narrow screens, retaining the reference minima of 12px
  prose and 11px mono stamps/group labels; display titles adapt from 2.1rem to 1.6rem. Failure:
  shrinking body copy to fit a list makes the reader zoom to understand it. [review]

## Layout

- **V16.** Spacing comes from the `spacing` scale. [rule to write]
- **V17.** Conexus's own web pieces **must not** use an inline `style` attribute, except in
  outbound e-mail HTML. [Biome `nursery.noInlineStyles`]

The matching `biome.json` override sets `linter.rules.nursery.noInlineStyles` to `"error"` for
`apps/web/src/{ui,hub,builder}/**`. Biome 2.5.14's nursery rules are not stable: revalidate the bad
inline/good class cases on upgrade before accepting changed diagnostics. The risk is diagnostic
churn, not runtime style enforcement; do not extend this check to vendor-generated styles.
- **V18.** A screen reflows at 390px wide and at 200% zoom with no sideways scroll; [testing
  T23](testing.md) lists the widths looked at. Under `md` a text field's text is 16px, so a phone
  does not zoom the page into it, and the page stays zoomable. Founder, 2026-10-20: "é coisa
  básica". [`layout.test.ts`, `fields.layout.test.ts`, review]
- **V56.** Narrow navigation **should** retain every destination and the account, with the approved
  top-bar drawer ("Abrir navegação"), mark and current place. Failure: a frame overflows at 320px
  and puts "Sair" outside the screen. A future layout need not copy the drawer's DOM to retain
  access. [review]

## Elevation and depth

- **V19.** Grafite e Ipê **should** use flat regions separated by hairlines, leaving the frame quiet
  and the Preview as content. Resting cards do not float; hover/popover/menu elevation uses shared
  tokens when useful. Failure: shadows on every panel look like overlapping windows competing
  with the Preview. [review]

## Shapes

- **V22.** Every radius comes from `rounded`: `control` for buttons and inputs, `object` for windows,
  popovers and panels, `card` for Project cards, `composer` for the composer, `pill` for chips.
  Regions and panes take none. [rule to write]

## Components

- **V23.** Shared pieces **should** own appearance through brand tokens for color, radius and
  typography, retaining the current ink/on-ink primary action, Bricolage headings, Hanken prose
  and tabular mono facts. The piece owns its icon set, sizing and state styling. Tailwind named
  widths avoid brand spacing names (`xs` to `2xl`): Tailwind 4 resolves spacing before containers,
  so `max-w-sm` becomes 0.5rem. Use a distinct container name; numeric, intrinsic and zero widths
  remain valid. Failure: a copied hex misses a theme change, or a spacing name makes a column 8px
  wide. The existing GritQL plugin checks only that width collision, not all token semantics.
  [review]
- **V55.** Destructive actions **should** retain the approved distinction: neutral `button-danger`
  with danger text on the page, full-danger `button-danger-confirm` only at the final confirmation
  instead of ink. Founder, 2026-10-14: "B". Failure: two equally red actions obscure which click
  actually removes the item. [review]

## Motion

The brand piece retains Encaixe, the mark's pieces separating and fitting while work runs.

- **V26.** Motion **should** respect `prefers-reduced-motion`, including copied library pieces,
  with a comprehensible final state. Failure: the drawer still animates under reduced-motion
  preference. Finding a `motion-reduce` class cannot prove transitive library behavior. [review]

## Interaction and accessibility

- **V28.** `:focus-visible` draws a 2px `accent` outline on buttons, tabs and links. A text field,
  or the group that holds one, shows focus on its own edge instead: an `accent` edge with a soft
  `accent` halo, shadcn's field focus; a busy composer turns its working ring `accent` inside the
  same halo. Founder, 2026-10-20: "1. B". Failure: an outline drawn around a rounded field inside
  its group makes a square box. [`layout.test.ts`, review]
- **V29.** A disabled action **should** explain a nonobvious impediment and how to resolve it.
  Failure: a permanently disabled button leaves the person with no next step. [review]
- **V30.** Every action **should** have a keyboard path and coherent focus return, including Tab
  order, Esc, drag alternatives and safe text composition. Failure: Tab reaches a control without
  showing where focus is. In the conversation, on a keyboard Enter sends and Shift+Enter breaks the
  line, and the hint below the field says so; on touch Return breaks the line, the button sends,
  and the key hint is hidden. A send takes the person to the end, even from higher up. On a phone
  the line against pasting secrets sits in the empty conversation and the model sheet, not under
  the field. Founder, 2026-10-20: "3. Okay", "4. Sim"; 2026-10-25: "1. A 2.quebra de linha diva
  sumir 3. B". [review]
- **V31.** Controls **should** have meaningful localized accessible names: labels for inputs and
  pt-BR labels for icon-only buttons. Failure: a screen reader announces only "button" with no
  purpose. Syntactic a11y lint does not prove name quality or language. [review]

## Iconography

- **V34.** Size follows the neighbour: 14px in toolbars, 16px inline, 18px in the rail.
  [`layout.test.ts`, review]
- **V35.** Status **should** have words, not only a color or icon, and decorative icons stay out of
  the accessible name. Failure: a green circle without a word is undecipherable to someone who
  cannot distinguish its color. The filled Stop remains a detail of its piece. [review]

## Voice

- **V39.** Text **should** be calm, clear sentence case, with actions named by verbs rather than
  bare "OK"; the model's reasoning is shown collapsed, in the model's own words, and each tool
  row opens on what it received and returned. Founder, 2026-10-22: "14.2 e pra vir correcao de
  tudo". Failure: two "OK" buttons do not identify which confirms deletion. Domain names follow
  [code C69](code.md); punctuation and symbol blacklists cannot prove clarity. [review]

Failure wording, allowed actions and the not-found navigation exception have one owner:
[code C48](code.md). This guide does not keep a second failure map.

## The Build surface

- **V54.** The surface **should** reflect server state and versions, preserving conversation,
  reading position and the last usable Preview during work and reload. New messages do not take
  control of a reader away from the end; a model choice does not alter an active run. Source and
  read-only Code/Changes reflect the admitted version and the run's base/result, not an inferred
  client version. An older launch cannot replace newer work; failed checks keep the last good
  app, with a safe diagnostic if current source fails to build. Failure: a connection drops and
  the screen declares completion the server never confirmed. Future conversation controls belong
  in their card, not simulated components to satisfy this guide. [review]
