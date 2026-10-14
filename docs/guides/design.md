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
components:
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
---

# Design guide

How Conexus looks, moves and speaks. It follows the
[DESIGN.md format](https://github.com/google-labs-code/design.md): the front matter holds the
tokens, and the sections below give the rules under the format's section names. Each rule has an
identifier, at most one sentence of reason, and in brackets the machine that refuses a violation,
"rule to write" when the check is promised and not yet written, or "review". How the web side is organized and how styles are written is [web](web.md); how to use
the shadcn pieces is their maintainers' skill.

The brand folder of the web side defines every color and radius the front matter names, with the
same value. The format's `primary` is our `ink`.

This guide is brought from the old product nearly as it was. Basis: decided before; accepted
because no study judged the design and the founder has not reopened it. A step that changes a
screen may reopen a rule with his word.

## Overview

**"Grafite e Ipê".** Graphite neutrals, flat and separated by hairlines, so the person's own app is
the most colorful thing on screen. Ipê, a warm gold, is the one accent. Prose is sans, facts are
mono.

- **V1.** A screen's regions (top bar, scope rail, page column, panes) take no radius and no shadow;
  hairlines separate them. The person's app is the content, and the frame stays quiet. [review]
- **V2.** Conexus designs its own screens, structure and page patterns, from its own pieces on every
  administration screen [0033]; the Builder conversation's pieces are chosen in step 12. [review]

## Colors

- **V3.** Every color is a token; only the brand folder holds a raw value, shadows and overlays
  included. Tokens let both themes change in one file. [rule to write]
- **V4.** A new token is defined in the light, system-dark and chosen-dark blocks under one name,
  and in the front matter. [review]
- **V5.** Ipê (`accent`) marks only focus, the caret, selection (the chosen value of a control
  included), the active lens and the agent at work; never a resting button fill, a heading or
  decoration. The send button turns ipê on hover. One accent sends the eye to what is happening
  now. [review]
- **V6.** The primary action is `ink` with `on-ink`. [review]
- **V7.** Success, warning and danger mark status only, always beside a word, on low tints of the
  surface; the one exception is the destructive button of V55. [review]
- **V8.** Text keeps 4.5:1 contrast with its ground in both themes. [review]
- **V9.** Light is the default; dark follows the system unless the person picks a theme. [review]

## Typography

- **V10.** Headings use Bricolage Grotesque (`display`, `title`); everything read as language uses
  Hanken Grotesk (`body`, `label`, `eyebrow`). [review]
- **V11.** JetBrains Mono (`fact`) is for facts only: model ids, paths, commands, times, revisions,
  error codes and counts. Mono marks what a person may copy or compare exactly. [review]
- **V12.** Numerals are tabular. [review]
- **V13.** Prose never goes below 12px; mono stamps and group labels never below 11px. [review]
- **V14.** Fonts are self-hosted from the brand folder; no other family and no CDN. [review]
- **V15.** `display` shrinks from 2.1rem to 1.6rem on narrow screens; the front matter gives its
  largest size. [review]

## Layout

- **V16.** Spacing comes from the `spacing` scale. [rule to write]
- **V17.** No `style` attribute in Conexus's own pieces; styles come from tokens. [review]
- **V18.** A screen reflows at 390px wide and at 200% zoom with no sideways scroll. [review]
- **V56.** On a phone the rail becomes a drawer opened from the top bar ("Abrir navegação"), and the
  top bar keeps the mark, the current place and the account. A rail dropped without a drawer takes
  every place with it. [review]

## Elevation and depth

- **V19.** Surfaces are separated by hairlines (`line`), not shadows; a card at rest does not float.
  [review]
- **V20.** A shadow appears only on a hover lift, a popover or a menu, from a token. [review]
- **V21.** No glass, gradient surface, texture or imagery, except the Preview. [review]

## Shapes

- **V22.** Every radius comes from `rounded`: `control` for buttons and inputs, `object` for windows,
  popovers and panels, `card` for Project cards, `composer` for the composer, `pill` for chips.
  Regions and panes take none. [rule to write]

## Components

- **V23.** A component takes its colors, radius and type from tokens. [review]
- **V24.** A new component enters the front matter in the same change. [review]
- **V55.** A destructive action on a page is a `button-danger`, neutral with `danger` text; the full
  `danger` fill, `button-danger-confirm`, is only the final button of its confirmation, in place of
  `ink`. The red fill marks the last step, the real danger; founder, 2026-10-14: "B". [review]

## Motion

- **V25.** **Encaixe** is the one authored motion: the mark's two pieces slide apart and fit back
  while the agent works, and fit once on first load. No second motif, such as an orb, a shimmer or
  a bounce. Movement always means Conexus is working. [review]
- **V26.** All motion stops under `prefers-reduced-motion`, and the end state makes sense without
  it. [review]

## Interaction and accessibility

- **V27.** Hover moves a surface one step up its scale: `surface`, `surface-3`, `surface-4`. Press
  shows a fill and never shrinks. [review]
- **V28.** `:focus-visible` draws a 2px `accent` outline. [review]
- **V29.** A disabled control says why when the reason is not obvious. [review]
- **V30.** Tab reaches every action in reading order, Esc closes what opened, and every drag has a
  keyboard path. [review]
- **V31.** Every input has a label, and every icon-only button a pt-BR `aria-label`. [review]
- **V32.** The console shows no error and no Content Security Policy violation, so no piece injects a
  `<style>` element ([web W22](web.md)). [review]

## Iconography

- **V33.** Icons come from `lucide-react` with its defaults: outline, stroke 2, round caps, colored
  by `currentColor` from a token on the parent. One set at one stroke reads as one product. [review]
- **V34.** Size follows the neighbour: 14px in toolbars, 16px inline, 18px in the rail. [review]
- **V35.** The stop control is the one filled icon. An icon has one meaning and never shows status
  alone; a decorative icon is `aria-hidden`. [review]
- **V36.** Provider logos appear only in model pickers. [review]
- **V37.** No icon font, emoji, text glyph or second icon set. [review]

## Voice

- **V38.** Everything a person reads is in pt-BR, `aria-label` and placeholders included. [review]
- **V39.** Sentence case, capitals only in small group labels. Buttons are verbs ("Permitir", "Ver
  aplicativo"), never a bare "OK". [review]
- **V40.** Text is simple, calm and responsible: no exclamation, empty apology or emoji. The only
  symbols are `·` and `…`. [review]
- **V41.** The product says **você**. In chat the agent is **Conexus** and speaks in the first
  person; in system text it is **o agente**. Product nouns are capitalized: Projeto, Prévia, and the
  lenses Prévia, Código, Alterações and Sobre. [review]
- **V42.** One action has one text everywhere; trying again is always "Tentar de novo", as the failure
  table already says. A non-technical person reads every word as a promise. [review]
- **V43.** A failure's words come from the failure table, by code; the internal code is never shown
  in mono. A failure the person can fix says what to change, and a button appears beside it only when
  its row's action kind asks for one ([code C48](code.md)). [review]
- **V44.** A tool shows as a sentence while it runs and when it ends, never as its technical name.
  Reasoning shows only as "Pensando…". [review]
- **V45.** What is not built says "em breve". Numbers and dates use the Brazilian format ("1.234,5",
  "5 de out."). Examples never invent customers or figures. [review]

## The Build surface

- **V46.** The app is the main area, with the conversation beside it; both survive resizing,
  collapsing and a narrow screen. On a phone a segmented switch swaps them, and both stay mounted.
  [review]
- **V47.** Enter sends and Shift+Enter breaks a line, safely with input methods. [review]
- **V48.** While a question waits, Enter answers it, Stop stays its own control, and the screen says
  "Esperando a sua resposta" with no countdown. [review]
- **V49.** The conversation follows new messages only while the reader stays at its end. [review]
- **V50.** A model change never touches an active run. [review]
- **V51.** The Preview stays usable while new work runs, and an older launch never replaces a newer
  one. [review]
- **V52.** An app that fails its check never replaces the last good version; source that passed and
  then fails to build its Preview stays current with a safe diagnostic. [review]
- **V53.** Code and Changes are read-only; Changes compares a run's base with its result. [review]
- **V54.** A reload rebuilds the conversation, the run, the source and the Preview from the server.
  [review]
