# Design guide

How Conexus looks, moves and speaks. The [DESIGN.md](../../DESIGN.md) at the root, in the
[DESIGN.md format](https://github.com/google-labs-code/design.md), owns the values (colors, type,
radii, spacing, containers, shadows) and the pieces; this guide owns the rules and quotes a value
only where the founder's word names it.

Rules read as the opening of the [delivery guide](delivery.md) says. [Web](web.md) owns
organization and styles. [Delivery L23](delivery.md) owns visible language.

The founder can reopen a screen's choices.

## Overview

**Pauta.** Graphite neutrals, flat and separated by hairlines, keep the person's app the most
colorful thing on screen. Ipê is the warm gold accent; prose is sans and facts are mono. Founder,
2026-11-01: "Aprovo".

## Colors

- **V3.** Every color is a token; only the brand folder holds a raw value, shadows and overlays
  included. Outbound e-mail HTML is an exception: e-mail clients require inline color values [0017].
  Tokens let both themes change in one file. The Prévia's drawn phone frame is the color token
  `phone-frame` (`dark-phone-frame` in the dark theme, where the light value would vanish into the
  stage) rather than a raw value; founder, 2026-10-28, on proposal B, Janela, of the Prévia screen: "1. Sim".
  A provider's logo sits on the color token `logo-plate`, a light plate in both themes like
  `phone-frame`, because a provider draws its symbol for a light ground (step 19, the Integrações
  screen). The logo of every connector is the provider's square symbol without the written name,
  and the kit refuses a wide one (`packages/connectors/src/kernel/logo.ts`); founder, 2026-10-29:
  "só a logo mesmo, igual eu te mandei" and "a logo do Mercado Livre é só a logo, sem escrita".
  [rule to write]
- **V5.** Ipê **should** mark only the current place (the tick of the rail and of the list, the
  active tab), the focus, the caret and the mark, not every resting action, hover or heading. Two
  exceptions: the mark of the item the person chose (V57's toggle icon, the chosen Projeto's check)
  and the busy composer's arc (V28). Founder, 2026-11-01: "Aprovo"; 2026-11-02, on the two
  exceptions: "B". Failure: making everything gold hides the difference between focus and
  decoration. The one other hue is violet, `memory`: it colors only the Memória budget beside Ipê's
  Mensagens. [review]
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
- **V13.** Text **should** stay legible on narrow screens, retaining the reference minimum of 12px
  for prose and for stamps and group labels; the display title adapts from 28/36 to 24/32 below
  640px. Founder, 2026-11-01: "Aprovo". Failure:
  shrinking body copy to fit a list makes the reader zoom to understand it. [review]

## Layout

- **V16.** Spacing comes from the `spacing` scale, and every height, line height, gap and inset is
  a multiple of 4px. Founder, 2026-11-01: "Aprovo". [rule to write]
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
  top-bar drawer ("Abrir navegação"), mark and current place; the drawer holds the rail and the
  list together. Founder, 2026-11-01: "Aprovo". Failure: a frame overflows at 320px
  and puts "Sair" outside the screen. A future layout need not copy the drawer's DOM to retain
  access. [review]
- **V58.** Every list row **should** be 32px on a pointer and 44px on touch; lists side by side
  share the height, so their rules align. Founder, 2026-11-01: "Aprovo". Failure: two lists with
  34 and 40px rows drift apart across the page. [`home.layout.test.ts`, review]
- **V59.** On Início and in a conversation, every block **should** take the center and width of the
  composer (720px, 880px from 1600px wide); a secondary block is half of it less the gutter.
  Founder, 2026-11-01: "Aprovo". Failure: a block with a free width breaks the one axis the eye
  follows. [`home.layout.test.ts`, review]

## Elevation and depth

- **V19.** Pauta **should** use two flat regions separated by a line: the frame (chrome) and the
  white sheet, leaving the frame quiet and the Preview as content. Resting cards do not float;
  only what floats has a shadow: the menu, the popover and the composer. Founder, 2026-11-01:
  "Aprovo". Failure: shadows on every panel look like overlapping windows competing
  with the Preview. [review]

## Shapes

- **V22.** Every radius comes from `rounded`: `control` (8) for buttons and inputs, `object` (12) for windows,
  popovers and panels, `card` (12) for Project cards, `composer` (16) for the composer, `pill` for
  chips. Founder, 2026-11-01: "Aprovo".
  Regions and panes take none. One more radius, 36 px, is for the Prévia's drawn phone frame only,
  as its own token, `rounded.phone`; founder, 2026-10-28: "1. Sim". [rule to write]

## Components

- **V23.** Shared pieces **should** own appearance through brand tokens for color, radius and
  typography, retaining the current ink/on-ink primary action, Hanken Grotesk for display and prose
  and tabular mono facts; every figure that can change (ages, counts, versions, percentages) is set
  in tabular figures. Founder, 2026-11-01: "Aprovo". The piece owns its icon set, sizing and state styling. Tailwind named
  widths avoid brand spacing names (`xs` to `2xl`): Tailwind 4 resolves spacing before containers,
  so `max-w-sm` becomes 0.5rem. Use a distinct container name; numeric, intrinsic and zero widths
  remain valid. Failure: a copied hex misses a theme change, or a spacing name makes a column 8px
  wide. The existing GritQL plugin checks only that width collision, not all token semantics.
  Um diálogo de formulário com vários campos e a ajuda deles usa o tamanho `fields` (janela de
  48rem, tela inteira abaixo de `sm`): a ajuda ao lado dos campos a partir de `md` e acima no
  celular, o corpo rola e o rodapé com os botões fica sempre à vista. `form` fica para um pedido
  curto. [review]
- **V55.** Destructive actions **should** retain the approved distinction: neutral `button-danger`
  with danger text on the page, full-danger `button-danger-confirm` only at the final confirmation
  instead of ink. Founder, 2026-10-14: "B". Failure: two equally red actions obscure which click
  actually removes the item. [review]
- **V57.** The selected item of a toggle (the Prévia's Computador and Celular) has the gold
  `accent-text` icon in both themes; in the dark theme its background is neutral, not the filled
  gold block (the choice is shown, not shouted; one of V5's two exceptions). Founder, 2026-10-28, on proposal B: "2.
  Aprovado"; 2026-10-28, on the icon in the light theme, which was dark grey: "Dourado". [review]
- **V60.** The composer's row **should** be one piece with one order on every screen: on the left
  what the message carries ("+", the Projeto folder, the tools), on the right who answers and how
  (model, memory, microphone, send); a place stays empty only when there is no fact to show, and
  when the box itself is narrower than 416px (a container query, so the Builder's narrow box too)
  words leave, never controls; "Sem ferramentas" stays whole and the model truncates. Founder,
  2026-11-01, the order of the row; 2026-11-03, on the Builder's box: "1. AOkay"; on "Sem
  ferramentas": "2. A". Failure: the
  model sits left on one screen and right on another, and the person looks for it each time.
  [`assistant.layout.test.ts`, review]
- **V61.** The `eyebrow` **should** label a group or a fact (a day group, an age, a stamp), never
  announce a title, and carries no case change. Founder, 2026-11-01: "Aprovo". Failure: a small
  label above a heading reads as a second title and the heading loses its place. [review]

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
  its group makes a square box. An element the program focuses (`tabindex="-1"`, such as the title
  after sign-in) draws no outline; founder, 2026-10-27: "Pode tirar esse contorno, muito feio."
  [`layout.test.ts`, `focus.layout.test.ts`, review]
- **V29.** A disabled action **should** explain a nonobvious impediment and how to resolve it.
  Failure: a permanently disabled button leaves the person with no next step. [review]
- **V30.** Every action **should** have a keyboard path and coherent focus return, including Tab
  order, Esc, drag alternatives and safe text composition. Failure: Tab reaches a control without
  showing where focus is. In the conversation, on a keyboard Enter sends and Shift+Enter breaks the
  line, with no hint under the field; on touch Return breaks the line and the button sends. Under
  the field on a computer sits one small line against pasting secrets. A send takes the person to
  the end, even from higher up. On a phone the line against pasting secrets sits in the empty
  conversation and the model sheet, not under the field. Founder, 2026-10-20: "3. Okay", "4. Sim";
  2026-10-25: "1. A 2.quebra de linha diva sumir 3. B"; 2026-10-26: "D. D1". [review]
- **V31.** Controls **should** have meaningful localized accessible names: labels for inputs and
  pt-BR labels for icon-only buttons. Failure: a screen reader announces only "button" with no
  purpose. Syntactic a11y lint does not prove name quality or language. [review]

- **V32.** A control's drawn height **should** be 32px, and 28px for the action of one row; it does
  not grow on a narrow screen. On a touch screen (`pointer: coarse`) the touch reaches at least
  44 × 44px without drawing the control larger. Menu items, list rows and fields keep their own
  scale. Founder, 2026-10-27: "Aprovado". [`phone.layout.test.ts`, `pieces.layout.test.ts`, review]

## Iconography

- **V34.** Size follows the neighbour: 14px in toolbars, 16px beside a label, 20px in the rail.
  Founder, 2026-11-01: "Aprovo". [`layout.test.ts`, review]
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
