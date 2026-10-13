# 0009. Neon's free plan until the first company, with the databases asleep

## Context

The founder found the paid price high and wants the system working before companies are asked to join. The price he was given assumed the old Hub, which kept its database awake: implemented so, not purpose.

## Decision

An organization of Conexus's own on Neon's free plan; it moves to the paid plan when the first company enters. With nobody using it, the Hub leaves its databases asleep. Basis: the founder's answer, after explanation.

## Criterion

Declared for step 2, not run: the Hub live, nobody signed in, no run for ten minutes; both databases show as asleep; the next request answers, with the wake time measured.

## Result

Not run.

## Consequences

Six hours of history only: a mistake seen the next day cannot be undone, which is why the plan changes with the first company. Every job is shaped to let the database sleep.

## Reopens when

A cause that keeps the database awake cannot leave. Then the free allowance ends near day 17 and Neon suspends it, or the organization moves to the paid plan; the founder chooses.

## State

Brought. Founder, 2026-10-13: "2. B ... Neon pago apenas quando tiver as empresa elas nem sabem que vou epdir, então sistema tem que estar funcional primeiro".
