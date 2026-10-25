---
name: conexus-qa
description: "Tests a Conexus step's screens as a person would, at the candidate commit, as an agent that built none of it: runs the local Hub with provider doubles, walks the card's use script and state matrix in a real browser at 1366 and 390 px and both themes, opens every capture beside its named design, explores off the script as a first-time user, and posts one report of what it saw, read and did not prove. Reports, never fixes. Use when instructions name a step with a screen to test."
---

# QA

## When to use

A step that changes a screen ([testing T25](../../../docs/guides/testing.md)), when and where
[delivery L9](../../../docs/guides/delivery.md) says: beside the reviews, and at each delta.

## Who

An agent that built no unit of the step and has a working browser: Claude, or Codex through Pi.

## What it receives

The pull request, its head commit, the card in `docs/steps/` and the task folder firstmate names.
It reads [`AGENTS.md`](../../../AGENTS.md), this skill, the card, [design](../../../docs/guides/design.md)
and [testing](../../../docs/guides/testing.md).

## Steps

1. Check out the head commit detached; change no repository file.
2. Start a disposable database as [local-database](../../../docs/how-to/local-database.md) says,
   with your own container name and a free port, and export its three variables. Run the local Hub
   the end-to-end journeys use (`tests/e2e/live-hub.ts`), with T24 provider doubles. No paid or
   outside service.
3. Check the browser before the journey: open a blank page and take one capture. Use
   `chrome-devtools-axi` attached to its own instance; when it cannot attach, drive the
   repository's `playwright-core` and its own Chromium from a runner in the task folder. Never
   ports 9333 or 9334.
4. Walk every action of the card's use script. Then every row of its state matrix, including
   loading, server error, not found and expired, forcing each state through the doubles or the
   database, and a turn that calls every tool the model is offered ([testing T24](../../../docs/guides/testing.md)).
5. Capture each criterion's states at 1366 and 390 px, light and dark, and open every capture you
   make. Make a keyboard pass through the focus stops and a 200% zoom check. Horizontal overflow and
   a phone field under 16px ([design V18](../../../docs/guides/design.md)) are the journeys'
   assertions (T25); measure them by hand only while a journey lacks them. Record console errors and
   CSP reports (T23).
6. Open every capture beside its named design or wireframe in the card. Write one entry per
   defect: screen, state, width, theme, what is wrong, the design line or criterion it breaks, and
   the capture's file. Label it as [delivery L12](../../../docs/guides/delivery.md) says.
7. Explore for up to 30 minutes as a first-time user who never read the card, on the step's
   screens and the paths into them: each field empty, spaced, 300 characters, accented, emoji and
   `<b>`; a double submit; back, refresh, a bookmark after logout; two tabs saving in turn; a slow
   or dropped network mid-save; each role; keyboard only; reload after saving; a state another
   screen changes (an account paused or removed); a text a newcomer would misread. Replay each
   find once.
8. Stop your own Hub, browser and container (`docker stop`), and nothing else.

## What it produces

Captures in the task folder, named `<criterion>-<state>-<width>-<theme>.png`. Nothing is committed to the repository (delivery L21). One comment on
the pull request:

```markdown
QA of <head commit>. Captures opened: <n> of <n>, in the task folder.

## Seen
<action or state, and what the screen showed>

## Explored
<each probe of step 7, and what happened>

## Read only
<what was checked in code or logs, not on screen>

## Not proved
<each state or criterion not induced, and why>

## Findings
1. <Bloqueia | Fechamento | Issue futura> <screen, state, width, theme>: <what is wrong>.
   Breaks: <rule id, criterion or loss>. Capture: <file>.
```

"No findings" is allowed only beside the count of captures opened.

## Stop and ask

- The browser cannot start by either path.
- The card names no design for a screen, or a state cannot be forced without changing code.

## When it closes

The comment names the commit it tested. QA never fixes: its findings join the fix round (L9).
